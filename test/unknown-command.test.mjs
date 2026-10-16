// node --test test/unknown-command.test.mjs
//
// An unknown command used to fall through the switch in src/main.mjs with no
// `default:` arm: the process exited 0 and printed nothing. Session-manager
// turned that empty stdout into { error: "" } and ApiServer logged "returned
// unparseable output; assuming success", so a mixed-version deployment (old
// caller, new image) reported a destructive step — e.g. the deleted
// delete-sessions — as completed when it did nothing. Unknown must be loud.

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const MAIN = new URL("../src/main.mjs", import.meta.url).pathname;

function run(cmd) {
    return spawnSync(process.execPath, [MAIN, cmd], {
        encoding: "utf8",
        timeout: 30000,
        env: { ...process.env, CONTAINER_AGENT_TEST: "true", PROJECT_PATH: "/tmp", EMUDB_SESSIONS: "e3o=" },
    });
}

for (const cmd of ["delete-sessions", "chown-directory", "no-such-command"]) {
    test(`unknown command '${cmd}' fails loudly instead of exiting 0 with empty stdout`, () => {
        const r = run(cmd);
        assert.notEqual(r.status, 0, `exit code must be non-zero (stdout was: ${JSON.stringify(r.stdout)})`);
        const res = JSON.parse(r.stdout.trim());
        assert.equal(res.code, 400);
        assert.match(res.body, new RegExp(`Unknown command: ${cmd}`));
    });
}
