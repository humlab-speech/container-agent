require('process');
const copy = require('recursive-copy');
const ApiResponse = require('./ApiResponse.class.js');
const GitRepository = require('./GitRepository.class.js');
const EmuDbManager = require('./EmuDbManager.class.js');
const dotenv = require('dotenv');

if(typeof process.env.CONTAINER_AGENT_TEST == "undefined") {
    process.env.CONTAINER_AGENT_TEST = 'false';
}

if(process.env.CONTAINER_AGENT_TEST === 'true') {
    dotenv.config();
}

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


function copyDocs() {
    return copy('/home/uploads/docs', '/home/project-setup/Documents')
    .then(function(results) {
        return new ApiResponse(200, 'Copied ' + results.length + ' files');
    })
    .catch(function(error) {
        return new ApiResponse(400, 'Copy failed' + error);
    });
}

async function fullRecursiveCopy(src, dest) {
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

async function copyProjectTemplateDirectory() {
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

if(typeof process.argv[2] == 'undefined') {
    return console.log('No command supplied');
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
            return false;
        }
        repo = new GitRepository(repoPath, gitUserName, gitUserEmail);
    }

    let emudbMan = null;
    if(cmd.split("-")[0] == "emudb") {
        emudbMan = new EmuDbManager(this);
    }
    
    switch(cmd) {
        case "copy-docs":
            copyDocs().then(ar => console.log(ar.toJSON())).catch(ar => console.log(ar.toJSON()));
            break;
        case "copy-project-template-directory":
            copyProjectTemplateDirectory().then(ar => console.log(ar.toJSON())).catch(ar => console.log(ar.toJSON()));
            break;
        case "full-recursive-copy":
            fullRecursiveCopy(args[0], args[1]).then(ar => console.log(ar.toJSON())).catch(ar => console.log(ar));
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
        case "emudb-create-annotlevels":
            emudbMan.createAnnotationLevels().then(ar => console.log(ar.toJSON())).catch(ar => console.log(ar.toJSON()));
            break;
        case "emudb-create-annotlevellinks":
            emudbMan.createAnnotationLevelLinks().then(ar => console.log(ar.toJSON())).catch(ar => console.log(ar.toJSON()));
            break;
        case "emudb-add-default-perspectives":
            emudbMan.addDefaultPerspectives().then(ar => console.log(ar.toJSON())).catch(ar => console.log(ar.toJSON()));
            break;
        case "emudb-ssff-track-definitions":
            emudbMan.addSsffTrackDefinitions().then(ar => console.log(ar.toJSON())).catch(ar => console.log(ar.toJSON()));
            break;
        case "emudb-setlevelcanvasesorder":
            emudbMan.setLevelCanvasesOrder().then(ar => console.log(ar.toJSON())).catch(ar => console.log(ar.toJSON()));
            break;
        case "emudb-scan":
            emudbMan.scan().then(ar => console.log(ar.toJSON())).catch(ar => console.log(ar));
            break;
        case 'clone':
            repo.clone().then(ar => console.log(ar.toJSON())).catch(ar => console.log(ar.toJSON()));
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
                        repo.push().then(ar => console.log(ar.toJSON()));
                    });
                });
            });
            break;
    }

}
