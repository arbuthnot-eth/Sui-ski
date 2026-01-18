/// MVR: Move Registry - A pristine package registry for Sui Move contracts
///
/// Inspired by Bun's approach to package management: fast, simple, beautiful.
///
/// Package naming: @{namespace}/{package}
/// - namespace: SuiNS name (e.g., "suifrens", "mysten")
/// - package: lowercase alphanumeric with hyphens (e.g., "core", "nft-utils")
///
/// Version format: {major}.{minor}.{patch} stored as u64 tuple
module mvr::registry {
    use std::string::{Self, String};
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::dynamic_field;
    use sui::dynamic_object_field;
    use sui::table::{Self, Table};
    use sui::vec_map::{Self, VecMap};
    use sui::event;
    use sui::clock::{Self, Clock};
    use sui::package::{UpgradeCap};

    // ========== Error Codes ==========
    const ENotAuthorized: u64 = 0;
    const EPackageExists: u64 = 1;
    const EPackageNotFound: u64 = 2;
    const EVersionExists: u64 = 3;
    const EVersionNotFound: u64 = 4;
    const EInvalidName: u64 = 5;
    const EInvalidVersion: u64 = 6;
    const ENamespaceTaken: u64 = 7;
    const ENamespaceNotFound: u64 = 8;
    const EDeprecated: u64 = 9;
    const EInvalidUpgradeCap: u64 = 10;

    // ========== Core Structs ==========

    /// Global registry - shared object holding all namespaces
    public struct Registry has key {
        id: UID,
        /// Total number of namespaces
        namespace_count: u64,
        /// Total number of packages
        package_count: u64,
        /// Total number of versions
        version_count: u64,
        /// Admin capability ID for governance
        admin_cap: ID,
    }

    /// Admin capability for registry governance
    public struct AdminCap has key, store {
        id: UID,
    }

    /// Namespace - owned by SuiNS name holder
    /// Stored as dynamic field on Registry with key = namespace name
    public struct Namespace has key, store {
        id: UID,
        /// Namespace name (matches SuiNS name)
        name: String,
        /// Owner address (should match SuiNS name owner)
        owner: address,
        /// Packages in this namespace
        package_count: u64,
        /// When this namespace was created
        created_at: u64,
        /// Optional display name
        display_name: Option<String>,
        /// Optional description
        description: Option<String>,
        /// Optional avatar URL
        avatar_url: Option<String>,
        /// Optional website
        website: Option<String>,
    }

    /// Package - a Move package in the registry
    /// Stored as dynamic object field on Namespace with key = package name
    public struct Package has key, store {
        id: UID,
        /// Full name: @{namespace}/{name}
        full_name: String,
        /// Package name (without namespace)
        name: String,
        /// Namespace this belongs to
        namespace: String,
        /// Current latest version
        latest_version: Version,
        /// Package address on Sui (from UpgradeCap)
        package_id: ID,
        /// UpgradeCap ID (proves ownership)
        upgrade_cap_id: ID,
        /// Total downloads (for stats)
        downloads: u64,
        /// When first published
        created_at: u64,
        /// When last updated
        updated_at: u64,
        /// Is this package deprecated?
        deprecated: bool,
        /// Deprecation message if deprecated
        deprecation_message: Option<String>,
        /// Package metadata
        metadata: PackageMetadata,
    }

    /// Package metadata
    public struct PackageMetadata has store, copy, drop {
        /// Short description
        description: String,
        /// Repository URL (GitHub, etc.)
        repository: Option<String>,
        /// Documentation URL
        documentation: Option<String>,
        /// Homepage URL
        homepage: Option<String>,
        /// License (e.g., "MIT", "Apache-2.0")
        license: Option<String>,
        /// Keywords for search
        keywords: vector<String>,
        /// Icon URL
        icon_url: Option<String>,
    }

    /// Version information
    public struct Version has store, copy, drop {
        major: u64,
        minor: u64,
        patch: u64,
    }

