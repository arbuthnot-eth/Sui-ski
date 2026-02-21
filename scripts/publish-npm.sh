#!/usr/bin/env bash
set -euo pipefail

if [[ $# -gt 2 ]]; then
	echo "usage: scripts/publish-npm.sh [patch|minor|major|prepatch|preminor|premajor|prerelease|<version>|--no-bump] [--dry-run]"
	exit 1
fi

BUMP="patch"
DRY_RUN="0"

for arg in "$@"; do
	case "$arg" in
		--dry-run)
			DRY_RUN="1"
			;;
		--no-bump)
			BUMP=""
			;;
		patch|minor|major|prepatch|preminor|premajor|prerelease)
			if [[ -n "$BUMP" && "$BUMP" != "patch" ]]; then
				echo "only one version argument is allowed"
				exit 1
			fi
			BUMP="$arg"
			;;
		[0-9]*.[0-9]*.[0-9]*|v[0-9]*.[0-9]*.[0-9]*)
			if [[ -n "$BUMP" && "$BUMP" != "patch" ]]; then
				echo "only one version argument is allowed"
				exit 1
			fi
			BUMP="$arg"
			;;
		*)
			echo "unknown argument: $arg"
			echo "usage: scripts/publish-npm.sh [patch|minor|major|prepatch|preminor|premajor|prerelease|<version>|--no-bump] [--dry-run]"
			exit 1
			;;
	esac
done

if [[ -z "${NODE_AUTH_TOKEN:-}" ]]; then
	echo "NODE_AUTH_TOKEN is required"
	exit 1
fi

TMP_NPMRC="$(mktemp)"
cleanup() {
	rm -f "$TMP_NPMRC"
}
trap cleanup EXIT

printf 'registry=https://registry.npmjs.org/\n//registry.npmjs.org/:_authToken=%s\n' "$NODE_AUTH_TOKEN" > "$TMP_NPMRC"

npm whoami --userconfig "$TMP_NPMRC" >/dev/null

if [[ -n "$BUMP" ]]; then
	npm version "$BUMP" --no-git-tag-version
fi

PACKAGE_NAME="$(npm pkg get name | tr -d '"')"
PACKAGE_VERSION="$(npm pkg get version | tr -d '"')"

if npm view "${PACKAGE_NAME}@${PACKAGE_VERSION}" version --userconfig "$TMP_NPMRC" >/dev/null 2>&1; then
	echo "${PACKAGE_NAME}@${PACKAGE_VERSION} is already published"
	echo "run with patch, minor, major, or an explicit new version"
	exit 1
fi

if [[ "$DRY_RUN" == "1" ]]; then
	npm publish --access public --dry-run --userconfig "$TMP_NPMRC"
else
	npm publish --access public --userconfig "$TMP_NPMRC"
fi
