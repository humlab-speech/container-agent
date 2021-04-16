const ApiResponse = require('./ApiResponse.class.js');
const simpleGit = require('simple-git')
require('process');

const version = '1.0.0';

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
class GitRepository {
    constructor(repoPath, gitUserName, gitUserEmail) {
        this.git = new simpleGit();
        this.repoPath = repoPath;
        this.gitUserName = gitUserName;
        this.gitUserEmail = gitUserEmail;
    }

    configGit() {
        return this.git.cwd(this.repoPath)
            .addConfig('user.name', this.gitUserName)
            .addConfig('user.email', this.gitUserEmail);
    }

    async clone() {
        if(!process.env.GIT_REPOSITORY_URL) {
            return new ApiResponse(500, 'Envvar GIT_REPOSITORY_URL is not set');
        }

        return this.git.clone(process.env.GIT_REPOSITORY_URL, this.repoPath)
        .then(t => {
            return new ApiResponse(200, 'ok');
        })
        .catch(error => {
            let errorMsg = error.toString();

            if(errorMsg.indexOf('already exists and is not an empty directory') != -1) {
                return new ApiResponse(400, 'Local repository exists');
            }

            if(errorMsg.indexOf('Authentication failed') != -1) {
                return new ApiResponse(400, 'GitLab authentication failed');
            }

            return new ApiResponse(500, 'Unknown error');
        });
    }

    async pull() {
        return this.configGit().pull().then(result => {
            if(result.summary.changes == 0 && result.summary.deletions == 0 && result.summary.insertions == 0) {
                return new ApiResponse(200, 'No changes to pull');
            }
            return new ApiResponse(200, 'Pulled changes');
        }).catch(error => {
            let errorMsg = error.toString();
            if(errorMsg.indexOf('local changes to the following files would be overwritten') != -1) {
                return new ApiResponse(500, 'Conflicting changes');
            }
        });
    }

    async status() {
        return this.git.status({ baseDir: this.repoPath }).then(t => {
            return new ApiResponse(200, t);
        }).catch(error => this.handleUnknownError(error));
    }

    async add(paths = ['.']) {
        return this.configGit().add(paths).then(result => {
            return new ApiResponse(200, 'ok');
        }).catch(error => this.handleUnknownError(error));
    }
    
    async commit(msg = 'system-auto-commit') {
        return this.configGit().commit(msg).then(result => {
            if(result.summary.changes == 0 && result.summary.insertions == 0 && result.summary.deletions == 0) {
                return new ApiResponse(400, 'No changes to save.');
            }
            return new ApiResponse(200, 'ok');
        }).catch(error => {
            let errorMsg = error.toString();
            if(errorMsg.indexOf('nothing to commit') != -1) {
                return new ApiResponse(400, 'No changes to save.');
            }
            else {
                this.handleUnknownError(error);
            }
        });
    }
    
    async push(branch = 'master') {
        if(typeof process.env.GIT_BRANCH != 'undefined' && branch == 'master') {
            branch = process.env.GIT_BRANCH;
        }

        return this.configGit().push('origin', branch).then(result => {
            return new ApiResponse(200, 'Saved!');
        }).catch(async error => {
            let errorMsg = error.toString();

            if(errorMsg.indexOf('failed to push some refs to') != -1) {
                //Based on this error message we assume the problem to be a conflicting change has been made, we 'solve' this by create another branch

                await this.resetToHead();
                let branch = await this.checkoutBranch();
                await this.add();
                await this.commit();
                await this.push(branch.body);

                return new ApiResponse(200, 'Your project was saved to a separate branch since it conflicted with other changes. You will need to merge these branches manually in GitLab.');
            }
        });
    }

    generateSystemBranchName() {
        let branchName = new Date().toISOString();
        branchName = branchName.replace(/:/g, '');
        branchName = branchName.substr(0, 17)
        branchName = 'system-branch-' + branchName;
        return branchName;
    }

    async checkoutBranch() {
        let branch = this.generateSystemBranchName();
        return this.configGit().checkoutLocalBranch(branch).then(result => {
            return new ApiResponse(200, branch);
        }).catch(error => this.handleUnknownError(error));
    }
    
    async resetToHead() {
        return this.configGit().reset('soft', ['HEAD^']).then(result => {
            return new ApiResponse(200, 'ok');
        }).catch(error => this.handleUnknownError(error));
    }

    handleUnknownError(error) {
        let errorMsg = error.toString();
        console.error('command ' + error.task.commands[0] + ' failed with message: ' + errorMsg);
        return new ApiResponse(500, 'Unknown error');
    }
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

    const repo = new GitRepository(repoPath, gitUserName, gitUserEmail);
    
    switch(cmd) {
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
        case 'save': //Save is just a shorthand for add+commit+push
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
            break;
    }

}
