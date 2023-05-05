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
        exec("ls", (data) => {
            console.log(data);
        });

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
                case "emudb-create-annotlevels":
                    emudbMan.createAnnotationLevels().then(ar => console.log(ar.toJSON())).catch(ar => console.log(ar.toJSON()));
                    break;
                case "emudb-create-annotlevellinks":
                    emudbMan.createAnnotationLevelLinks().then(ar => console.log(ar.toJSON())).catch(ar => console.log(ar.toJSON()));
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
                case 'save': //Save is just a shorthand for chown+pull+add+commit+push
                    this.chownDirectory(repo.repoPath, "root:root").then(ar => {
                        if(ar.code != 200) {
                            //If last operation caused an error, abort and return 
                            console.log(ar.toJSON());
                            return;
                        }
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
                                        //Reset directory owner to 'main' container user
                                        this.chownDirectory(repo.repoPath, "1000:1000"); //this will cause a problem if we at some point in the future have containers beyond rstudio and jupyter which 'main' user is not uid 1000
                                        console.log(ar.toJSON())
                                    });
                                });
                            });
                        });
                    })
                    
                    break;
            }
        }
    }

    copyDocs() {
        return copy('/home/uploads/docs', '/home/project-setup/Documents')
        .then(function(results) {
            return new ApiResponse(200, 'Copied ' + results.length + ' files');
        })
        .catch(function(error) {
            return new ApiResponse(400, 'Copy failed' + error);
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
        //emudb-create-annotlevels
        process.env['ANNOT_LEVEL_DEF_NAME'] = "Word";
        process.env['ANNOT_LEVEL_DEF_TYPE'] = "ITEM";
        console.log("\ncreateAnnotationLevels");
        await emudbMan.createAnnotationLevels().then(ar => console.log(ar.toJSON())).catch(ar => console.log(ar.toJSON()));
        process.env['ANNOT_LEVEL_DEF_NAME'] = "Phonetic";
        process.env['ANNOT_LEVEL_DEF_TYPE'] = "SEGMENT";
        console.log("\ncreateAnnotationLevels");
        await emudbMan.createAnnotationLevels().then(ar => console.log(ar.toJSON())).catch(ar => console.log(ar.toJSON()));
        //emudb-create-annotlevellinks
        process.env['ANNOT_LEVEL_LINK_SUPER'] = "Word";
        process.env['ANNOT_LEVEL_LINK_SUB'] = "Phonetic";
        process.env['ANNOT_LEVEL_LINK_DEF_TYPE'] = "ONE_TO_MANY";
        console.log("\ncreateAnnotationLevelLinks");
        await emudbMan.createAnnotationLevelLinks().then(ar => console.log(ar.toJSON())).catch(ar => console.log(ar.toJSON()));
        
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