# Sui Stack System Diagram

Complete architecture reference for applications built on the Sui blockchain ecosystem.

**Last Updated:** January 2026

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT APPLICATIONS                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Web Apps    │   Mobile Apps   │   CLI Tools   │   Backend Services   │   Bots  │
└──────┬───────┴────────┬────────┴───────┬───────┴──────────┬───────────┴────┬────┘
       │                │                │                  │                │
       ▼                ▼                ▼                  ▼                ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                SDK LAYER                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│  @mysten/sui  │ @mysten/suins │ @mysten/walrus │ @mysten/seal │ @mysten/nautilus│
└──────┬────────┴───────┬───────┴───────┬────────┴──────┬───────┴────────┬────────┘
       │                │               │               │                │
       ▼                ▼               ▼               ▼                ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                             GATEWAY / API LAYER                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                              sui.ski Gateway                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │ RPC Proxy│  │  SuiNS   │  │   MVR    │  │ Content  │  │ Vortex/Seal API  │   │
│  │  Router  │  │ Resolver │  │ Registry │  │ Gateway  │  │     Proxy        │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬─────────┘   │
└───────┼─────────────┼────────────┼─────────────┼──────────────────┼─────────────┘
        │             │            │             │                  │
        ▼             ▼            ▼             ▼                  ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            PROTOCOL SERVICES                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────────────┐  │
│  │   SuiNS   │ │    MVR    │ │  Vortex   │ │   Seal    │ │     Nautilus      │  │
│  │   Names   │ │ Packages  │ │  Privacy  │ │  Secrets  │ │   TEE Compute     │  │
│  └─────┬─────┘ └─────┬─────┘ └─────┬─────┘ └─────┬─────┘ └─────────┬─────────┘  │
└────────┼─────────────┼─────────────┼─────────────┼─────────────────┼────────────┘
         │             │             │             │                 │
         ▼             ▼             ▼             ▼                 ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            STORAGE LAYER                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────────┐  │
│  │    Sui Blockchain   │  │       Walrus        │  │         IPFS            │  │
│  │   (Objects/State)   │  │   (Blob Storage)    │  │  (Content Addressed)    │  │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
         │                          │                          │
         ▼                          ▼                          ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          CONSENSUS / EXECUTION                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                    Mysticeti v2 Consensus                                │    │
│  │   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │    │
│  │   │Validator │  │Validator │  │Validator │  │Validator │  │Validator │  │    │
│  │   │ Cluster  │  │ Cluster  │  │ Cluster  │  │ Cluster  │  │   ...    │  │    │
│  │   └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │    │
│  │                     ▲                                                    │    │
│  │                     │ Remora (Horizontal Scaling)                        │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## The Complete Sui Stack (2025)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          THE SUI STACK (Mainnet 2025)                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │  COMPUTATION                                                             │    │
│  │  ┌─────────────────────────────────┐  ┌─────────────────────────────┐   │    │
│  │  │         Sui Blockchain          │  │        Nautilus             │   │    │
│  │  │   • Onchain execution (Move)    │  │   • Offchain TEE compute    │   │    │
│  │  │   • Mysticeti v2 consensus      │  │   • AWS Nitro Enclaves      │   │    │
│  │  │   • Sub-second finality         │  │   • Cryptographic attestation│   │    │
│  │  │   • 100k+ TPS (with Remora)     │  │   • Verifiable execution    │   │    │
│  │  └─────────────────────────────────┘  └─────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │  STORAGE                                                                 │    │
│  │  ┌─────────────────────────────────┐  ┌─────────────────────────────┐   │    │
│  │  │       Sui Object Store          │  │          Walrus             │   │    │
│  │  │   • Structured data (objects)   │  │   • Unstructured blobs      │   │    │
│  │  │   • Owned/Shared/Immutable      │  │   • Red Stuff 2D encoding   │   │    │
│  │  │   • Dynamic fields              │  │   • 4-5x replication        │   │    │
│  │  │   • Object capabilities         │  │   • Exabyte scale           │   │    │
│  │  └─────────────────────────────────┘  └─────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │  ACCESS CONTROL                                                          │    │
│  │  ┌─────────────────────────────────┐  ┌─────────────────────────────┐   │    │
│  │  │            Seal                 │  │         Vortex              │   │    │
│  │  │   • Decentralized secrets       │  │   • Privacy transactions    │   │    │
│  │  │   • Identity-based encryption   │  │   • Zero-knowledge proofs   │   │    │
│  │  │   • Onchain access policies     │  │   • Shielded transfers      │   │    │
│  │  │   • Threshold key servers       │  │   • Privacy pools           │   │    │
│  │  └─────────────────────────────────┘  └─────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │  NAMING & REGISTRY                                                       │    │
│  │  ┌─────────────────────────────────┐  ┌─────────────────────────────┐   │    │
│  │  │           SuiNS                 │  │           MVR               │   │    │
│  │  │   • Human-readable names        │  │   • Package registry        │   │    │
│  │  │   • Address resolution          │  │   • Dependency management   │   │    │
│  │  │   • Profile records             │  │   • Version control         │   │    │
│  │  │   • Content hashes              │  │   • @namespace/package      │   │    │
│  │  └─────────────────────────────────┘  └─────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Deep Dive

