// node --test test/execInjection.test.mjs
//
// The agent runs inside session containers that hold project repositories and
// git credentials. Every value that reached child_process.exec() went through
// a shell, so a crafted name was a command. These vectors spawn real child
// processes and assert the shell never runs what the name tried to smuggle;
// against the unfixed source they create the marker files and these tests fail.

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const MAIN = new URL("../src/main.mjs", import.meta.url).pathname;
const EMM = new URL("../src/EmuDbManager.class.mjs", import.meta.url).pathname;
const PWN = "/tmp/pwned";

function withoutMarker(fn) {
    fs.rmSync(PWN, { force: true });
    try {
        fn();
        assert.ok(!fs.existsSync(PWN), "shell command from a name was executed: " + PWN + " exists");
    } finally {
        fs.rmSync(PWN, { force: true });
    }
}

const TEST_ENV = { ...process.env, CONTAINER_AGENT_TEST: "true" };

test("R helper: a project path containing ';touch /tmp/pwned' runs nothing", () => {
    withoutMarker(() => {
        // getSessionsR builds `PROJECT_PATH=<value> R -s -f ...` - pre-fix the
        // injected half executed even though R itself is not installed here.
        spawnSync(
            process.execPath,
            [
                "-e",
                `import(${JSON.stringify(EMM)}).then(m => new m.default({ addLog(){} }).getSessionsR("x;touch ${PWN}"))`,
            ],
            { cwd: path.dirname(MAIN), encoding: "utf8", timeout: 30000, env: TEST_ENV },
        );
    });
});

test("getBundlesR: same vector, second helper instance", () => {
    withoutMarker(() => {
        spawnSync(
            process.execPath,
            [
                "-e",
                `import(${JSON.stringify(EMM)}).then(m => new m.default({ addLog(){} }).getBundlesR("x;touch ${PWN}"))`,
            ],
            { cwd: path.dirname(MAIN), encoding: "utf8", timeout: 30000, env: TEST_ENV },
        );
    });
});

test("delete-sessions: a session name that traverses cannot delete outside the EMU-DB", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "ca-del-" ));
    const emuDir = path.join(root, "Data", "VISP_emuDB");
    const victim = path.join(emuDir, "..", "victim_ses", "take_bndl");
    fs.mkdirSync(victim, { recursive: true });
    const env = {
        ...TEST_ENV,
        PROJECT_PATH: root,
        EMUDB_SESSIONS: Buffer.from(
            JSON.stringify([{ name: "../victim" }]),
        ).toString("base64"),
    };
    const r = spawnSync(process.execPath, [MAIN, "delete-sessions"], {
        encoding: "utf8",
        timeout: 30000,
        env,
    });
    assert.ok(
        fs.existsSync(victim),
        "traversal name removed a directory outside the session tree (exit=" +
            r.status +
            ", out=" +
            (r.stdout || "").trim() +
            ")",
    );
    assert.match(r.stdout || r.stderr || "", /"code":400|refused/i);
    fs.rmSync(root, { recursive: true, force: true });
});

test("delete-sessions: a legitimate space-bearing name still deletes inside the EMU-DB", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "ca-del-ok-" ));
    const sesDir = path.join(root, "Data", "VISP_emuDB", "Session 1_ses");
    fs.mkdirSync(path.join(sesDir, "take_bndl"), { recursive: true });
    fs.writeFileSync(path.join(sesDir, "Session 1.json"), "{}");
    const env = {
        ...TEST_ENV,
        PROJECT_PATH: root,
        EMUDB_SESSIONS: Buffer.from(
            JSON.stringify([{ name: "Session 1" }]),
        ).toString("base64"),
    };
    const r = spawnSync(process.execPath, [MAIN, "delete-sessions"], {
        encoding: "utf8",
        timeout: 30000,
        env,
    });
    assert.ok(!fs.existsSync(path.join(sesDir, "take_bndl")), "legit bundles must delete");
    assert.ok(fs.existsSync(path.join(sesDir, "Session 1.json")), "metadata file is kept");
    assert.match(r.stdout || "", /"code":200/);
    fs.rmSync(root, { recursive: true, force: true });
});

test("chown-directory is gone: it cannot execute anything, smuggled or not", () => {
    withoutMarker(() => {
        spawnSync(
            process.execPath,
            [MAIN, "chown-directory", "x;touch " + PWN, "root"],
            { encoding: "utf8", timeout: 30000, env: TEST_ENV },
        );
    });
});