    /// Version entry - stored as dynamic field on Package
    public struct VersionEntry has store, copy, drop {
        /// Version tuple
        version: Version,
        /// Package ID for this version
        package_id: ID,
        /// When published
        published_at: u64,
        /// Changelog/release notes
        changelog: Option<String>,
        /// Git tag or commit hash
        git_ref: Option<String>,
    }

    /// Publisher capability - proves ownership of a namespace
    public struct PublisherCap has key, store {
        id: UID,
        /// Namespace this cap controls
        namespace: String,
    }

    // ========== Events ==========

    public struct RegistryCreated has copy, drop {
        registry_id: ID,
        admin_cap_id: ID,
    }

    public struct NamespaceCreated has copy, drop {
        namespace: String,
        owner: address,
        created_at: u64,
    }

    public struct PackagePublished has copy, drop {
        full_name: String,
        namespace: String,
        package_name: String,
        package_id: ID,
        version: Version,
        published_at: u64,
    }

    public struct VersionPublished has copy, drop {
        full_name: String,
        version: Version,
        package_id: ID,
        published_at: u64,
    }

    public struct PackageDeprecated has copy, drop {
        full_name: String,
        message: String,
    }

    public struct OwnershipTransferred has copy, drop {
        namespace: String,
        from: address,
        to: address,
    }

    // ========== Initialization ==========

    /// Create the global registry (one-time setup)
    fun init(ctx: &mut TxContext) {
        let admin_cap = AdminCap {
            id: object::new(ctx),
        };
        let admin_cap_id = object::id(&admin_cap);

        let registry = Registry {
            id: object::new(ctx),
            namespace_count: 0,
            package_count: 0,
            version_count: 0,
            admin_cap: admin_cap_id,
        };

        event::emit(RegistryCreated {
            registry_id: object::id(&registry),
            admin_cap_id,
        });

        transfer::share_object(registry);
        transfer::transfer(admin_cap, tx_context::sender(ctx));
    }

    // ========== Namespace Management ==========

    /// Claim a namespace (should match your SuiNS name)
    public entry fun claim_namespace(
        registry: &mut Registry,
        name: String,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        // Validate name (lowercase, alphanumeric, hyphens allowed)
        assert!(is_valid_name(&name), EInvalidName);

        // Check namespace doesn't exist
        let name_bytes = *string::bytes(&name);
        assert!(!dynamic_field::exists_(&registry.id, name_bytes), ENamespaceTaken);

        let sender = tx_context::sender(ctx);
        let now = clock::timestamp_ms(clock);

        let namespace = Namespace {
            id: object::new(ctx),
            name,
            owner: sender,
            package_count: 0,
            created_at: now,
            display_name: option::none(),
            description: option::none(),
            avatar_url: option::none(),
            website: option::none(),
        };

        // Create publisher capability
        let publisher_cap = PublisherCap {
            id: object::new(ctx),
            namespace: name,
        };

        event::emit(NamespaceCreated {
            namespace: name,
            owner: sender,
            created_at: now,
        });

        // Store namespace as dynamic field
        dynamic_field::add(&mut registry.id, name_bytes, namespace);
        registry.namespace_count = registry.namespace_count + 1;

        // Transfer publisher cap to sender
        transfer::transfer(publisher_cap, sender);
    }

    /// Update namespace metadata
    public entry fun update_namespace(
        registry: &mut Registry,
        publisher_cap: &PublisherCap,
        display_name: Option<String>,
        description: Option<String>,
        avatar_url: Option<String>,
        website: Option<String>,
        _ctx: &mut TxContext,
    ) {
        let name_bytes = *string::bytes(&publisher_cap.namespace);
        let namespace: &mut Namespace = dynamic_field::borrow_mut(&mut registry.id, name_bytes);

        namespace.display_name = display_name;
        namespace.description = description;
        namespace.avatar_url = avatar_url;
        namespace.website = website;
    }

