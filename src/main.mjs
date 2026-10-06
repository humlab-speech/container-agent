import "process";
import copy from "recursive-copy";
import ApiResponse from "./ApiResponse.class.mjs";
import GitRepository from "./GitRepository.class.mjs";
import EmuDbManager from "./EmuDbManager.class.mjs";
import dotenv from "dotenv";
import fs from "fs";
import { exec } from "child_process";


/**
 * This agent is aware of the following env-vars:
 *
 * CONTAINER_AGENT_TEST - Toggle test/dev mode on/off - if it's on the .env-file is read
 * GIT_USER_NAME
 * GIT_USER_EMAIL
 * GIT_BRANCH
 * GIT_REPOSITORY_URL
 * PROJECT_PATH
 * 
**/

export default class ContainerAgent {
    constructor() {
        if(typeof process.env.CONTAINER_AGENT_TEST == "undefined") {
            process.env.CONTAINER_AGENT_TEST = 'false';
        }
        
        if(process.env.CONTAINER_AGENT_TEST === 'true') {
            dotenv.config();
        }

        if(typeof process.argv[2] == 'undefined') {
            console.log('No command supplied');
            throw new Error();
        }
        else {
        
            let cmd = process.argv[2];
            let args = process.argv;
            args.splice(0, 3);
        
            const gitCommands = ['clone', 'pull', 'add', 'commit', 'reset', 'push', 'status', 'checkout', 'save'];
            let repo = null;
            if(gitCommands.includes(cmd)) {
                let repoPath = process.env.PROJECT_PATH ? process.env.PROJECT_PATH : null;
                let gitUserName = process.env.GIT_USER_NAME ? process.env.GIT_USER_NAME : null;
                let gitUserEmail = process.env.GIT_USER_EMAIL ? process.env.GIT_USER_EMAIL : null;
                let bunldeLists = process.env.BUNDLE_LISTS ? process.env.BUNDLE_LISTS : null;
        
                let errors = [];
                if(repoPath == null) {
                    errors.push(new ApiResponse(500, 'Envvar PROJECT_PATH is not set'));
                }
                if(gitUserName == null) {
                    errors.push(new ApiResponse(500, 'Envvar GIT_USER_NAME is not set'));
                }
                if(gitUserEmail == null) {
                    errors.push(new ApiResponse(500, 'Envvar GIT_USER_EMAIL is not set'));
                }
        
                if(errors.length > 0) {
                    errors.forEach(error => {
                        console.error(error.toJSON());
                    });
                    throw new Error();
                }
                repo = new GitRepository(repoPath, gitUserName, gitUserEmail);
            }
        
            let emudbMan = null;
            if(cmd.split("-")[0] == "emudb" || cmd == "simulate") {
                emudbMan = new EmuDbManager(this);
            }
            
            switch(cmd) {
                case "simulate":
                    this.simulateProjectCreation(emudbMan)
                    break;
                case "copy-docs":
                    this.copyDocs().then(ar => console.log(ar.toJSON())).catch(ar => console.log(ar.toJSON()));
                    break;
                case "chown-directory":
                    this.chownDirectory(args[0], args[1]).then(ar => console.log(ar.toJSON())).catch(ar => console.log(ar.toJSON()));
                    break;
                case "copy-project-template-directory":
                    this.copyProjectTemplateDirectory().then(ar => console.log(ar.toJSON())).catch(ar => console.log(ar.toJSON()));
                    break;
                case "full-recursive-copy":
                    this.fullRecursiveCopy(args[0], args[1]).then(ar => console.log(ar.toJSON())).catch(ar => console.log(ar));
                    break;
                case "emudb-read-dbconfig":
                    emudbMan.getEmuDbConfigAsApiResponse(process.env.PROJECT_PATH).then(ar => console.log(ar.toJSON())).catch(ar => console.log(ar.toJSON()));
                    break;
                case "delete-sessions":
                    this.deleteSessions().then(ar => console.log(ar.toJSON())).catch(ar => console.log(ar));
                    break;
                case "emudb-create":
                    emudbMan.create().then(ar => console.log(ar.toJSON())).catch(ar => console.log(ar.toJSON()));
                    break;
                case "emudb-create-sessions":
                    emudbMan.createSessions().then(ar => console.log(ar.toJSON())).catch(ar => console.log(ar));
                    break;
                case "emudb-create-bundlelist":
                    emudbMan.createBundleList().then(ar => console.log(ar.toJSON())).catch(ar => console.log(ar.toJSON()));
                    break;
                case "emudb-update-bundle-lists":
                    emudbMan.updateBundleLists().then(ar => console.log(ar.toJSON())).catch(ar => console.log(ar));
                    break;
                case "emudb-create-annotlevel":
                    emudbMan.createAnnotationLevel().then(ar => console.log(ar.toJSON())).catch(ar => console.log(ar.toJSON()));
                    break;
                case "emudb-remove-annotlevel":
                    emudbMan.removeAnnotationLevel().then(ar => console.log(ar.toJSON())).catch(ar => console.log(ar.toJSON()));
                    break;
                case "emudb-create-annotlevellink":
                    emudbMan.createAnnotationLevelLink().then(ar => console.log(ar.toJSON())).catch(ar => console.log(ar.toJSON()));
                    break;
                case "emudb-remove-annotlevellink":
                    emudbMan.removeAnnotationLevelLink().then(ar => console.log(ar.toJSON())).catch(ar => console.log(ar.toJSON()));
                    break;
                case "emudb-add-default-perspectives":
                    emudbMan.addDefaultPerspectives().then(ar => console.log(ar.toJSON())).catch(ar => console.log(ar.toJSON()));
                    break;
                case "emudb-track-definitions":
                    emudbMan.addTrackDefinitions().then(ar => console.log(ar.toJSON())).catch(ar => console.log(ar.toJSON()));
                    break;
                case "emudb-ssff-track-definitions":
                    emudbMan.addSsffTrackDefinitions().then(ar => console.log(ar.toJSON())).catch(ar => console.log(ar.toJSON()));
                    break;
                case "emudb-setsignalcanvasesorder":
                    emudbMan.setSignalCanvasesOrder().then(ar => console.log(ar.toJSON())).catch(ar => console.log(ar.toJSON()));
                    break;
                case "emudb-setlevelcanvasesorder":
                    emudbMan.setLevelCanvasesOrder().then(ar => console.log(ar.toJSON())).catch(ar => console.log(ar.toJSON()));
                    break;
                case "emudb-scan":
                    emudbMan.scan().then(ar => console.log(ar.toJSON())).catch(ar => console.log(ar));
                    break;
                case 'clone':
                    let sparse = false;
                    if(args.length > 0 && args[0] == "sparse") {
                        sparse = true;
                    }
                    repo.clone(sparse).then(ar => console.log(ar.toJSON())).catch(ar => console.log(ar.toJSON()));
                    break;
                case "pull":
                    repo.pull().then(ar => console.log(ar.toJSON())).catch(ar => console.log(ar.toJSON()));
                    break;
                case 'add':
                    repo.add().then(ar => console.log(ar.toJSON())).catch(ar => console.log(ar.toJSON()));
                    break;
                case 'commit':
                    repo.commit().then(ar => console.log(ar.toJSON())).catch(ar => console.log(ar.toJSON()));
                    break;
                case 'reset':
                    repo.resetToHead().then(ar => console.log(ar.toJSON())).catch(ar => console.log(ar.toJSON()));
                    break;
                case 'push':
                    repo.push().then(ar => console.log(ar.toJSON())).catch(ar => console.log(ar.toJSON()));
                    break;
                case 'status':
                    repo.status().then(ar => console.log(ar.toJSON())).catch(ar => console.log(ar.toJSON()));
                    break;
                case 'checkout':
                    repo.checkoutBranch().then(ar => console.log(ar.toJSON())).catch(ar => console.log(ar.toJSON()));
                    break;
                case 'save': //Save is just a shorthand for pull+add+commit+push
                    // No ownership juggling: under rootless --userns=keep-id the
                    // bind-mounted repository is already owned by this container's
                    // service user (jovyan), which is the single host repo owner that
                    // session-manager, emu-webapp-server, wsrng-server and apache all
                    // map to. git therefore runs as the repo's owner with no dubious-
                    // ownership issue. The previous chown-to-root / chown-back dance is
                    // intentionally removed: chowning to container root under keep-id
                    // would remap the whole tree to a host sub-UID and corrupt the
                    // shared ownership every other service relies on.
                    //Try to pull in any changes
                    repo.pull().then((ar) => {
                        if(ar.code != 200) {
                            //If last operation caused an error, abort and return
                            console.log(ar.toJSON());
                            return;
                        }
                        repo.add().then((ar) => {
                            if(ar.code != 200) {
                                //If last operation caused an error, abort and return
                                console.log(ar.toJSON());
                                return;
                            }
                            repo.commit().then((ar) => {
                                if(ar.code != 200) {
                                    //If last operation caused an error, abort and return
                                    console.log(ar.toJSON());
                                    return;
                                }
                                repo.push().then(ar => {
                                    console.log(ar.toJSON())
                                });
                            });
                        });
                    })

                    break;
            }
        }
    }

