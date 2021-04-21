require('process');
const copy = require('recursive-copy');
const ApiResponse = require('./ApiResponse.class.js');
const GitRepository = require('./GitRepository.class.js');

const version = '1.1.0';

process.env.GIT_SSL_NO_VERIFY=true; //This is only needed for local testing

/**
 * This agent is aware of the following env-vars:
 *
 * GIT_USER_NAME
 * GIT_USER_EMAIL
 * GIT_BRANCH
 * GIT_REPOSITORY_URL
 * PROJECT_PATH
 * 
**/

async function copyDocs() {
    return copy('/home/uploads/docs', '/home/project-setup/Documents')
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

    if(cmd == 'version') {
        console.log(version);
        return;
    }

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

    
    
    switch(cmd) {
        case "copy-docs":
            copyDocs().then(ar => console.log(ar.toJSON()));
            break;
        case 'clone':
            repo.clone().then(ar => console.log(ar.toJSON()));
            break;
        case "pull":
            repo.pull().then(ar => console.log(ar.toJSON()));
            break;
        case 'add':
            repo.add().then(ar => console.log(ar.toJSON()));
            break;
        case 'commit':
            repo.commit().then(ar => console.log(ar.toJSON()));
            break;
        case 'reset':
            repo.resetToHead().then(ar => console.log(ar.toJSON()));
            break;
        case 'push':
            repo.push().then(ar => console.log(ar.toJSON()));
            break;
        case 'status':
            repo.status().then(ar => console.log(ar.toJSON()));
            break;
        case 'checkout':
            repo.checkoutBranch().then(ar => console.log(ar.toJSON()));
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
