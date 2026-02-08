import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
	testDir: './e2e',
	outputDir: './test-results',
	timeout: 30000,
	use: {
		baseURL: 'https://sui.ski',
		screenshot: 'on',
		trace: 'on-first-retry',
	},
	projects: [
		{
			name: 'iPhone 14',
			use: { ...devices['iPhone 14'] },
		},
		{
			name: 'iPhone SE',
			use: { ...devices['iPhone SE'] },
		},
		{
			name: 'Pixel 7',
			use: { ...devices['Pixel 7'] },
		},
	],
})