    // Copies documents uploaded in the project dialog into the project's Documents folder
    copyDocs() {
        if(!process.env.PROJECT_PATH) {
            return Promise.resolve(new ApiResponse(500, 'PROJECT_PATH is not set'));
        }
        const srcDir = (process.env.UPLOAD_PATH || '/home/uploads') + '/docs';
        if(!fs.existsSync(srcDir)) {
            return Promise.resolve(new ApiResponse(200, 'No documents to copy'));
        }
        // No overwrite option: with overwrite:true recursive-copy rimrafs any existing
        // dest entry when a source file collides with a same-named dest directory,
        // silently deleting whole folders from the user's git-tracked repo. Same-name
        // re-uploads are already collapsed into one file by the PHP upload handler.
        // DOC_FILES (optional): authoritative list of documents the user actually kept in
        // the form. The upload dir can also contain orphans - files removed in the UI are
        // never deleted server-side - so when the list is given, copy only those files.
        const destDir = process.env.PROJECT_PATH + '/Documents';
        let copyOptions = { junk: true }; // only exclusion left is 'dot-prefixed', so 'may be replaced' below can mirror 'will be placed'
        let allow = null;
        if(process.env.DOC_FILES) {
            try {
                allow = new Set(JSON.parse(process.env.DOC_FILES).map(f => (f && f.name) ? f.name : f));
            } catch(error) {
                // Fail the copy instead of falling back to copying everything - that fallback
                // is exactly the leak above. Answer 500, not 400: 400 was swallowed as 'no documents'.
                console.error('copy-docs: unparseable DOC_FILES: ' + error);
                return Promise.resolve(new ApiResponse(500, 'Invalid DOC_FILES: ' + error));
            }
            copyOptions.filter = function(relPath) {
                return allow.has(relPath.split(/[\\/]/)[0]);
            };
        }
        // A same-name re-upload must replace the committed document: without overwrite:true
        // recursive-copy dies with EEXIST on an existing dest file, so every update would
        // fail and silently keep the old version. Delete the stale dest FILE first - and take
        // the names from the SOURCE LISTING, never from DOC_FILES: an allow-list entry is
        // client-supplied and may name a committed document this save does not carry, and
        // unlinking that one deletes a colleague's committed file while the copy still
        // answers 200 (the count below walks src, so it never notices). Replacing regular,
        // non-dot-prefixed source files is exactly the set copy() will place.
        // ponytail: a copy that fails after the replace loses that one committed file (the
        // uploads dir survives, so it is recoverable by retry); copy-to-temp + renameSync in
        // the same directory is the upgrade if that ever bites.
        let replace = [];
        try {
            replace = fs.readdirSync(srcDir, { withFileTypes: true })
                .filter(entry => entry.isFile() && !entry.name.startsWith('.'))
                .map(entry => entry.name)
                .filter(name => !allow || allow.has(name));
        } catch(error) {
            console.error('copy-docs: cannot list ' + srcDir + ', no committed file will be replaced: ' + error);
        }
        replace.forEach(name => {
            try {
                fs.unlinkSync(destDir + '/' + name);
            } catch(error) {
                if(error.code != 'ENOENT' && error.code != 'EISDIR') {
                    console.error('copy-docs: could not replace ' + name + ': ' + error);
                }
            }
        });
        return copy(srcDir, destDir, copyOptions)
        .then(function() {
            // recursive-copy's dot filter silently drops dot-prefixed names (e.g. a
            // sanitized upload '..2f..') and the resolved results can overcount what was
            // actually placed ("Copied 5 files", 4 placed). Never report the library's
            // number: walk the source, keep only allow-listed entries, and count solely
            // the files that really arrived in dest. Each requested-but-not-placed entry is
            // WARNed by name via the existing console.error channel. The allow-list itself
            // is unchanged: unsafe dot-prefixed names are still skipped, partial success
            // is still 200.
            const requested = [];
            const walk = (dir, prefix) => {
                for(const entry of fs.readdirSync(dir, {withFileTypes: true})) {
                    if(entry.isDirectory()) walk(dir + '/' + entry.name, prefix + entry.name + '/');
                    else requested.push(prefix + entry.name);
                }
            };
            walk(srcDir, '');
            let copied = 0;
            requested
            .filter(rel => !allow || allow.has(rel.split(/[\\/]/)[0]))
            .forEach(rel => {
                if(fs.existsSync(destDir + '/' + rel)) copied++;
                else console.error('copy-docs: WARN entry not copied (silently skipped, e.g. dot-prefixed unsafe name): ' + rel);
            });
            return new ApiResponse(200, 'Copied ' + copied + ' files');
        })
        .catch(function(error) {
            // 500 (not 400): a real copy failure must ABORT the save, so the flow stops
            // before the uploads directory is cleaned up and nothing is lost silently.
            console.error('copy-docs failed: ' + error);
            return new ApiResponse(500, 'Copy failed: ' + error);
        });
    }
    