    // ========== Package Publishing ==========

    /// Publish a new package to the registry
    public entry fun publish_package(
        registry: &mut Registry,
        publisher_cap: &PublisherCap,
        upgrade_cap: &UpgradeCap,
        package_name: String,
        description: String,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        // Validate package name
        assert!(is_valid_name(&package_name), EInvalidName);

        let namespace_name = publisher_cap.namespace;
        let name_bytes = *string::bytes(&namespace_name);

        // Get namespace
        let namespace: &mut Namespace = dynamic_field::borrow_mut(&mut registry.id, name_bytes);

        // Build full name
        let full_name = build_full_name(&namespace_name, &package_name);

        // Check package doesn't exist in namespace
        let pkg_key = *string::bytes(&package_name);
        assert!(!dynamic_object_field::exists_(&namespace.id, pkg_key), EPackageExists);

        let now = clock::timestamp_ms(clock);
        let package_id = sui::package::upgrade_package(upgrade_cap);
        let upgrade_cap_id = object::id(upgrade_cap);

        let initial_version = Version { major: 1, minor: 0, patch: 0 };

        let metadata = PackageMetadata {
            description,
            repository: option::none(),
            documentation: option::none(),
            homepage: option::none(),
            license: option::none(),
            keywords: vector[],
            icon_url: option::none(),
        };

        let package = Package {
            id: object::new(ctx),
            full_name,
            name: package_name,
            namespace: namespace_name,
            latest_version: initial_version,
            package_id,
            upgrade_cap_id,
            downloads: 0,
            created_at: now,
            updated_at: now,
            deprecated: false,
            deprecation_message: option::none(),
            metadata,
        };

        // Store initial version entry
        let version_entry = VersionEntry {
            version: initial_version,
            package_id,
            published_at: now,
            changelog: option::none(),
            git_ref: option::none(),
        };
        dynamic_field::add(&mut package.id, version_to_key(&initial_version), version_entry);

        event::emit(PackagePublished {
            full_name,
            namespace: namespace_name,
            package_name,
            package_id,
            version: initial_version,
            published_at: now,
        });

        // Store package in namespace
        dynamic_object_field::add(&mut namespace.id, pkg_key, package);
        namespace.package_count = namespace.package_count + 1;
        registry.package_count = registry.package_count + 1;
        registry.version_count = registry.version_count + 1;
    }

    /// Publish a new version of an existing package
    public entry fun publish_version(
        registry: &mut Registry,
        publisher_cap: &PublisherCap,
        upgrade_cap: &UpgradeCap,
        package_name: String,
        major: u64,
        minor: u64,
        patch: u64,
        changelog: Option<String>,
        git_ref: Option<String>,
        clock: &Clock,
        _ctx: &mut TxContext,
    ) {
        let namespace_name = publisher_cap.namespace;
        let name_bytes = *string::bytes(&namespace_name);

        // Get namespace and package
        let namespace: &mut Namespace = dynamic_field::borrow_mut(&mut registry.id, name_bytes);
        let pkg_key = *string::bytes(&package_name);
        let package: &mut Package = dynamic_object_field::borrow_mut(&mut namespace.id, pkg_key);

        // Validate UpgradeCap matches
        assert!(object::id(upgrade_cap) == package.upgrade_cap_id, EInvalidUpgradeCap);

        let new_version = Version { major, minor, patch };

        // Validate version is newer
        assert!(is_version_greater(&new_version, &package.latest_version), EInvalidVersion);

        // Check version doesn't exist
        let version_key = version_to_key(&new_version);
        assert!(!dynamic_field::exists_(&package.id, version_key), EVersionExists);

        let now = clock::timestamp_ms(clock);
        let package_id = sui::package::upgrade_package(upgrade_cap);

        let version_entry = VersionEntry {
            version: new_version,
            package_id,
            published_at: now,
            changelog,
            git_ref,
        };

        event::emit(VersionPublished {
            full_name: package.full_name,
            version: new_version,
            package_id,
            published_at: now,
        });

        // Store version and update package
        dynamic_field::add(&mut package.id, version_key, version_entry);
        package.latest_version = new_version;
        package.package_id = package_id;
        package.updated_at = now;
        registry.version_count = registry.version_count + 1;
    }

