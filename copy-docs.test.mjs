// node --test copy-docs.test.mjs  (requires npm install first)
// copyDocs cannot be imported in isolation (main.mjs instantiates ContainerAgent at
// import time), so this drives the real entrypoint the same way the session-manager
// does: `node src/main.mjs copy-docs` with PROJECT_PATH/UPLOAD_PATH/DOC_FILES env.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

function runCopyDocs(files) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "copy-docs-"));
    const src = path.join(root, "uploads", "docs");
    const proj = path.join(root, "proj");
    fs.mkdirSync(src, { recursive: true });
    fs.mkdirSync(path.join(proj, "Documents"), { recursive: true });
    for (const f of files) fs.writeFileSync(path.join(src, f), f);
    const r = spawnSync(process.execPath, [new URL("src/main.mjs", import.meta.url).pathname, "copy-docs"], {
        encoding: "utf8",
        env: { ...process.env, PROJECT_PATH: proj, UPLOAD_PATH: path.join(root, "uploads"), DOC_FILES: JSON.stringify(files) },
    });
    return { res: JSON.parse(r.stdout.trim()), stderr: r.stderr, proj };
}

test("copies allow-listed files, count exact, no warnings", () => {
    const { res, stderr, proj } = runCopyDocs(["a.txt", "b.txt"]);
    assert.equal(res.code, 200);
    assert.equal(res.body, "Copied 2 files");
    assert.ok(fs.existsSync(path.join(proj, "Documents", "a.txt")));
    assert.ok(fs.existsSync(path.join(proj, "Documents", "b.txt")));
    assert.ok(!stderr.includes("WARN"));
});

test("dot-prefixed unsafe name refuses the save instead of losing the document", () => {
    const { res, stderr, proj } = runCopyDocs(["ok.txt", "..2f.."]);
    // A document the form kept must end up in Documents/. 200 here told the caller the
    // save worked, after which it commits and removes the upload directory - so the
    // document was simply gone. The save now fails, the uploads survive, and the user
    // can rename the file and try again.
    assert.equal(res.code, 500);
    assert.match(res.body, /\.\.2f\.\./);
    assert.match(stderr, /WARN.*\.\.2f\.\./);
    assert.ok(fs.existsSync(path.join(proj, "Documents", "ok.txt")), "the other file still arrived");
});

test("non-listed orphans are not copied and not warned", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "copy-docs-"));
    const src = path.join(root, "uploads", "docs");
    const proj = path.join(root, "proj");
    fs.mkdirSync(src, { recursive: true });
    fs.mkdirSync(path.join(proj, "Documents"), { recursive: true });
    fs.writeFileSync(path.join(src, "kept.txt"), "k");
    fs.writeFileSync(path.join(src, "orphan.txt"), "o");
    const r = spawnSync(process.execPath, [new URL("src/main.mjs", import.meta.url).pathname, "copy-docs"], {
        encoding: "utf8",
        env: { ...process.env, PROJECT_PATH: proj, UPLOAD_PATH: path.join(root, "uploads"), DOC_FILES: '["kept.txt"]' },
    });
    assert.equal(JSON.parse(r.stdout.trim()).body, "Copied 1 files");
    assert.ok(fs.existsSync(path.join(proj, "Documents", "kept.txt")));
    assert.ok(!fs.existsSync(path.join(proj, "Documents", "orphan.txt")));
    assert.ok(!r.stderr.includes("WARN")); // orphans are the designed silent case, no noise
});

// Regression: the replace-before-copy step must only ever touch a committed document that
// this save actually carries. DOC_FILES is client-supplied, so an entry naming a document
// that is not in the upload directory used to unlink the committed file, answer
// "Copied 1 files" (the count walks src and never notices), and session-manager then
// committed the deletion and removed the uploads dir.
test("allow-list entry with no upload leaves the committed document alone", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "copy-docs-"));
    const src = path.join(root, "uploads", "docs");
    const proj = path.join(root, "proj");
    fs.mkdirSync(src, { recursive: true });
    fs.mkdirSync(path.join(proj, "Documents"), { recursive: true });
    fs.writeFileSync(path.join(src, "mine.txt"), "m");
    fs.writeFileSync(path.join(proj, "Documents", "victim.txt"), "committed by someone else");
    const r = spawnSync(process.execPath, [new URL("src/main.mjs", import.meta.url).pathname, "copy-docs"], {
        encoding: "utf8",
        env: { ...process.env, PROJECT_PATH: proj, UPLOAD_PATH: path.join(root, "uploads"), DOC_FILES: '["mine.txt","victim.txt"]' },
    });
    assert.equal(JSON.parse(r.stdout.trim()).body, "Copied 1 files");
    assert.match(r.stderr, /WARN.*victim\.txt/); // the mismatch must be visible, not a silent skip
    assert.ok(fs.existsSync(path.join(proj, "Documents", "victim.txt")), "committed Documents/victim.txt was deleted");
});

