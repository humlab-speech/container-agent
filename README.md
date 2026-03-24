# container-agent

A Node.js CLI tool that runs inside short-lived `visp-operations-session` containers to perform
filesystem, EMU-DB, and Git operations on behalf of the VISP platform.

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
| `reset` | Hard-reset to HEAD |
| `status` | Print working-tree status |
| `checkout` | Switch branch |
| `save` | Shorthand: chown → pull → add → commit → push |

**Filesystem utilities:**

| Command | Description |
|---|---|
| `copy-docs` | Copy uploaded documents into the project |
| `copy-project-template-directory` | Seed a new project from the template |
| `full-recursive-copy <src> <dest>` | General-purpose recursive copy |
| `chown-directory <path> <owner>` | Change directory ownership |
| `delete-sessions` | Remove bundle directories for specified sessions |

## Environment variables

All configuration is passed via environment variables set by session-manager when spawning
the container:

| Variable | Used by |
|---|---|
| `PROJECT_PATH` | All commands — path to the project inside the container |
| `GIT_REPOSITORY_URL` | `clone` — remote URL |
| `GIT_BRANCH` | `push` / `checkout` — branch name (default: `master`) |
| `GIT_USER_NAME` | Git identity |
| `GIT_USER_EMAIL` | Git identity |
| `EMUDB_SESSIONS` | EMU-DB commands — base64-encoded JSON session list |
| `ANNOT_LEVELS` | `emudb-create-annotlevel` — base64-encoded JSON level definitions |
| `BUNDLE_LISTS` | `emudb-create-bundlelist` — base64-encoded JSON bundle lists |
| `UPLOAD_PATH` | Session import — path to uploaded audio |

Set `GIT_SSL_NO_VERIFY=true` if the GitLab instance uses a self-signed certificate.

## How it is used in visible-speech-deployment

container-agent is built with webpack into a single bundle and injected into the
`visp-operations-session` container, where session-manager invokes it via the Podman exec API.
It is managed as part of the
[humlab-speech/visible-speech-deployment](https://github.com/humlab-speech/visible-speech-deployment)
repository — see the deployment repo's `AGENTS.md` for build and deployment details.

## Development

```bash
# Build the webpack bundle
npm run build

# Simulate a full project-creation sequence locally (reads .env)
CONTAINER_AGENT_TEST=true node src/main.mjs simulate
```

