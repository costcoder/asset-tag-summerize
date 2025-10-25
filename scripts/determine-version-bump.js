#!/usr/bin/env node

/**
 * Automatic Semantic Version Bump Determination
 *
 * This script analyzes git commits since the last version tag and determines
 * whether to bump MAJOR, MINOR, or PATCH version based on commit messages.
 *
 * Based on Conventional Commits specification:
 * https://www.conventionalcommits.org/
 */

// ============================================================================
// CONFIGURATION - Edit these lists to customize bump behavior
// ============================================================================

const VERSION_BUMP_CONFIG = {
  /**
   * MAJOR version bump (X.0.0) - Breaking changes
   * Add patterns that indicate breaking changes or incompatible API changes
   */
  major: {
    patterns: [
      /BREAKING CHANGE:/i,           // "BREAKING CHANGE:" in commit body
      /^[a-z]+!:/,                   // Any type with "!" (e.g., "feat!:", "fix!:")
      /^breaking:/i,                 // Commits starting with "breaking:"
    ],
    commitTypes: [
      'breaking',                    // "breaking: description"
    ]
  },

  /**
   * MINOR version bump (0.X.0) - New features (backward compatible)
   * Add patterns that indicate new functionality
   */
  minor: {
    patterns: [
      /^feat:/i,                     // "feat: description"
      /^feature:/i,                  // "feature: description"
    ],
    commitTypes: [
      'feat',
      'feature',
    ]
  },

  /**
   * PATCH version bump (0.0.X) - Bug fixes and minor changes
   * Add patterns that indicate bug fixes or small improvements
   */
  patch: {
    patterns: [
      /^fix:/i,                      // "fix: description"
      /^bugfix:/i,                   // "bugfix: description"
      /^patch:/i,                    // "patch: description"
      /^perf:/i,                     // "perf: performance improvements"
      /^security:/i,                 // "security: security fixes"
    ],
    commitTypes: [
      'fix',
      'bugfix',
      'patch',
      'perf',
      'security',
    ]
  },

  /**
   * NO BUMP - Commits that don't trigger a version bump
   * These are typically documentation, refactoring, or internal changes
   * (Currently not used - script defaults to PATCH for any changes)
   */
  noBump: {
    patterns: [
      /^docs:/i,                     // "docs: documentation updates"
      /^chore:/i,                    // "chore: maintenance tasks"
      /^style:/i,                    // "style: formatting changes"
      /^refactor:/i,                 // "refactor: code restructuring"
      /^test:/i,                     // "test: adding tests"
      /^ci:/i,                       // "ci: CI/CD changes"
      /^build:/i,                    // "build: build system changes"
    ],
    commitTypes: [
      'docs',
      'chore',
      'style',
      'refactor',
      'test',
      'ci',
      'build',
    ]
  }
};

// Default bump type when no specific patterns match (but commits exist)
const DEFAULT_BUMP = 'patch';

// ============================================================================
// SCRIPT LOGIC - Modify only if you need to change the core behavior
// ============================================================================

const { execSync } = require('child_process');

/**
 * Get the latest git tag (version)
 */
function getLatestTag() {
  try {
    const tag = execSync('git describe --tags --abbrev=0', { encoding: 'utf-8' }).trim();
    return tag;
  } catch (error) {
    // No tags exist yet
    return null;
  }
}

/**
 * Get all commit messages since the last tag
 */
function getCommitsSinceTag(tag) {
  try {
    const range = tag ? `${tag}..HEAD` : 'HEAD';
    const commits = execSync(`git log ${range} --pretty=format:"%s%n%b"`, { encoding: 'utf-8' })
      .trim()
      .split('\n')
      .filter(line => line.trim() !== '');

    return commits;
  } catch (error) {
    console.error('Error getting commits:', error.message);
    return [];
  }
}

/**
 * Check if any commit matches the patterns for a specific bump type
 */
function matchesPatterns(commits, patterns) {
  return commits.some(commit =>
    patterns.some(pattern => pattern.test(commit))
  );
}

/**
 * Determine the version bump type based on commits
 */
function determineVersionBump() {
  const latestTag = getLatestTag();
  console.error(`Latest tag: ${latestTag || 'none (first release)'}`);

  const commits = getCommitsSinceTag(latestTag);

  if (commits.length === 0) {
    console.error('No commits since last tag.');
    console.error(`Defaulting to: ${DEFAULT_BUMP}`);
    return DEFAULT_BUMP;
  }

  console.error(`Found ${commits.length} commit(s) since last tag:`);
  commits.slice(0, 5).forEach(commit => console.error(`  - ${commit}`));
  if (commits.length > 5) {
    console.error(`  ... and ${commits.length - 5} more`);
  }

  // Check for MAJOR bump
  if (matchesPatterns(commits, VERSION_BUMP_CONFIG.major.patterns)) {
    console.error('Detected: BREAKING CHANGE or major update');
    return 'major';
  }

  // Check for MINOR bump
  if (matchesPatterns(commits, VERSION_BUMP_CONFIG.minor.patterns)) {
    console.error('Detected: New feature (feat)');
    return 'minor';
  }

  // Check for PATCH bump
  if (matchesPatterns(commits, VERSION_BUMP_CONFIG.patch.patterns)) {
    console.error('Detected: Bug fix or patch');
    return 'patch';
  }

  // Default to PATCH for any other commits
  console.error(`No specific patterns matched. Defaulting to: ${DEFAULT_BUMP}`);
  return DEFAULT_BUMP;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

try {
  const bumpType = determineVersionBump();

  // Output only the bump type to stdout (for GitHub Actions to capture)
  console.log(bumpType);

  console.error(`\n✅ Determined version bump: ${bumpType.toUpperCase()}`);
  process.exit(0);
} catch (error) {
  console.error('Error:', error.message);
  console.error(`Falling back to: ${DEFAULT_BUMP}`);
  console.log(DEFAULT_BUMP);
  process.exit(0);
}