    /// Update package metadata
    public entry fun update_metadata(
        registry: &mut Registry,
        publisher_cap: &PublisherCap,
        package_name: String,
        description: Option<String>,
        repository: Option<String>,
        documentation: Option<String>,
        homepage: Option<String>,
        license: Option<String>,
        icon_url: Option<String>,
        clock: &Clock,
        _ctx: &mut TxContext,
    ) {
        let namespace_name = publisher_cap.namespace;
        let name_bytes = *string::bytes(&namespace_name);

        let namespace: &mut Namespace = dynamic_field::borrow_mut(&mut registry.id, name_bytes);
        let pkg_key = *string::bytes(&package_name);
        let package: &mut Package = dynamic_object_field::borrow_mut(&mut namespace.id, pkg_key);

        if (option::is_some(&description)) {
            package.metadata.description = option::destroy_some(description);
        };
        package.metadata.repository = repository;
        package.metadata.documentation = documentation;
        package.metadata.homepage = homepage;
        package.metadata.license = license;
        package.metadata.icon_url = icon_url;
        package.updated_at = clock::timestamp_ms(clock);
    }

    /// Deprecate a package
    public entry fun deprecate_package(
        registry: &mut Registry,
        publisher_cap: &PublisherCap,
        package_name: String,
        message: String,
        _ctx: &mut TxContext,
    ) {
        let namespace_name = publisher_cap.namespace;
        let name_bytes = *string::bytes(&namespace_name);

        let namespace: &mut Namespace = dynamic_field::borrow_mut(&mut registry.id, name_bytes);
        let pkg_key = *string::bytes(&package_name);
        let package: &mut Package = dynamic_object_field::borrow_mut(&mut namespace.id, pkg_key);

        package.deprecated = true;
        package.deprecation_message = option::some(message);

        event::emit(PackageDeprecated {
            full_name: package.full_name,
            message,
        });
    }

    /// Transfer namespace ownership
    public entry fun transfer_namespace(
        registry: &mut Registry,
        publisher_cap: PublisherCap,
        new_owner: address,
        ctx: &mut TxContext,
    ) {
        let namespace_name = publisher_cap.namespace;
        let name_bytes = *string::bytes(&namespace_name);

        let namespace: &mut Namespace = dynamic_field::borrow_mut(&mut registry.id, name_bytes);
        let old_owner = namespace.owner;
        namespace.owner = new_owner;

        event::emit(OwnershipTransferred {
            namespace: namespace_name,
            from: old_owner,
            to: new_owner,
        });

        transfer::transfer(publisher_cap, new_owner);
    }

    // ========== Read Functions ==========

    /// Get namespace info
    public fun get_namespace(registry: &Registry, name: &String): &Namespace {
        let name_bytes = *string::bytes(name);
        dynamic_field::borrow(&registry.id, name_bytes)
    }

    /// Get package info
    public fun get_package(registry: &Registry, namespace: &String, package_name: &String): &Package {
        let ns = get_namespace(registry, namespace);
        let pkg_key = *string::bytes(package_name);
        dynamic_object_field::borrow(&ns.id, pkg_key)
    }

    /// Get version entry
    public fun get_version(package: &Package, version: &Version): &VersionEntry {
        let version_key = version_to_key(version);
        dynamic_field::borrow(&package.id, version_key)
    }

    /// Get registry stats
    public fun get_stats(registry: &Registry): (u64, u64, u64) {
        (registry.namespace_count, registry.package_count, registry.version_count)
    }

    // ========== Helper Functions ==========