    async chownDirectory(directory, toUser = "root") {
        return new Promise((resolve, reject) => {
            exec("chown -R "+toUser+" "+directory, (error, stdout, stderr) => {
                resolve(new ApiResponse(200, { stdout: stdout, stderr: stderr, error: error} ));
            });
        });
    }
    
    async fullRecursiveCopy(src, dest) {
        let options = {
            dot: true //Also copy hidden files
        };
    
        return copy(src, dest, options)
        .then(function(results) {
            return new ApiResponse(200, 'Copied ' + results.length + ' files');
        })
        .catch(function(error) {
            return new ApiResponse(400, 'Copy failed' + error);
        });
    }

    async deleteSessions() {
        //we want to delete all the bundles in this session without deleting the session itself and the metadata file
        let sessions = Buffer.from(process.env.EMUDB_SESSIONS, 'base64').toString('utf8');
        JSON.parse(sessions).forEach(session => {
            //scan the directory
            let bundleNames = fs.readdirSync(process.env.PROJECT_PATH+"/Data/VISP_emuDB/"+session.name+"_ses");
            //filter out the metadata file
            bundleNames = bundleNames.filter(bundleName => bundleName != session.name+".json");
            //delete the bundles
            bundleNames.forEach(bundleName => {
                let path = process.env.PROJECT_PATH+"/Data/VISP_emuDB/"+session.name+"_ses/"+bundleName;
                fs.rmdirSync(path, { recursive: true });
            });
        });

        return new ApiResponse(200, "Deleted sessions");
    }
    
