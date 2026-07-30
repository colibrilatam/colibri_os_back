#!/usr/bin/env node
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const DOC_ISSUES_DIR = path.join(ROOT, 'doc-issues');
const REPO = process.env.GITHUB_REPOSITORY;
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;

if (!REPO) {
  fail('GITHUB_REPOSITORY is required');
}

if (!TOKEN) {
  fail('GITHUB_TOKEN is required');
}

const [owner, repo] = REPO.split('/');
if (!owner || !repo) {
  fail(`Invalid GITHUB_REPOSITORY value: ${REPO}`);
}

const API_BASE = `https://api.github.com/repos/${owner}/${repo}`;
const HEADERS = {
  Authorization: `Bearer ${TOKEN}`,
  Accept: 'application/vnd.github+json',
  'Content-Type': 'application/json',
  'User-Agent': 'doc-issues-sync',
  'X-GitHub-Api-Version': '2022-11-28',
};

async function main() {
  const files = await collectMarkdownFiles(DOC_ISSUES_DIR);
  if (files.length === 0) {
    console.log('No doc-issues markdown files found. Nothing to sync.');
    return;
  }

  const remoteIssues = await listIssues();
  const issuesById = new Map();

  for (const issue of remoteIssues) {
    const id = extractMarker(issue.body || '');
    if (!id) {
      continue;
    }
    if (issuesById.has(id)) {
      fail(`Duplicate remote issue marker found for ${id}`);
    }
    issuesById.set(id, issue);
  }

  const seenIds = new Set();
  const summary = { created: 0, updated: 0, skipped: 0 };

  for (const file of files) {
    const spec = await parseSpec(file);
    if (!spec) {
      summary.skipped++;
      continue;
    }

    if (seenIds.has(spec.id)) {
      fail(`Duplicate local doc issue id found: ${spec.id}`);
    }
    seenIds.add(spec.id);

    const desiredBody = buildIssueBody(spec, file);
    const desiredState = spec.state === 'closed' ? 'closed' : 'open';
    const existing = issuesById.get(spec.id);

    if (!existing) {
      const created = await api('POST', '/issues', {
        title: spec.title,
        body: desiredBody,
        labels: spec.labels,
        assignees: spec.assignees,
        milestone: spec.milestone,
      });
      summary.created++;

      if (desiredState === 'closed') {
        await api('PATCH', `/issues/${created.number}`, { state: 'closed' });
      }
      continue;
    }

    const patch = {
      title: spec.title,
      body: desiredBody,
      labels: spec.labels,
      assignees: spec.assignees,
      milestone: spec.milestone,
      state: desiredState,
    };

    if (needsUpdate(existing, patch)) {
      await api('PATCH', `/issues/${existing.number}`, patch);
      summary.updated++;
    } else {
      summary.skipped++;
    }
  }

  console.log(JSON.stringify(summary, null, 2));
}

function needsUpdate(existing, desired) {
  const currentLabels = (existing.labels || []).map((label) => label.name).sort().join('\u0000');
  const currentAssignees = (existing.assignees || []).map((user) => user.login).sort().join('\u0000');
  const desiredLabels = (desired.labels || []).slice().sort().join('\u0000');
  const desiredAssignees = (desired.assignees || []).slice().sort().join('\u0000');
  const currentMilestone = existing.milestone ? existing.milestone.number : null;

  return (
    (existing.title || '') !== desired.title ||
    (existing.body || '') !== desired.body ||
    currentLabels !== desiredLabels ||
    currentAssignees !== desiredAssignees ||
    currentMilestone !== (desired.milestone ?? null) ||
    (existing.state || 'open') !== desired.state
  );
}

async function listIssues() {
  const issues = [];
  let page = 1;

  while (true) {
    const batch = await api('GET', `/issues?state=all&per_page=100&page=${page}`);
    if (!Array.isArray(batch) || batch.length === 0) {
      break;
    }

    for (const issue of batch) {
      if (!issue.pull_request) {
        issues.push(issue);
      }
    }

    if (batch.length < 100) {
      break;
    }

    page++;
  }

  return issues;
}

async function api(method, endpoint, payload) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: HEADERS,
    body: payload ? JSON.stringify(payload) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub API ${method} ${endpoint} failed: ${response.status} ${response.statusText}\n${text}`);
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function collectMarkdownFiles(dir) {
  try {
    await stat(dir);
  } catch {
    return [];
  }

  const files = [];

  async function walk(currentDir) {
    const entries = await readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('_') || entry.name.startsWith('.')) {
        continue;
      }

      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }

      if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  }

  await walk(dir);
  files.sort();
  return files;
}

async function parseSpec(filePath) {
  const raw = await readFile(filePath, 'utf8');
  const normalized = raw.replace(/\r\n/g, '\n');
  if (!normalized.startsWith('---\n')) {
    fail(`Missing frontmatter in ${relativePath(filePath)}`);
  }

  const endIndex = normalized.indexOf('\n---\n', 4);
  if (endIndex === -1) {
    fail(`Unterminated frontmatter in ${relativePath(filePath)}`);
  }

  const frontmatter = normalized.slice(4, endIndex).trim();
  const body = normalized.slice(endIndex + 5).trim();
  const data = {};

  for (const line of frontmatter.split('\n')) {
    if (!line.trim()) {
      continue;
    }

    const separator = line.indexOf(':');
    if (separator === -1) {
      fail(`Invalid frontmatter line in ${relativePath(filePath)}: ${line}`);
    }

    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    data[key] = value;
  }

  const id = (data.id || '').trim();
  const title = (data.title || '').trim();
  if (!id || !title) {
    fail(`Missing required id/title in ${relativePath(filePath)}`);
  }

  const state = ((data.state || 'open').trim().toLowerCase());
  if (state !== 'open' && state !== 'closed') {
    fail(`Invalid state in ${relativePath(filePath)}: ${state}`);
  }

  const sync = parseBoolean(data.sync, true);
  if (!sync) {
    return null;
  }

  return {
    id,
    title,
    labels: parseList(data.labels),
    assignees: parseList(data.assignees),
    milestone: parseMilestone(data.milestone),
    state,
    body,
  };
}

function parseList(value) {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseMilestone(value) {
  if (!value) {
    return null;
  }

  const milestone = Number(value);
  if (!Number.isInteger(milestone) || milestone < 0) {
    fail(`Invalid milestone value: ${value}`);
  }

  return milestone;
}

function parseBoolean(value, defaultValue) {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  const normalized = value.trim().toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(normalized)) {
    return true;
  }

  if (['false', '0', 'no', 'off'].includes(normalized)) {
    return false;
  }

  fail(`Invalid boolean value: ${value}`);
}

function buildIssueBody(spec, filePath) {
  if (!spec.body) {
    fail(`Empty body in ${relativePath(filePath)}`);
  }

  const source = relativePath(filePath);
  return [
    `<!-- doc-issue-id: ${spec.id} -->`,
    `<!-- doc-issue-source: ${source} -->`,
    '',
    spec.body.trim(),
    '',
  ].join('\n');
}

function extractMarker(body) {
  const match = body.match(/<!--\s*doc-issue-id:\s*([^>]+?)\s*-->/i);
  return match ? match[1].trim() : null;
}

function relativePath(filePath) {
  return path.relative(ROOT, filePath).split(path.sep).join('/');
}

function fail(message) {
  throw new Error(message);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
