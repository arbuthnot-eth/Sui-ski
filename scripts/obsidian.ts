#!/usr/bin/env bun
/**
 * Obsidian Vault Manager for Sui-ski Gateway
 *
 * This script provides tools to:
 * - Create daily progress notes
 * - Generate git observation logs
 * - Open the vault in Obsidian
 *
 * Usage:
 *   bun run obsidian:daily          # Create today's daily note
 *   bun run obsidian:git            # Generate git observation
 *   bun run obsidian:progress       # Create progress entry
 *   bun run obsidian:open           # Open vault in Obsidian
 */

import { execSync } from 'child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join, resolve } from 'path'

const VAULT_PATH = resolve(process.cwd(), '.vault')
const TEMPLATES_PATH = join(VAULT_PATH, 'templates')
const DAILY_PATH = join(VAULT_PATH, 'daily-notes')
const PROGRESS_PATH = join(VAULT_PATH, 'progress')
const GIT_PATH = join(VAULT_PATH, 'git-observations')

function getTodayDate(): string {
	const now = new Date()
	return now.toISOString().split('T')[0]
}

function getTimestamp(): string {
	const now = new Date()
	return now.toISOString().replace('T', ' ').slice(0, 16)
}

function getYesterdayDate(): string {
	const yesterday = new Date()
	yesterday.setDate(yesterday.getDate() - 1)
	return yesterday.toISOString().split('T')[0]
}

function getTomorrowDate(): string {
	const tomorrow = new Date()
	tomorrow.setDate(tomorrow.getDate() + 1)
	return tomorrow.toISOString().split('T')[0]
}

function getRecentCommits(count = 5): string {
	try {
		return execSync(`git log --oneline -${count}`, { encoding: 'utf-8', cwd: process.cwd() })
	} catch {
		return 'Unable to get commits'
	}
}

function getCurrentBranch(): string {
	try {
		return execSync('git branch --show-current', { encoding: 'utf-8', cwd: process.cwd() }).trim()
	} catch {
		return 'unknown'
	}
}

function getCurrentCommit(): string {
	try {
		return execSync('git rev-parse --short HEAD', { encoding: 'utf-8', cwd: process.cwd() }).trim()
	} catch {
		return 'unknown'
	}
}

function getChangedFiles(): { modified: string[]; added: string[]; deleted: string[] } {
	const result = { modified: [] as string[], added: [] as string[], deleted: [] as string[] }

	try {
		const status = execSync('git status --porcelain', { encoding: 'utf-8', cwd: process.cwd() })
		const lines = status.split('\n').filter(Boolean)

		for (const line of lines) {
			const statusCode = line.slice(0, 2)
			const file = line.slice(3).trim()

			if (statusCode.includes('M')) result.modified.push(file)
			if (statusCode.includes('A') || statusCode.includes('??')) result.added.push(file)
			if (statusCode.includes('D')) result.deleted.push(file)
		}
	} catch {
		// ignore
	}

	return result
}

function openObsidianVault(): void {
	const vaultPath = process.cwd()
	const obsidianUrl = `obsidian://open?vault=${encodeURIComponent(vaultPath)}`

	console.log(`Opening Obsidian vault: ${vaultPath}`)

	try {
		if (process.platform === 'darwin') {
			execSync(`open "${obsidianUrl}"`)
		} else if (process.platform === 'win32') {
			execSync(`start "" "${obsidianUrl}"`)
		} else {
			execSync(`xdg-open "${obsidianUrl}"`)
		}
		console.log('Obsidian should open shortly...')
	} catch (_error) {
		console.error('Failed to open Obsidian. Make sure it is installed.')
		console.log(`You can manually open: ${obsidianUrl}`)
	}
}