    async copyProjectTemplateDirectory() {
        let options = {
            dot: true //Also copy hidden files
        };
    
        return copy('/project-template-structure', process.env.PROJECT_PATH, options)
        .then(function(results) {
            return new ApiResponse(200, 'Copied ' + results.length + ' files');
        })
        .catch(function(error) {
            return new ApiResponse(400, 'Copy failed' + error);
        });
    }
    
    async simulateProjectCreation(emudbMan) {
        process.env['SIMULATION'] = "true";
    
        //Check that env-var PROJECT_PATH is set, otherwise set it to something default.
        if(!process.env['PROJECT_PATH']) {
            process.env['PROJECT_PATH'] = "/home/project-setup";
            fs.mkdirSync(process.env['PROJECT_PATH'], {
                recursive: true
            })
        }
        //Check that EMUDB_SESSIONS is set, otherwise set it to something default.
        if(!process.env['EMUDB_SESSIONS']) {
            let sessionsJson = `[{"id":"session-JPWUR30FXM9SMke8LGLQz","name":"Speaker_1","speakerGender":"Female","speakerAge":35,"files":[{"uploadComplete":true}]}]`;
            let b = new Buffer.from(sessionsJson, "utf8");
            process.env['EMUDB_SESSIONS'] = b.toString('base64');
        }
    
        if(!process.env['UPLOAD_PATH']) {
            process.env['UPLOAD_PATH'] = "/home/uploads";
        }
    
        if(!process.env['ANNOT_LEVELS']) {
            let annotLevelsJson = `[{"name":"Word","type":"ITEM"},{"name":"Phonetic","type":"SEGMENT"}]`;
            let b = new Buffer.from(annotLevelsJson, "utf8");
            process.env['ANNOT_LEVELS'] = b.toString('base64');
        }
    
        //emudb-create
        console.log("create");
        await emudbMan.create().then(ar => console.log(ar.toJSON())).catch(ar => console.log(ar.toJSON()));
        //emudb-create-sessions
        console.log("\ncreateSessions");
        await emudbMan.createSessions().then(ar => console.log(ar.toJSON())).catch(ar => console.log(ar.toJSON()));
        //emudb-create-bundlelist
        console.log("\ncreateBundleList");
        await emudbMan.createBundleList().then(ar => console.log(ar.toJSON())).catch(ar => console.log(ar.toJSON()));
        //emudb-create-annotlevel
        process.env['ANNOT_LEVEL_DEF_NAME'] = "Word";
        process.env['ANNOT_LEVEL_DEF_TYPE'] = "ITEM";
        console.log("\ncreateAnnotationLevel");
        await emudbMan.createAnnotationLevel().then(ar => console.log(ar.toJSON())).catch(ar => console.log(ar.toJSON()));
        process.env['ANNOT_LEVEL_DEF_NAME'] = "Phonetic";
        process.env['ANNOT_LEVEL_DEF_TYPE'] = "SEGMENT";
        console.log("\ncreateAnnotationLevel");
        await emudbMan.createAnnotationLevel().then(ar => console.log(ar.toJSON())).catch(ar => console.log(ar.toJSON()));
        //emudb-create-annotlevellink
        process.env['ANNOT_LEVEL_LINK_SUPER'] = "Word";
        process.env['ANNOT_LEVEL_LINK_SUB'] = "Phonetic";
        process.env['ANNOT_LEVEL_LINK_DEF_TYPE'] = "ONE_TO_MANY";
        console.log("\ncreateAnnotationLevelLink");
        await emudbMan.createAnnotationLevelLink().then(ar => console.log(ar.toJSON())).catch(ar => console.log(ar.toJSON()));
        
        //emudb-add-default-perspectives - perhaps this should exec BEFORE setLevelCanvasesOrder?
        console.log("\naddDefaultPerspectives");
        await emudbMan.addDefaultPerspectives().then(ar => console.log(ar.toJSON())).catch(ar => console.log(ar.toJSON()));
        
        //emudb-setlevelcanvasesorder
        console.log("\nsetLevelCanvasesOrder");
        await emudbMan.setLevelCanvasesOrder().then(ar => console.log(ar.toJSON())).catch(ar => console.log(ar.toJSON()));
        
        //emudb-track-definitions
        console.log("\naddTrackDefinitions");
        await emudbMan.addTrackDefinitions().then(ar => console.log(ar.toJSON())).catch(ar => console.log(ar.toJSON()));
    
        //emudb-setsignalcanvasesorder
        console.log("\nsetSignalCanvasesOrder");
        await emudbMan.setSignalCanvasesOrder().then(ar => console.log(ar.toJSON())).catch(ar => console.log(ar.toJSON()));    
        
        
        //full-recursive-copy
        //await fullRecursiveCopy(args[0], args[1]).then(ar => console.log(ar.toJSON())).catch(ar => console.log(ar.toJSON()));
        //...and then a push to git
    
        console.log("All done");
    }


};

new ContainerAgent();