# MVR Compatibility Layer

A unified interface for resolving MVR (Move Registry) packages using multiple naming formats and version resolution strategies.

## Features

- ✅ **Multiple naming formats** - @namespace/package, namespace.sui/package, namespace/package
- ✅ **Version resolution** - Latest, specific version, semver
- ✅ **Cross-network compatibility** - Automatic fallback between mainnet/testnet
- ✅ **Caching layer** - Performance optimization
- ✅ **Error handling** - Invalid names, missing packages, network errors

## Quick Start

```typescript
import { MVRResolver, createMVRResolver } from './sdk/mvr-resolver'
import type { Env } from './types'

const env: Env = {
  SUI_NETWORK: 'mainnet',
  SUI_RPC_URL: 'https://fullnode.mainnet.sui.io:443',
  // ...
}

const resolver = createMVRResolver(env)

// Resolve a package
const result = await resolver.resolve('@myname/mypackage')
if (result.package) {
  console.log('Package address:', result.package.address)
}
```

## Supported Naming Formats

### @namespace/package (Recommended)

```typescript
await resolver.resolve('@myname/mypackage')
await resolver.resolve('@myname/mypackage/2')  // Version 2
await resolver.resolve('@myname/mypackage@1.0.0')  // Semver
```

### namespace.sui/package

```typescript
await resolver.resolve('myname.sui/mypackage')
await resolver.resolve('myname.sui/mypackage/2')
```

### namespace/package

```typescript
await resolver.resolve('myname/mypackage')
await resolver.resolve('myname/mypackage/2')
```

## Version Resolution

### Latest Version (Default)

```typescript
const result = await resolver.resolve('@myname/mypackage')
// Returns the latest version
```

### Specific Version Number

```typescript
const result = await resolver.resolve('@myname/mypackage/2')
// Returns version 2
```

### Semver Format

```typescript
const result = await resolver.resolve('@myname/mypackage@1.0.0')
// Maps semver to version number (uses major version)
```

## Cross-Network Resolution

The resolver can automatically fall back to a different network if the primary network fails:

```typescript
const result = await resolver.resolve('@myname/mypackage', {
  network: 'mainnet',
  fallbackNetwork: true,  // Try testnet if mainnet fails
})
```

**Result includes:**
- `package` - The resolved package info (or null)
- `network` - Which network was used
- `usedFallback` - Whether fallback network was used
- `error` - Error message if resolution failed

## API Reference

### MVRResolver

#### Constructor

```typescript
new MVRResolver(env: Env)
```

#### Methods

##### `resolve(nameOrFormat: string, options?: ResolutionOptions): Promise<ResolutionResult>`

Resolve a package using the compatibility layer.

**Parameters:**
- `nameOrFormat` - Package name in any supported format
- `options` - Optional resolution options:
  - `network?: 'mainnet' | 'testnet'` - Network to resolve on
  - `fallbackNetwork?: boolean` - Try fallback network if primary fails
  - `cacheTtl?: number` - Cache TTL in seconds (default: 300)
  - `forceRefresh?: boolean` - Skip cache

**Returns:**
```typescript
{
  package: MVRPackageInfo | null
  network: 'mainnet' | 'testnet'
  usedFallback: boolean
  error?: string
}
```

##### `parsePackageName(nameOrFormat: string): ParsedPackageName | null`

Parse a package name into components.

**Returns:**
```typescript
{
  namespace: string
  packageName: string
  version?: number | string
  format: 'at-format' | 'dot-format' | 'slash-format'
}
```

##### `normalizePackageName(nameOrFormat: string): string | null`

Normalize a package name to @namespace/package format.

##### `clearCache(): void`

Clear all cached resolutions.

##### `clearExpiredCache(): void`

Clear only expired cache entries.

##### `getCacheStats(): { size: number; entries: number }`

Get cache statistics.

## Examples

### Basic Resolution

```typescript
const resolver = createMVRResolver(env)

// Resolve latest version
const result = await resolver.resolve('@myname/mypackage')
if (result.package) {
  console.log(`Package: ${result.package.name}`)
  console.log(`Address: ${result.package.address}`)
  console.log(`Network: ${result.network}`)
}
```