    /// Validate name (lowercase alphanumeric with hyphens)
    fun is_valid_name(name: &String): bool {
        let bytes = string::bytes(name);
        let len = vector::length(bytes);

        if (len == 0 || len > 64) return false;

        let i = 0;
        while (i < len) {
            let c = *vector::borrow(bytes, i);
            // a-z: 97-122, 0-9: 48-57, hyphen: 45
            let is_lowercase = c >= 97 && c <= 122;
            let is_digit = c >= 48 && c <= 57;
            let is_hyphen = c == 45;

            if (!is_lowercase && !is_digit && !is_hyphen) return false;

            // Can't start or end with hyphen
            if (is_hyphen && (i == 0 || i == len - 1)) return false;

            i = i + 1;
        };

        true
    }

    /// Build full package name
    fun build_full_name(namespace: &String, package_name: &String): String {
        let mut result = string::utf8(b"@");
        string::append(&mut result, *namespace);
        string::append_utf8(&mut result, b"/");
        string::append(&mut result, *package_name);
        result
    }

    /// Convert version to storage key
    fun version_to_key(v: &Version): vector<u8> {
        let mut key = vector[];
        vector::append(&mut key, bcs::to_bytes(&v.major));
        vector::append(&mut key, bcs::to_bytes(&v.minor));
        vector::append(&mut key, bcs::to_bytes(&v.patch));
        key
    }

    /// Check if v1 > v2
    fun is_version_greater(v1: &Version, v2: &Version): bool {
        if (v1.major > v2.major) return true;
        if (v1.major < v2.major) return false;
        if (v1.minor > v2.minor) return true;
        if (v1.minor < v2.minor) return false;
        v1.patch > v2.patch
    }

    /// Format version as string
    public fun version_to_string(v: &Version): String {
        let mut s = string::utf8(b"");
        string::append(&mut s, u64_to_string(v.major));
        string::append_utf8(&mut s, b".");
        string::append(&mut s, u64_to_string(v.minor));
        string::append_utf8(&mut s, b".");
        string::append(&mut s, u64_to_string(v.patch));
        s
    }

    /// Convert u64 to string
    fun u64_to_string(n: u64): String {
        if (n == 0) return string::utf8(b"0");

        let mut digits = vector[];
        let mut num = n;
        while (num > 0) {
            let digit = ((num % 10) as u8) + 48; // ASCII '0' = 48
            vector::push_back(&mut digits, digit);
            num = num / 10;
        };

        vector::reverse(&mut digits);
        string::utf8(digits)
    }

    // ========== Accessors ==========

    public fun package_full_name(p: &Package): String { p.full_name }
    public fun package_name(p: &Package): String { p.name }
    public fun package_namespace(p: &Package): String { p.namespace }
    public fun package_id(p: &Package): ID { p.package_id }
    public fun package_version(p: &Package): Version { p.latest_version }
    public fun package_downloads(p: &Package): u64 { p.downloads }
    public fun package_deprecated(p: &Package): bool { p.deprecated }
    public fun package_metadata(p: &Package): &PackageMetadata { &p.metadata }

    public fun metadata_description(m: &PackageMetadata): &String { &m.description }
    public fun metadata_repository(m: &PackageMetadata): &Option<String> { &m.repository }
    public fun metadata_documentation(m: &PackageMetadata): &Option<String> { &m.documentation }
    public fun metadata_homepage(m: &PackageMetadata): &Option<String> { &m.homepage }
    public fun metadata_license(m: &PackageMetadata): &Option<String> { &m.license }
    public fun metadata_icon_url(m: &PackageMetadata): &Option<String> { &m.icon_url }

    public fun version_major(v: &Version): u64 { v.major }
    public fun version_minor(v: &Version): u64 { v.minor }
    public fun version_patch(v: &Version): u64 { v.patch }

    public fun namespace_name(n: &Namespace): String { n.name }
    public fun namespace_owner(n: &Namespace): address { n.owner }
    public fun namespace_package_count(n: &Namespace): u64 { n.package_count }
}
