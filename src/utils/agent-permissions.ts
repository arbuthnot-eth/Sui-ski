/**
 * Agent Permissions Utilities
 * Validates and checks permissions for agency members.
 */

import type {
	AgencyMember,
	Capability,
	DWalletPermission,
	MemberRole,
	MemberType,
	PermissionMatrix,
} from '../types/agents'

/**
 * Check if a member has a specific capability
 */
export function hasCapability(member: AgencyMember, capability: Capability): boolean {
	return member.capabilities.includes(capability)
}

/**
 * Check if a member's role allows a specific action
 */
export function roleAllowsAction(role: MemberRole, action: Capability, permissions: PermissionMatrix): boolean {
	// Owners can do everything
	if (role === 'owner') {
		return true
	}

	// Check if action requires owner
	if (permissions.ownerRequired.includes(action)) {
		return false
	}

	// Admins can do admin-level and below
	if (role === 'admin') {
		return true
	}

	// Operators can only do what's not admin-required
	return !permissions.adminRequired.includes(action)
}

/**
 * Check if an LLM agent can perform an action autonomously
 */
export function llmCanActAutonomously(
	action: Capability,
	permissions: PermissionMatrix,
): boolean {
	return permissions.llmAutonomous.includes(action)
}

/**
 * Check if an action requires 2PC-MPC (two-party computation)
 */
export function requires2PC(action: Capability, permissions: PermissionMatrix): boolean {
	return permissions.twoPartyRequired.includes(action)
}

/**
 * Validate if a member can perform a specific action
 */
export function canPerformAction(
	member: AgencyMember,
	action: Capability,
	permissions: PermissionMatrix,
): { allowed: boolean; reason?: string; requires2PC?: boolean } {
	// Check if member has the capability
	if (!hasCapability(member, action)) {
		return {
			allowed: false,
			reason: `Member does not have the "${action}" capability`,
		}
	}

	// Check role-based access
	if (!roleAllowsAction(member.role, action, permissions)) {
		return {
			allowed: false,
			reason: `Role "${member.role}" is not allowed to perform "${action}"`,
		}
	}

	// For LLM agents, check if action requires 2PC-MPC
	if (member.type === 'llm_agent' && requires2PC(action, permissions)) {
		return {
			allowed: true,
			requires2PC: true,
			reason: 'LLM agent requires human approval for this action',
		}
	}

	// For LLM agents, check if action can be done autonomously
	if (member.type === 'llm_agent' && !llmCanActAutonomously(action, permissions)) {
		return {
			allowed: false,
			reason: 'LLM agents cannot perform this action autonomously',
		}
	}

	return { allowed: true }
}

/**
 * Check if a spending amount is within limits
 */
export function isWithinSpendingLimits(
	amountMist: string,
	limitType: 'perTransaction' | 'perDay' | 'perMonth',
	permissions: PermissionMatrix,
): boolean {
	const amount = BigInt(amountMist)
	const limit = BigInt(permissions.spendingLimits[limitType])
	return amount <= limit
}

/**
 * Get all capabilities for a role
 */
export function getCapabilitiesForRole(role: MemberRole): Capability[] {
	const allCapabilities: Capability[] = [
		'send_messages',
		'read_messages',
		'manage_channels',
		'invite_members',
		'remove_members',
		'update_metadata',
		'manage_dwallet',
		'sign_transactions',
		'broadcast_news',
		'moderate_content',
	]

	switch (role) {
		case 'owner':
			return allCapabilities
		case 'admin':
			return allCapabilities.filter(c =>
				!['remove_members', 'manage_dwallet'].includes(c)
			)
		case 'operator':
			return ['send_messages', 'read_messages', 'broadcast_news']
		default:
			return []
	}
}

/**
 * Get default capabilities for a member type
 */
export function getDefaultCapabilities(type: MemberType, role: MemberRole): Capability[] {
	const roleCapabilities = getCapabilitiesForRole(role)

	// LLM agents have restricted defaults
	if (type === 'llm_agent') {
		return roleCapabilities.filter(c =>
			['send_messages', 'read_messages', 'broadcast_news'].includes(c)
		)
	}

	// Backend bots can do everything their role allows
	if (type === 'backend_bot') {
		return roleCapabilities
	}

	// Humans get full role capabilities
	return roleCapabilities
}

/**
 * Validate member configuration
 */
export function validateMemberConfig(member: Partial<AgencyMember>): { valid: boolean; errors: string[] } {
	const errors: string[] = []

	if (!member.address) {
		errors.push('Member address is required')
	} else if (!member.address.startsWith('0x')) {
		errors.push('Invalid Sui address format')
	}

	if (!member.type) {
		errors.push('Member type is required')
	} else if (!['human', 'llm_agent', 'backend_bot'].includes(member.type)) {
		errors.push('Invalid member type')
	}

	if (!member.role) {
		errors.push('Member role is required')
	} else if (!['owner', 'admin', 'operator'].includes(member.role)) {
		errors.push('Invalid member role')
	}

	// LLM agents should have a model ID
	if (member.type === 'llm_agent' && !member.modelId) {
		errors.push('LLM agents should specify a model ID')
	}

	// Validate dWallet permission if set
	if (member.dwalletPermission && !['view', 'propose', 'execute', 'full'].includes(member.dwalletPermission)) {
		errors.push('Invalid dWallet permission level')
	}

	// LLM agents should not have 'full' dWallet permission
	if (member.type === 'llm_agent' && member.dwalletPermission === 'full') {
		errors.push('LLM agents cannot have full dWallet permission (security risk)')
	}

	return {
		valid: errors.length === 0,
		errors,
	}
}

/**
 * Check if a dWallet operation is allowed based on permission level
 */
export function dwalletOperationAllowed(
	permission: DWalletPermission,
	operation: 'view' | 'propose' | 'execute' | 'manage',
): boolean {
	const levels: Record<DWalletPermission, number> = {
		view: 1,
		propose: 2,
		execute: 3,
		full: 4,
	}

	const operationLevels: Record<string, number> = {
		view: 1,
		propose: 2,
		execute: 3,
		manage: 4,
	}

	return levels[permission] >= operationLevels[operation]
}

/**
 * Format capability name for display
 */
export function formatCapability(capability: Capability): string {
	const names: Record<Capability, string> = {
		send_messages: 'Send Messages',
		read_messages: 'Read Messages',
		manage_channels: 'Manage Channels',
		invite_members: 'Invite Members',
		remove_members: 'Remove Members',
		update_metadata: 'Update Metadata',
		manage_dwallet: 'Manage dWallet',
		sign_transactions: 'Sign Transactions',
		broadcast_news: 'Broadcast News',
		moderate_content: 'Moderate Content',
	}
	return names[capability] || capability
}

/**
 * Get human-readable description for a permission check result
 */
export function describePermissionCheck(result: ReturnType<typeof canPerformAction>): string {
	if (result.allowed && result.requires2PC) {
		return 'Allowed with 2PC-MPC approval required'
	}
	if (result.allowed) {
		return 'Allowed'
	}
	return result.reason || 'Not allowed'
}
