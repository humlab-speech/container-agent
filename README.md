# container-agent

A Node.js CLI tool that runs inside short-lived operations containers (image
`visp-jupyter-session`) to perform filesystem, EMU-DB, and Git operations on behalf of the
VISP platform.

## What it does

session-manager (the VISP WebSocket server) cannot directly manipulate project files because they
live inside per-user containers that run as a different user. container-agent bridges that gap: it
is injected into each operations container and invoked via `node /container-agent/main.js <command>`
over the Podman exec API.

### Command groups

**EMU-DB management** — wraps the [emuR](https://github.com/IPS-LMU/emuR) R package via child
process calls to set up and maintain EMU speech databases:

| Command | Description |
|---|---|
| `emudb-create` | Initialise a new EMU-DB |
| `emudb-create-sessions` | Import audio files as sessions into the DB |
| `emudb-create-bundlelist` | Create / regenerate bundle lists |
| `emudb-update-bundle-lists` | Sync bundle lists after session changes |
| `emudb-create-annotlevel` | Add an annotation level |
| `emudb-remove-annotlevel` | Remove an annotation level |
| `emudb-create-annotlevellink` | Link two annotation levels |
| `emudb-remove-annotlevellink` | Remove a level link |
| `emudb-add-default-perspectives` | Apply default EMU-webApp perspectives |
| `emudb-track-definitions` | Add track definitions |
| `emudb-ssff-track-definitions` | Add SSFF track definitions |
| `emudb-setsignalcanvasesorder` | Configure signal canvas order |
| `emudb-setlevelcanvasesorder` | Configure level canvas order |
| `emudb-scan` | Scan and report DB contents |
| `emudb-read-dbconfig` | Return the DB config as JSON |

**Git operations** — manages the per-project Git repository (backed by GitLab):

| Command | Description |
|---|---|
| `clone [sparse]` | Clone the project repository |
| `pull` | Pull latest changes |
| `add` | Stage all changes |
| `commit` | Commit staged changes |
| `push` | Push to remote |
| `reset` | Soft-reset one commit back (`HEAD^`, changes stay staged) |
| `status` | Print working-tree status |
| `checkout` | Create a fresh `system-branch-<timestamp>` local branch (used only to recover from push conflicts — it does not switch to a given branch) |
| `save` | Shorthand: pull → add → commit → push (the former chown step was removed: chowning under `--userns=keep-id` corrupts shared ownership) |

**Filesystem utilities:**

| Command | Description |
|---|---|
| `copy-docs` | Copy uploaded documents into the project (see copy-docs semantics below) |
| `copy-project-template-directory` | Seed a new project from the template |
| `full-recursive-copy <src> <dest>` | General-purpose recursive copy |
| `chown-directory <path> <owner>` | ⚠️ Legacy, no caller: chowning breaks ownership under keep-id. Do not use |
| `delete-sessions` | Remove bundle directories for specified sessions |

### copy-docs semantics

With `DOC_FILES` set (a **plain JSON** allow-list — not base64), only allow-listed documents
are considered; within that list, only documents **this save actually carries** (present in
the upload directory) replace same-named files in the project. An allow-listed document
missing from the upload directory is a WARN, not an error — unless it must nevertheless be
kept and cannot be delivered, in which case the save fails with `code: 500` in the JSON
response, which session-manager honors by aborting before deleting the uploads.

## Environment variables

All configuration is passed via environment variables set by session-manager when spawning
the container:

| Variable | Used by |
|:---|:---|
| `PROJECT_PATH` | All commands — path to the project inside the container |
| `GIT_REPOSITORY_URL` | `clone` — remote URL |
| `GIT_BRANCH` | `push` only — overrides the built-in `master` default (never read by `checkout`) |
| `GIT_USER_NAME` | Git identity |
| `GIT_USER_EMAIL` | Git identity |
| `EMUDB_SESSIONS` | `emudb-create-sessions` and `delete-sessions` — base64-encoded JSON session list |
| `ANNOT_LEVEL_DEF_NAME` (+ `_TYPE`, read by create only) | `emudb-create-annotlevel` and `emudb-remove-annotlevel` — single level definition |
| `ANNOT_LEVEL_LINK_SUPER` / `_SUB` (+ `_DEF_TYPE`, read by create only) | `emudb-create-annotlevellink` and `emudb-remove-annotlevellink` — single link definition |
| `ANNOT_LEVELS` | `emudb-setlevelcanvasesorder` — base64-encoded JSON level order |
| `BUNDLE_LIST_NAME` | `emudb-create-bundlelist` — single bundle list name |
| `BUNDLE_LISTS` | `emudb-update-bundle-lists` — base64-encoded JSON bundle lists |
| `DOC_FILES` | `copy-docs` — **plain JSON** document allow-list |
| `WRITE_META_JSON` | `emudb-create-sessions` — toggles meta.json rewrite |
| `UPLOAD_PATH` | Session import — path to uploaded audio; `UPLOAD_PATH/docs` is the copy-docs source |

Set `GIT_SSL_NO_VERIFY=true` if the GitLab instance uses a self-signed certificate.

## How it is used in visible-speech-deployment

container-agent is built with webpack into a single bundle (`dist/main.js`, plus the R
`scripts/` and `tools/` they invoke) and injected into operations containers — the
`visp-jupyter-session` image bakes it in for prod, and dev bind-mounts `dist/` — where
session-manager invokes it via the Podman exec API.
It is managed as part of the
[humlab-speech/visible-speech-deployment](https://github.com/humlab-speech/visible-speech-deployment)
repository — see the deployment repo's `AGENTS.md` for build and deployment details.

## Response contract

Commands answer as a `{ "code": <n>, "body": ... }` JSON object on **stdout**, and the
process normally exits 0 regardless of the code — callers (session-manager) parse the JSON,
never the exit status. Exceptions to know: missing git env vars or a missing command
argument throw synchronously (non-zero exit, no JSON); a few commands print the raw error
object instead of a JSON envelope on failure; and an unexpected push/commit error can crash
the process without a JSON answer (known code gap — do not build retry logic on exit status).

## Development

```bash
# Build the webpack bundle
npm run build

# Unit tests (copy-docs semantics)
npm test

# Simulate a full project-creation sequence locally (reads .env)
CONTAINER_AGENT_TEST=true node src/main.mjs simulate
```