### 1. Sui Blockchain Core

```
┌─────────────────────────────────────────────────────────────────┐
│                     SUI BLOCKCHAIN CORE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    MOVE VIRTUAL MACHINE                   │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │   │
│  │  │   Bytecode  │  │   Runtime   │  │  Native Functions│   │   │
│  │  │  Verifier   │  │  Execution  │  │    (Crypto, etc) │   │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    OBJECT MODEL                           │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────────┐  │   │
│  │  │   Owned    │  │   Shared   │  │     Immutable      │  │   │
│  │  │  Objects   │  │  Objects   │  │      Objects       │  │   │
│  │  └────────────┘  └────────────┘  └────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                MYSTICETI v2 CONSENSUS                     │   │
│  │                                                           │   │
│  │  • DAG-based Byzantine Fault Tolerant protocol            │   │
│  │  • Validation + consensus occur simultaneously            │   │
│  │  • Batched signatures in consensus blocks                 │   │
│  │  • p50: 67ms │ p95: 90ms │ p99: 114ms                    │   │
│  │  • 35% latency reduction from v1                          │   │
│  │                                                           │   │
│  │  ┌─────────────────────────────────────────────────────┐ │   │
│  │  │                    REMORA                            │ │   │
│  │  │  Horizontal scaling via validator clustering         │ │   │
│  │  │  • Add machines → linear TPS increase               │ │   │
│  │  │  • No supercomputer nodes required                  │ │   │
│  │  │  • Target: 100k+ TPS                                │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Networks: mainnet │ testnet │ devnet │ localnet                │
└─────────────────────────────────────────────────────────────────┘
```

### 2. SuiNS Name Service

```
┌─────────────────────────────────────────────────────────────────┐
│                         SuiNS                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Human-Readable Names → Sui Addresses & Resources               │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    NAME STRUCTURE                         │   │
│  │                                                           │   │
│  │   alice.sui  ─────────────────────────────────────────►  │   │
│  │        │                                                  │   │
│  │        ├── Default Address (0x...)                        │   │
│  │        ├── Avatar (IPFS/Walrus URL)                       │   │
│  │        ├── Content Hash (Website)                         │   │
│  │        ├── Custom Records (key-value)                     │   │
│  │        └── Linked Objects                                 │   │
│  │                                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    LIFECYCLE                              │   │
│  │                                                           │   │
│  │   Registration ──► Active ──► Grace Period ──► Expired   │   │
│  │        │              │             │              │      │   │
│  │        │              │             │              ▼      │   │
│  │        │              │             │         Available   │   │
│  │        │              │             │         for new     │   │
│  │        │              │             │         registration│   │
│  │        │              │             │                     │   │
│  │        │              │             └── 30-day grace      │   │
│  │        │              │                 (renewal only)    │   │
│  │        │              │                                   │   │
│  │        │              └── 1-5 year terms                  │   │
│  │        │                                                  │   │
│  │        └── Pricing: 3+ chars (SUI-based)                  │   │
│  │                                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  SDK: @mysten/suins                                              │
│  Resolution: alice.sui.ski → Profile/Content                     │
└─────────────────────────────────────────────────────────────────┘
```

### 3. Move Registry (MVR)