function createDailyNote(): void {
	const today = getTodayDate()
	const yesterday = getYesterdayDate()
	const tomorrow = getTomorrowDate()
	const filePath = join(DAILY_PATH, `${today}.md`)

	if (existsSync(filePath)) {
		console.log(`Daily note already exists: ${filePath}`)
		return
	}

	const templatePath = join(TEMPLATES_PATH, 'Daily Note Template.md')
	const template = existsSync(templatePath)
		? readFileSync(templatePath, 'utf-8')
		: '# {{date}}\n\n## Daily Log\n'

	const content = template
		.replace(/\{\{date:YYYY-MM-DD\}\}/g, today)
		.replace(/\{\{yesterday\}\}/g, yesterday)
		.replace(/\{\{tomorrow\}\}/g, tomorrow)

	writeFileSync(filePath, content)
	console.log(`Created daily note: ${filePath}`)
}

function createGitObservation(): void {
	const timestamp = getTimestamp().replace(/[:\s]/g, '-')
	const filePath = join(GIT_PATH, `git-observation-${timestamp}.md`)

	const templatePath = join(TEMPLATES_PATH, 'Git Observation Template.md')
	const template = existsSync(templatePath)
		? readFileSync(templatePath, 'utf-8')
		: '# Git Observation - {{timestamp}}\n\n## Status\n{{status}}\n'

	const branch = getCurrentBranch()
	const commit = getCurrentCommit()
	const commits = getRecentCommits()
	const files = getChangedFiles()

	const content = template
		.replace(/\{\{date:YYYY-MM-DD HH:mm\}\}/g, getTimestamp())
		.replace(/\{\{date:YYYY-MM\}\}/g, getTodayDate().slice(0, 7))
		.replace('**Branch**:', `**Branch**: ${branch}`)
		.replace('**Commit**:', `**Commit**: ${commit}`)
		.replace('```\n```', `\`\`\`\n${commits}\n\`\`\``)
		.replace('- Modified:', `- Modified: ${files.modified.join(', ') || 'None'}`)
		.replace('- Added:', `- Added: ${files.added.join(', ') || 'None'}`)
		.replace('- Deleted:', `- Deleted: ${files.deleted.join(', ') || 'None'}`)

	writeFileSync(filePath, content)
	console.log(`Created git observation: ${filePath}`)
}

function createProgressEntry(title?: string): void {
	const entryTitle = title || `Progress-${getTodayDate()}`
	const safeTitle = entryTitle.replace(/[^a-zA-Z0-9\-_]/g, '-')
	const filePath = join(PROGRESS_PATH, `${safeTitle}.md`)

	if (existsSync(filePath)) {
		console.log(`Progress entry already exists: ${filePath}`)
		return
	}

	const templatePath = join(TEMPLATES_PATH, 'Progress Entry Template.md')
	const template = existsSync(templatePath)
		? readFileSync(templatePath, 'utf-8')
		: '# {{title}}\n\n## Description\n'

	const content = template
		.replace(/\{\{title\}\}/g, entryTitle)
		.replace(/\{\{date:YYYY-MM-DD\}\}/g, getTodayDate())
		.replace(/\{\{date:YYYY-MM-DD HH:mm\}\}/g, getTimestamp())

	writeFileSync(filePath, content)
	console.log(`Created progress entry: ${filePath}`)
}

// Initialize directories
function ensureDirectories(): void {
	;[DAILY_PATH, PROGRESS_PATH, GIT_PATH, join(VAULT_PATH, 'assets')].forEach((dir) => {
		if (!existsSync(dir)) {
			mkdirSync(dir, { recursive: true })
		}
	})
}

// Main
async function main() {
	const command = process.argv[2]
	const arg = process.argv[3]

	ensureDirectories()

	switch (command) {
		case 'daily':
			createDailyNote()
			break
		case 'git':
			createGitObservation()
			break
		case 'progress':
			createProgressEntry(arg)
			break
		case 'open':
			openObsidianVault()
			break
		case 'all':
			createDailyNote()
			createGitObservation()
			console.log('Created daily note and git observation')
			break
		default:
			console.log(`
Obsidian Vault Manager for Sui-ski Gateway

Usage:
  bun run obsidian:daily              Create today's daily note
  bun run obsidian:git                Generate git observation
  bun run obsidian:progress [title]   Create progress entry
  bun run obsidian:open               Open vault in Obsidian
  bun run obsidian:all                Create daily + git observation

The vault is located at: ${VAULT_PATH}
`)
	}
}

main().catch(console.error)