// The other direction: replacing a same-name re-upload is the reason the replace step exists.
test("same-name re-upload replaces the committed document", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "copy-docs-"));
    const src = path.join(root, "uploads", "docs");
    const proj = path.join(root, "proj");
    fs.mkdirSync(src, { recursive: true });
    fs.mkdirSync(path.join(proj, "Documents"), { recursive: true });
    fs.writeFileSync(path.join(src, "doc.txt"), "NEW");
    fs.writeFileSync(path.join(proj, "Documents", "doc.txt"), "OLD");
    const r = spawnSync(process.execPath, [new URL("src/main.mjs", import.meta.url).pathname, "copy-docs"], {
        encoding: "utf8",
        env: { ...process.env, PROJECT_PATH: proj, UPLOAD_PATH: path.join(root, "uploads"), DOC_FILES: '["doc.txt"]' },
    });
    assert.equal(JSON.parse(r.stdout.trim()).body, "Copied 1 files");
    assert.equal(fs.readFileSync(path.join(proj, "Documents", "doc.txt"), "utf8"), "NEW");
});

// The mismatch this branch exists to make loud: a DOC_FILES name that does not match what
// the upload actually saved on disk (api.php sanitizes, the form does not). Nothing arrives,
// and a 200 here means the caller commits and deletes the only copy of the document.
test("a kept document that reaches nowhere refuses the save", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "copy-docs-"));
    const src = path.join(root, "uploads", "docs");
    const proj = path.join(root, "proj");
    fs.mkdirSync(src, { recursive: true });
    fs.mkdirSync(path.join(proj, "Documents"), { recursive: true });
    fs.writeFileSync(path.join(src, "consent report.pdf"), "pdf");
    const r = spawnSync(process.execPath, [new URL("src/main.mjs", import.meta.url).pathname, "copy-docs"], {
        encoding: "utf8",
        env: { ...process.env, PROJECT_PATH: proj, UPLOAD_PATH: path.join(root, "uploads"), DOC_FILES: '["consent_report.pdf"]' },
    });
    const res = JSON.parse(r.stdout.trim());
    assert.equal(res.code, 500);
    assert.match(res.body, /consent_report\.pdf/);
    assert.ok(!fs.existsSync(path.join(proj, "Documents", "consent_report.pdf")));
});

// Keeping no documents at all is a legitimate save (the user removed them all in the form).
test("an empty allow-list is a successful save", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "copy-docs-"));
    const src = path.join(root, "uploads", "docs");
    const proj = path.join(root, "proj");
    fs.mkdirSync(src, { recursive: true });
    fs.mkdirSync(path.join(proj, "Documents"), { recursive: true });
    fs.writeFileSync(path.join(src, "orphan.txt"), "removed in the UI");
    fs.writeFileSync(path.join(proj, "Documents", "earlier.txt"), "committed before");
    const r = spawnSync(process.execPath, [new URL("src/main.mjs", import.meta.url).pathname, "copy-docs"], {
        encoding: "utf8",
        env: { ...process.env, PROJECT_PATH: proj, UPLOAD_PATH: path.join(root, "uploads"), DOC_FILES: "[]" },
    });
    const res = JSON.parse(r.stdout.trim());
    assert.equal(res.code, 200);
    assert.equal(res.body, "Copied 0 files");
    assert.ok(!fs.existsSync(path.join(proj, "Documents", "orphan.txt")));
    assert.ok(fs.existsSync(path.join(proj, "Documents", "earlier.txt")), "committed files are untouched");
});
