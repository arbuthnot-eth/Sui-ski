# Sui-ski Gateway Documentation Vault

This is an Obsidian vault for tracking development progress, git observations, and project documentation for the Sui-ski Gateway project.

## Structure

```
.vault/
├── daily-notes/       # Daily progress logs
├── git-observations/  # Git state snapshots
├── progress/          # Feature/task progress entries
├── templates/         # Note templates
├── sdk-docs/          # SDK documentation (Sui SDK)
└── assets/           # Images and attachments
```

## Quick Start

### Using npm scripts

```bash
# Create today's daily note
bun run obsidian:daily

# Generate git observation
bun run obsidian:git

# Create progress entry
bun run obsidian:progress "Feature Name"

# Create both daily note and git observation
bun run obsidian:all

# Open vault in Obsidian
bun run obsidian:open
```

### Manual CLI

```bash
# Run the script directly
bun run scripts/obsidian.ts <command> [args]

# Examples:
bun run scripts/obsidian.ts daily
bun run scripts/obsidian.ts git
bun run scripts/obsidian.ts progress "My Feature"
bun run scripts/obsidian.ts open
```

## Templates

### Daily Note Template
Located at: `.vault/templates/Daily Note Template.md`

Includes:
- Day at a Glance
- Tasks checklist
- Progress Log (Morning/Afternoon/Evening)
- Notes & Ideas
- Blockers
- Git Activity tracking
- Links to previous/next days

### Progress Entry Template
Located at: `.vault/templates/Progress Entry Template.md`

Includes:
- Status, Priority, Timeline
- Objectives checklist
- Implementation Details
- Code Changes tracking
- Testing checklist
- Issues and Related links

### Git Observation Template
Located at: `.vault/templates/Git Observation Template.md`

Includes:
- Repository state (branch, commit)
- Recent commits log
- Files changed (modified/added/deleted)
- Code quality status
- Observations and patterns

## Obsidian Features Enabled

- **Daily Notes**: Automatic daily note creation
- **Templates**: Pre-configured note templates
- **Graph View**: Visualize note connections
- **Backlinks**: See which notes link to the current one
- **Outline**: Navigate document headers
- **Word Count**: Track document length

## Git Integration

The vault automatically captures:
- Current branch and commit
- Recent commit history
- Modified, added, and deleted files
- Can be extended to capture lint/test status

## SDK Documentation

The `sdk-docs/` directory contains imported documentation from the Mysten Labs SDK:

- **[[sdk-docs/DApp-Kit-State|DApp Kit State Management]]** - Reactive stores for wallet connections
- **[[sdk-docs/Transaction-Executors|Transaction Executors]]** - Serial and Parallel executor patterns
- **[[sdk-docs/Transaction-Plugins|Transaction Plugins]]** - Plugin system for extending transactions
- **[[sdk-docs/Building-SDKs|Building SDKs]]** - Best practices for SDK development

These are linked in the [[Index]] for easy navigation.

## Tips

1. **Linking**: Use `[[Note Name]]` to link between notes
2. **Tags**: Use `#tag` to categorize notes
3. **Search**: Press `Ctrl/Cmd + O` for quick file search
4. **Command Palette**: Press `Ctrl/Cmd + P` for all commands
5. **Graph View**: Press `Ctrl/Cmd + G` to see note connections

## Customization

Edit templates in `.vault/templates/` to customize your note structure. Templates support these variables:

- `{{date:YYYY-MM-DD}}` - Current date
- `{{date:YYYY-MM-DD HH:mm}}` - Current timestamp
- `{{yesterday}}` - Yesterday's date
- `{{tomorrow}}` - Tomorrow's date
