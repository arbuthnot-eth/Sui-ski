# Development Index

## Quick Links

- [[README|Project Overview]]
- [[.vault/README|Vault Guide]]
- [[CODEBASE_GUIDE|Codebase Guide]]
- [[AGENTS|Agent Guidelines]]

## SDK Documentation

### Sui TypeScript SDK
- [[sdk-docs/DApp-Kit-State|DApp Kit State Management]] - Wallet connection state
- [[sdk-docs/Transaction-Executors|Transaction Executors]] - Serial & Parallel execution
- [[sdk-docs/Transaction-Plugins|Transaction Plugins]] - Plugin system & Intents
- [[sdk-docs/Building-SDKs|Building SDKs]] - Best practices for SDK development

## Daily Notes

```dataview
TABLE file.ctime as Created
FROM ".vault/daily-notes"
SORT file.name DESC
LIMIT 10
```

## Recent Progress

```dataview
TABLE status as Status, priority as Priority, file.mtime as Modified
FROM ".vault/progress"
SORT file.mtime DESC
LIMIT 10
```

## Recent Git Observations

```dataview
TABLE file.ctime as Created
FROM ".vault/git-observations"
SORT file.name DESC
LIMIT 10
```

## Active Tags

#development #git #progress #daily #observation

---

*Use this note as your dashboard. Click any link above to navigate.*
