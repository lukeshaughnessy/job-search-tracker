# Development Workflow

## Jira
- Jira project: SCRUM.
- Read the Jira issue through Atlassian MCP before implementing it.
- Do not create, transition, or close Jira issues unless explicitly requested.

## Git
- Never implement features directly on main.
- Before starting work, ensure the local repository is clean.
- Create a feature branch from the current main branch.
- Branch format: scrum-<issue-number>-<short-description>.
- Do not merge into main without explicit approval.
- Never force-push.
- Never rewrite published history.

## Implementation
- The local workspace is the source of truth while developing.
- Implement only the scope defined by the Jira issue.
- Run relevant tests.
- Run the production build before considering work complete.

## Commits
- Commit completed work to the feature branch.
- Commit messages must begin with the Jira key.
- Example: `SCRUM-15 Add application priority`.

## Completion
Report:
- What changed
- Tests/build results
- Branch name
- Commit SHA
- Any acceptance criteria not satisfied## Jira ↔ Git Traceability

All development work must be traceable from Jira Epic to GitHub.

Required hierarchy:

Jira Epic
  -> Jira Story / Task / Bug
     -> Git branch
        -> Commit
           -> Pull Request

### Before starting work

1. Read the requested Jira issue using Atlassian MCP.
2. Determine its parent Epic.
3. Verify that the issue belongs to an Epic.
4. If there is no Epic, or the Epic cannot be determined, STOP and ask
   the user. Do not create a branch or modify code.

### Branch naming

Every development branch must contain BOTH:
- Epic Jira key
- Issue Jira key

Format:

<epic-key>/<issue-key>-<short-description>

Example:

scrum-3/scrum-8-interview-tracking

Never implement Jira work on `main`.

### Commits

Every commit implementing Jira work must contain the Jira issue key.

Example:

SCRUM-8 Add interview scheduling

### Pull Requests

Every PR must identify BOTH the Epic and the implementation issue.

Title format:

[<EPIC-KEY>] <ISSUE-KEY> — <issue summary>

Example:

[SCRUM-3] SCRUM-8 — Interview Tracking

The PR description must contain:

Epic: <EPIC-KEY> — <Epic name>
Issue: <ISSUE-KEY> — <Issue name>

### Verification

Before creating a PR, verify through Atlassian MCP that:
- the Jira issue exists;
- the Epic exists;
- the issue belongs to that Epic;
- the branch contains the correct Epic and issue keys.

Do not guess Jira relationships.