### Version-Specific Resolution

```typescript
// Resolve specific version
const result = await resolver.resolve('@myname/mypackage/2')
if (result.package) {
  console.log(`Version ${result.package.version}: ${result.package.address}`)
}
```

### Cross-Network with Fallback

```typescript
const result = await resolver.resolve('@myname/mypackage', {
  network: 'mainnet',
  fallbackNetwork: true,
})

if (result.package) {
  console.log(`Found on ${result.network}`)
  if (result.usedFallback) {
    console.log('(Used fallback network)')
  }
} else {
  console.error('Not found:', result.error)
}
```

### Using in PTBs (Programmable Transaction Blocks)

```typescript
import { Transaction } from '@mysten/sui/transactions'

const resolver = createMVRResolver(env)
const result = await resolver.resolve('@myname/mypackage')

if (result.package) {
  const tx = new Transaction()
  
  // Use the resolved address in your transaction
  tx.moveCall({
    target: `${result.package.address}::module::function`,
    arguments: [/* ... */],
  })
}
```

## Error Handling

The resolver provides detailed error information:

```typescript
const result = await resolver.resolve('@invalid/package')

if (!result.package) {
  if (result.error?.includes('Invalid package name format')) {
    // Handle invalid format
  } else if (result.error?.includes('not found')) {
    // Handle missing package
  } else if (result.error?.includes('Failed on both networks')) {
    // Handle network errors
  }
}
```

## Caching

The resolver automatically caches resolved packages for performance:

```typescript
// First call - resolves from network
const result1 = await resolver.resolve('@myname/mypackage')

// Second call - uses cache (within TTL)
const result2 = await resolver.resolve('@myname/mypackage')

// Force refresh
const result3 = await resolver.resolve('@myname/mypackage', {
  forceRefresh: true,
})
```

### Cache Management

```typescript
// Clear all cache
resolver.clearCache()

// Clear only expired entries
resolver.clearExpiredCache()

// Get cache stats
const stats = resolver.getCacheStats()
console.log(`Cache size: ${stats.size}`)
```

## Performance Optimization

1. **Use caching** - Default TTL is 5 minutes
2. **Batch resolutions** - Resolve multiple packages in parallel
3. **Clear expired cache** - Periodically clean up old entries
4. **Use specific versions** - Avoids version lookup overhead

## Migration Guide

### From Direct MVR Calls

**Before:**
```typescript
const result = await resolveMVRPackage('myname', 'mypackage', undefined, env)
```

**After:**
```typescript
const resolver = createMVRResolver(env)
const result = await resolver.resolve('@myname/mypackage')
```

### From Hardcoded Addresses

**Before:**
```typescript
const PACKAGE_ADDRESS = '0x123...' // Hardcoded
```

**After:**
```typescript
const resolver = createMVRResolver(env)
const result = await resolver.resolve('@myname/mypackage')
const PACKAGE_ADDRESS = result.package?.address
```

## Best Practices

1. **Use @namespace/package format** - Most explicit and clear
2. **Handle errors gracefully** - Check `result.error` for details
3. **Cache resolutions** - Don't disable caching unless necessary
4. **Use version pinning** - For production, pin specific versions
5. **Enable fallback** - For better reliability across networks

## Troubleshooting

### "Invalid package name format"

Check that your package name matches one of the supported formats:
- `@namespace/package`
- `namespace.sui/package`
- `namespace/package`

### "Package not found"

- Verify the package exists in the MVR
- Check the namespace and package name spelling
- Try the fallback network option

### "Move Registry not configured"

Ensure `MOVE_REGISTRY_PARENT_ID` is set in your environment or the resolver can find the registry object ID.

## See Also

- [Messaging SDK Documentation](./MESSAGING_SDK.md)
- [MVR Registry Documentation](https://www.moveregistry.com)
- [Sui Move Documentation](https://docs.sui.io/build/move)