```
┌─────────────────────────────────────────────────────────────────┐
│                    MOVE REGISTRY (MVR)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Onchain Package Registry: @{suins_name}/{package_name}         │
│   "npm/crates.io for Move" - Launched April 2025                 │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    PACKAGE STRUCTURE                      │   │
│  │                                                           │   │
│  │   @suifrens/core ────────────────────────────────────►   │   │
│  │        │                                                  │   │
│  │        ├── Package ID (0x...)                             │   │
│  │        ├── Versions: v1, v2, v3...                        │   │
│  │        ├── Metadata (description, docs, source)           │   │
│  │        ├── Dependencies                                   │   │
│  │        ├── Usage statistics                               │   │
│  │        └── Owner (SuiNS name holder)                      │   │
│  │                                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    DEPENDENCY RESOLUTION                  │   │
│  │                                                           │   │
│  │   Move.toml:                                              │   │
│  │   ┌─────────────────────────────────────────────────┐    │   │
│  │   │ [dependencies]                                   │    │   │
│  │   │ suifrens = { r.mvr = "@suifrens/core" }         │    │   │
│  │   │ deepbook = { r.mvr = "@deepbook/clob" }         │    │   │
│  │   └─────────────────────────────────────────────────┘    │   │
│  │                                                           │   │
│  │   • Human-readable names in code                          │   │
│  │   • Automatic testnet/mainnet resolution                  │   │
│  │   • Version pinning or latest tracking                    │   │
│  │   • Immutable onchain records                             │   │
│  │                                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  CLI: mvr (cargo install)                                        │
│  Web: moveregistry.com                                           │
│  Gateway: {pkg}--{name}.sui.ski → Package resolution             │
└─────────────────────────────────────────────────────────────────┘
```

### 4. Walrus Decentralized Storage

```
┌─────────────────────────────────────────────────────────────────┐
│                         WALRUS                                   │
│              Mainnet: March 25, 2025 │ Whitepaper v2.0           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Decentralized Blob Storage with Red Stuff 2D Erasure Coding    │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                RED STUFF ENCODING                         │   │
│  │                                                           │   │
│  │   Original Blob                                           │   │
│  │        │                                                  │   │
│  │        ▼                                                  │   │
│  │   ┌─────────────────────────────────────────────────┐    │   │
│  │   │            Data Matrix (rows × cols)             │    │   │
│  │   │  ┌───┬───┬───┬───┐                              │    │   │
│  │   │  │ A │ B │ C │ D │  ← Row encoding (secondary)  │    │   │
│  │   │  ├───┼───┼───┼───┤                              │    │   │
│  │   │  │ E │ F │ G │ H │                              │    │   │
│  │   │  ├───┼───┼───┼───┤                              │    │   │
│  │   │  │ I │ J │ K │ L │                              │    │   │
│  │   │  └───┴───┴───┴───┘                              │    │   │
│  │   │    ↓   ↓   ↓   ↓                                │    │   │
│  │   │  Column encoding (primary)                       │    │   │
│  │   └─────────────────────────────────────────────────┘    │   │
│  │                       │                                   │   │
│  │                       ▼                                   │   │
│  │   ┌─────────────────────────────────────────────────┐    │   │
│  │   │         Sliver Pairs (3f+1 total)                │    │   │
│  │   │   Each node receives: 1 primary + 1 secondary    │    │   │
│  │   └─────────────────────────────────────────────────┘    │   │
│  │                                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                CERTIFICATION FLOW                         │   │
│  │                                                           │   │
│  │   1. Client encodes blob → slivers                        │   │
│  │   2. Distribute slivers to storage nodes                  │   │
│  │   3. Collect signed acknowledgments (2/3 quorum)          │   │
│  │   4. Form "write certificate"                             │   │
│  │   5. Publish certificate on Sui (Proof of Availability)   │   │
│  │                                                           │   │
│  │   Result: Blob ID + onchain PoA certificate               │   │
│  │                                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    KEY PROPERTIES                         │   │
│  │                                                           │   │
│  │   • 4-5x storage overhead (vs 3x for simple replication)  │   │
│  │   • Recoverable with 1/3 of slivers                       │   │
│  │   • Tolerates 2/3 node failures                           │   │
│  │   • Lightweight recovery (proportional to sliver size)    │   │
│  │   • Programmable storage (blobs as Sui objects)           │   │
│  │   • Exabyte scale target                                  │   │
│  │                                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  SDK: @mysten/walrus                                             │
│  Token: WAL (delegated proof-of-stake)                           │
│  Access: walrus-{blobId}.sui.ski                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5. Vortex Privacy Protocol

```
┌─────────────────────────────────────────────────────────────────┐
│                    VORTEX PRIVACY PROTOCOL                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Zero-Knowledge Confidential Transactions on Sui                │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    FLOW                                   │   │
│  │                                                           │   │
│  │   ┌─────────┐                      ┌─────────────────┐   │   │
│  │   │  User   │                      │  Privacy Pool   │   │   │
│  │   └────┬────┘                      │   (per token)   │   │   │
│  │        │                           └────────┬────────┘   │   │
│  │        │  1. Deposit                        │            │   │
│  │        ├───────────────────────────────────►│            │   │
│  │        │     (Public → Shielded)            │            │   │
│  │        │                                    │            │   │
│  │        │  2. Generate Commitment            │            │   │
│  │        │◄───────────────────────────────────┤            │   │
│  │        │     (Note with secret)             │            │   │
│  │        │                                    │            │   │
│  │        │  3. Transfer (Private)             │            │   │
│  │        │     ZK Proof ──────────────────────┤            │   │
│  │        │     (Nullifier prevents double)    │            │   │
│  │        │                                    │            │   │
│  │        │  4. Withdraw                       │            │   │
│  │        │◄───────────────────────────────────┤            │   │
│  │        │     (Shielded → Public)            │            │   │
│  │                                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    COMPONENTS                             │   │
│  │                                                           │   │
│  │   Client SDK ◄──► Relayer ◄──► Privacy Pools (Onchain)   │   │
│  │       │                                                   │   │
│  │       └── ZK Proof Generation (Browser/WASM)              │   │
│  │                                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  SDK: @interest-protocol/vortex-sdk (client-side only, ~9MB)     │
│  API: /api/vortex/* (proxied through gateway)                    │
└─────────────────────────────────────────────────────────────────┘
```

### 6. Seal Decentralized Secrets Management

```
┌─────────────────────────────────────────────────────────────────┐
│                    SEAL (Decentralized Secrets)                  │
│                      Mainnet: 2025                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Identity-Based Encryption with Onchain Access Control          │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    ENCRYPTION FLOW                        │   │
│  │                                                           │   │
│  │   ┌────────────┐                    ┌────────────────┐   │   │
│  │   │  Encryptor │                    │   Key Servers  │   │   │
│  │   └─────┬──────┘                    │   (t-of-n)     │   │   │
│  │         │                           └───────┬────────┘   │   │
│  │         │  1. Encrypt with IBE              │            │   │
│  │         │     (identity = [PkgId]*[PolicyId])            │   │
│  │         │                                   │            │   │
│  │         ▼                                   │            │   │
│  │   ┌────────────┐                           │            │   │
│  │   │  Encrypted │  2. Store anywhere         │            │   │
│  │   │   Object   │     (Walrus/IPFS/Chain)    │            │   │
│  │   └────────────┘                           │            │   │
│  │                                             │            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    DECRYPTION FLOW                        │   │
│  │                                                           │   │
│  │   ┌────────────┐    ┌─────────────┐    ┌─────────────┐   │   │
│  │   │ Decryptor  │───►│ Sui Policy  │───►│ Key Servers │   │   │
│  │   └────────────┘    │ (Move code) │    └──────┬──────┘   │   │
│  │         │           └─────────────┘           │          │   │
│  │         │                                     │          │   │
│  │         │  1. Build tx calling seal_approve   │          │   │
│  │         │  2. Request decryption keys         │          │   │
│  │         │  3. Key servers verify tx ──────────┤          │   │
│  │         │  4. Receive threshold keys          │          │   │
│  │         │◄────────────────────────────────────┤          │   │
│  │         │  5. Reconstruct & decrypt           │          │   │
│  │         ▼                                     │          │   │
│  │   ┌────────────┐                              │          │   │
│  │   │ Plaintext  │                              │          │   │
│  │   └────────────┘                              │          │   │
│  │                                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                 ACCESS CONTROL PATTERNS                   │   │
│  │                                                           │   │
│  │   ┌────────────┐  ┌────────────┐  ┌────────────────────┐ │   │
│  │   │ Allowlist  │  │Subscription│  │  Time-Locked       │ │   │
│  │   │ (Group)    │  │ (Passes)   │  │  (Auto-unlock)     │ │   │
│  │   └────────────┘  └────────────┘  └────────────────────┘ │   │
│  │   ┌────────────┐  ┌────────────┐  ┌────────────────────┐ │   │
│  │   │ NFT-Gated  │  │  DAO Vote  │  │  Multi-Sig         │ │   │
│  │   │ (Ownership)│  │ (Threshold)│  │  (Approval)        │ │   │
│  │   └────────────┘  └────────────┘  └────────────────────┘ │   │
│  │                                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Crypto: Boneh-Franklin IBE + BLS12-381 + AES-256-GCM            │
│  SDK: @mysten/seal                                               │
└─────────────────────────────────────────────────────────────────┘
```

### 7. Nautilus TEE Framework

```
┌─────────────────────────────────────────────────────────────────┐
│                    NAUTILUS (TEE Compute)                        │
│                   Mainnet: June 5, 2025                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Verifiable Offchain Computation via Trusted Execution Envs     │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    ARCHITECTURE                           │   │
│  │                                                           │   │
│  │   ┌─────────────────────┐    ┌─────────────────────────┐ │   │
│  │   │   Offchain Server   │    │   Onchain Contract      │ │   │
│  │   │   (TEE Instance)    │    │   (Move Verifier)       │ │   │
│  │   │                     │    │                         │ │   │
│  │   │  • AWS Nitro Enclave│    │  • Attestation verify   │ │   │
│  │   │  • User inputs      │    │  • Accept/reject output │ │   │
│  │   │  • Scheduled tasks  │    │  • State transitions    │ │   │
│  │   │  • Private compute  │    │  • Trust anchoring      │ │   │
│  │   └──────────┬──────────┘    └───────────┬─────────────┘ │   │
│  │              │                           │               │   │
│  │              │   Cryptographic           │               │   │
│  │              └──── Attestation ──────────┘               │   │
│  │                                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    ATTESTATION FLOW                       │   │
│  │                                                           │   │
│  │   1. Deploy offchain server to self-managed TEE           │   │
│  │   2. TEE generates cryptographic attestation              │   │
│  │      (proves execution environment integrity)             │   │
│  │   3. Submit computation result + attestation to Sui       │   │
│  │   4. Move contract verifies attestation                   │   │
│  │   5. Accept output only if attestation valid              │   │
│  │                                                           │   │
│  │   Trust anchored by: Provider's root of trust (AWS)       │   │
│  │                                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    USE CASES                              │   │
│  │                                                           │   │
│  │   • Private AI model inference (Bluefin Pro)              │   │
│  │   • Federated learning coordination                       │   │
│  │   • ZK-ML proof generation                                │   │
│  │   • Private data processing                               │   │
│  │   • High-cost offchain computation                        │   │
│  │                                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                 NAUTILUS + SEAL INTEGRATION               │   │
│  │                                                           │   │
│  │   Problem: TEEs lose secrets on restart/migration         │   │
│  │                                                           │   │
│  │   Solution:                                               │   │
│  │   • Seal stores long-term encryption keys                 │   │
│  │   • Seal grants key access only to attested TEEs          │   │
│  │   • Nautilus computes over encrypted data                 │   │
│  │   • Seal controls who can decrypt results                 │   │
│  │                                                           │   │
│  │   Result: Privacy-preserving verifiable computation       │   │
│  │                                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  TEE Support: AWS Nitro Enclaves (more planned)                  │
│  GitHub: github.com/MystenLabs/nautilus                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### Transaction Lifecycle

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                         TRANSACTION LIFECYCLE                                  │
└───────────────────────────────────────────────────────────────────────────────┘

  User Intent                Build                   Sign                Execute
      │                        │                      │                     │
      ▼                        ▼                      ▼                     ▼
┌──────────┐            ┌──────────┐           ┌──────────┐          ┌──────────┐
│  Wallet  │───────────►│   PTB    │──────────►│  Signed  │─────────►│ Fullnode │
│   App    │            │  Build   │           │    Tx    │          │   RPC    │
└──────────┘            └──────────┘           └──────────┘          └────┬─────┘
                              │                                           │
                              │                                           ▼
                        ┌─────┴─────┐                              ┌──────────┐
                        │           │                              │Validators│
                        ▼           ▼                              │(Mysticeti│
                   ┌────────┐ ┌────────┐                           │   v2)    │
                   │ Move   │ │ Object │                           └────┬─────┘
                   │ Calls  │ │ Inputs │                                │
                   └────────┘ └────────┘                                ▼
                                                                  ┌──────────┐
                                                                  │Checkpoint│
                                                                  │ + Effects│
                                                                  └──────────┘

PTB = Programmable Transaction Block
Finality: p50 ~67ms, p95 ~90ms, p99 ~114ms
```

### Content Resolution Flow

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                         CONTENT RESOLUTION FLOW                                │
└───────────────────────────────────────────────────────────────────────────────┘

     Browser Request                 Gateway                     Storage
           │                            │                           │
           │  alice.sui.ski             │                           │
           ├───────────────────────────►│                           │
           │                            │                           │
           │                     ┌──────┴──────┐                    │
           │                     │Parse subdomain│                   │
           │                     │ type: suins  │                   │
           │                     └──────┬──────┘                    │
           │                            │                           │
           │                     ┌──────┴──────┐                    │
           │                     │Resolve SuiNS│                    │
           │                     │ alice.sui   │                    │
           │                     └──────┬──────┘                    │
           │                            │                           │
           │                     ┌──────┴──────┐                    │
           │                     │Get content  │                    │
           │                     │hash record  │                    │
           │                     └──────┬──────┘                    │
           │                            │                           │
           │                            │  Walrus blob?             │
           │                            ├──────────────────────────►│
           │                            │                           │
           │                            │◄──────────────────────────┤
           │                            │      Blob data            │
           │◄───────────────────────────┤                           │
           │       HTML Response        │                           │
```

### Privacy-Preserving Computation Flow

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                   PRIVACY-PRESERVING COMPUTATION (Nautilus + Seal)             │
└───────────────────────────────────────────────────────────────────────────────┘

  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌─────────────┐
  │    Client    │     │    Walrus    │     │   Nautilus   │     │    Seal     │
  │              │     │   (Storage)  │     │    (TEE)     │     │ (Key Mgmt)  │
  └──────┬───────┘     └──────┬───────┘     └──────┬───────┘     └──────┬──────┘
         │                    │                    │                    │
         │  1. Encrypt data with Seal              │                    │
         ├────────────────────────────────────────────────────────────►│
         │                    │                    │                    │
         │  2. Store encrypted blob                │                    │
         ├───────────────────►│                    │                    │
         │                    │                    │                    │
         │  3. Request computation                 │                    │
         ├────────────────────────────────────────►│                    │
         │                    │                    │                    │
         │                    │  4. TEE attests    │                    │
         │                    │     to Seal        │  5. Verify         │
         │                    │                    ├───────────────────►│
         │                    │                    │                    │
         │                    │                    │  6. Grant key      │
         │                    │                    │◄───────────────────┤
         │                    │                    │                    │
         │                    │  7. Fetch blob     │                    │
         │                    │◄───────────────────┤                    │
         │                    │                    │                    │
         │                    │  8. Decrypt &      │                    │
         │                    │     compute        │                    │
         │                    │                    │                    │
         │  9. Verified result + attestation       │                    │
         │◄────────────────────────────────────────┤                    │
         │                    │                    │                    │
```

---

## Integration Patterns

### Full-Stack dApp Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        FULL-STACK DAPP ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                           FRONTEND                                       │    │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌─────────┐ ┌──────────┐  │    │
│  │  │  React /   │ │  Wallet    │ │  Sui SDK   │ │  Seal   │ │ Nautilus │  │    │
│  │  │  Next.js   │ │  Adapter   │ │  Client    │ │   SDK   │ │   SDK    │  │    │
│  │  └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └────┬────┘ └────┬─────┘  │    │
│  │        │              │              │             │           │        │    │
│  │        └──────────────┼──────────────┼─────────────┼───────────┘        │    │
│  │                       │              │             │                    │    │
│  └───────────────────────┼──────────────┼─────────────┼────────────────────┘    │
│                          │              │             │                         │
│                          ▼              ▼             ▼                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                           GATEWAY LAYER                                  │    │
│  │                                                                          │    │
│  │   ┌──────────────────────────────────────────────────────────────────┐  │    │
│  │   │                      sui.ski Gateway                              │  │    │
│  │   │                                                                   │  │    │
│  │   │   *.sui.ski  ──►  Route by subdomain type                        │  │    │
│  │   │                                                                   │  │    │
│  │   │   rpc.sui.ski       ──►  JSON-RPC Proxy (read-only)              │  │    │
│  │   │   {name}.sui.ski    ──►  SuiNS Profile/Content                   │  │    │
│  │   │   {pkg}--{ns}.sui.ski ─►  MVR Package Resolution                 │  │    │
│  │   │                                                                   │  │    │
│  │   └──────────────────────────────────────────────────────────────────┘  │    │
│  │                                                                          │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                          │              │             │                         │
│                          ▼              ▼             ▼                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                           BLOCKCHAIN LAYER                               │    │
│  │                                                                          │    │
│  │   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │    │
│  │   │Your Move │ │  SuiNS   │ │   MVR    │ │   Seal   │ │   Nautilus   │  │    │
│  │   │ Package  │ │ Registry │ │ Registry │ │ Policies │ │  Verifier    │  │    │
│  │   └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │    │
│  │                                                                          │    │
│  │                      Sui Blockchain (Mysticeti v2)                       │    │
│  │                                                                          │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                          │              │             │                         │
│                          ▼              ▼             ▼                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                        DECENTRALIZED STORAGE                             │    │
│  │                                                                          │    │
│  │   ┌────────────────────────────┐    ┌────────────────────────────────┐  │    │
│  │   │           Walrus           │    │            IPFS                 │  │    │
│  │   │    (Red Stuff Encoding)    │    │    (Content-Addressed)          │  │    │
│  │   │                            │    │                                 │  │    │
│  │   │  - Website assets          │    │  - Legacy content               │  │    │
│  │   │  - Encrypted data (Seal)   │    │  - Cross-chain assets           │  │    │
│  │   │  - AI models/datasets      │    │  - Pinned content               │  │    │
│  │   │  - Media files             │    │                                 │  │    │
│  │   │                            │    │                                 │  │    │
│  │   └────────────────────────────┘    └────────────────────────────────┘  │    │
│  │                                                                          │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Network Topology

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                              SUI NETWORK TOPOLOGY                              │
└───────────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────────┐
                              │    Validators    │
                              │  (Mysticeti v2)  │
                              │                  │
                              │  ┌────┐ ┌────┐   │
                              │  │ V1 │ │ V2 │   │  ◄── Remora clusters
                              │  └────┘ └────┘   │      (horizontal scaling)
                              │  ┌────┐ ┌────┐   │
                              │  │ V3 │ │...│    │
                              │  └────┘ └────┘   │
                              │                  │
                              └────────┬─────────┘
                                       │
            ┌──────────────────────────┼──────────────────────────┐
            │                          │                          │
            ▼                          ▼                          ▼
   ┌────────────────┐        ┌────────────────┐        ┌────────────────┐
   │   Fullnodes    │        │   Fullnodes    │        │   Fullnodes    │
   │   (Public)     │        │  (Operator)    │        │   (Private)    │
   │                │        │                │        │                │
   │  - RPC API     │        │  - Indexer     │        │  - Custom apps │
   │  - WebSocket   │        │  - Analytics   │        │  - High perf   │
   │                │        │                │        │                │
   └───────┬────────┘        └───────┬────────┘        └───────┬────────┘
           │                         │                         │
           │                         │                         │
           ▼                         ▼                         ▼
   ┌────────────────────────────────────────────────────────────────────┐
   │                              CLIENTS                                │
   │                                                                     │
   │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  │
   │  │ Wallets │  │  dApps  │  │  SDKs   │  │Explorers│  │ Bots    │  │
   │  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘  │
   │                                                                     │
   └─────────────────────────────────────────────────────────────────────┘
```

---

## SDK Reference

| SDK | Package | Purpose | Status |
|-----|---------|---------|--------|
| **Sui TypeScript SDK** | `@mysten/sui` | Core blockchain interaction | Stable |
| **SuiNS SDK** | `@mysten/suins` | Name service resolution | Stable |
| **Walrus SDK** | `@mysten/walrus` | Decentralized blob storage | Stable (Mar 2025) |
| **Seal SDK** | `@mysten/seal` | Decentralized secrets management | Stable (2025) |
| **Nautilus SDK** | (GitHub template) | TEE verifiable computation | Mainnet (Jun 2025) |
| **Vortex SDK** | `@interest-protocol/vortex-sdk` | Privacy protocol (client-only) | Stable |
| **MVR CLI** | `mvr` (cargo) | Package management | Stable (Apr 2025) |

---

## Quick Reference: Subdomain Routing

| Pattern | Route | Example |
|---------|-------|---------|
| `sui.ski` | Root landing | `https://sui.ski` |
| `rpc.sui.ski` | JSON-RPC proxy | `https://rpc.sui.ski` |
| `{name}.sui.ski` | SuiNS profile | `https://alice.sui.ski` |
| `{pkg}--{name}.sui.ski` | MVR package | `https://core--suifrens.sui.ski` |
| `{pkg}--{name}--v{n}.sui.ski` | MVR version | `https://core--suifrens--v2.sui.ski` |
| `ipfs-{cid}.sui.ski` | IPFS content | `https://ipfs-Qm....sui.ski` |
| `walrus-{blobId}.sui.ski` | Walrus blob | `https://walrus-abc123.sui.ski` |

---

## Security Model Summary

| Layer | Security Mechanism |
|-------|-------------------|
| **Consensus** | Mysticeti v2 BFT (DAG-based), validator staking |
| **Execution** | Move bytecode verification, type safety, capability model |
| **Storage (Sui)** | Object ownership, capability-based access |
| **Storage (Walrus)** | 2D erasure coding, 2/3 fault tolerance, PoA certificates |
| **Secrets (Seal)** | IBE encryption, threshold key servers, onchain policies |
| **Compute (Nautilus)** | TEE attestation, cryptographic proofs, Move verification |
| **Privacy (Vortex)** | Zero-knowledge proofs, nullifiers, privacy pools |
| **Gateway** | Rate limiting, method allowlists, CORS |

---

## Networks

| Network | Purpose | RPC | Status |
|---------|---------|-----|--------|
| **Mainnet** | Production | `https://fullnode.mainnet.sui.io:443` | Live |
| **Testnet** | Staging/Testing | `https://fullnode.testnet.sui.io:443` | Live |
| **Devnet** | Development | `https://fullnode.devnet.sui.io:443` | Live |
| **Localnet** | Local development | `http://localhost:9000` | Self-hosted |

---

## Performance Benchmarks (Mysticeti v2)

| Metric | Value | Notes |
|--------|-------|-------|
| **Finality (p50)** | 67ms | Median transaction |
| **Finality (p95)** | 90ms | 95th percentile |
| **Finality (p99)** | 114ms | 99th percentile |
| **Latency Reduction** | 35% | vs Mysticeti v1 |
| **Target TPS** | 100k+ | With Remora scaling |

---

## Key Resources

| Resource | URL |
|----------|-----|
| Sui Documentation | https://docs.sui.io |
| Walrus Whitepaper | https://docs.wal.app/walrus.pdf |
| MVR Web Interface | https://moveregistry.com |
| SuiNS Documentation | https://docs.suins.io |
| Nautilus GitHub | https://github.com/MystenLabs/nautilus |
| Seal GitHub | https://github.com/MystenLabs/seal |
| Sui Blog | https://blog.sui.io |

---

## Roadmap Highlights (2026)

| Feature | Description |
|---------|-------------|
| **Remora** | Horizontal scaling for validators (100k+ TPS) |
| **Protocol-level Privacy** | Native ZK transaction support |
| **Additional TEE Providers** | Beyond AWS Nitro for Nautilus |
| **Walrus Expansion** | Additional storage node operators |
