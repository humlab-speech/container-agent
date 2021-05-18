const { exec } = require("child_process");
const fs = require('fs');
const ApiResponse = require('./ApiResponse.class.js');

class EmuDbManager {
    constructor() {
        this.emuDbPrefix = "VISP"; //future
        this.emuDbPrefix = "humlabspeech"; //current
    }

    async create() {
        return new Promise((resolve, reject) => {
            exec("/usr/local/bin/R -f /scripts/createEmuDb.r", (error, stdout, stderr) => {
                resolve(new ApiResponse(200, { stdout: stdout, stderr: stderr, error: error} ));
            });
        });
    }

    async importWavs() {
        return new Promise((resolve, reject) => {
            exec("/usr/local/bin/R -f /scripts/importWavFiles.r", (error, stdout, stderr) => {
                resolve(new ApiResponse(200, { stdout: stdout, stderr: stderr, error: error} ));
            });
        });
    }

    async createBundleList() {
        return new Promise((resolve, reject) => {
            exec("/usr/local/bin/R -f /scripts/createBundleList.r", (error, stdout, stderr) => {
                resolve(new ApiResponse(200, { stdout: stdout, stderr: stderr, error: error} ));
            });
        });
    }

    async createAnnotationLevels() {
        return new Promise((resolve, reject) => {
            exec("/usr/local/bin/R -f /scripts/addAnnotationLevelDefinition.r", (error, stdout, stderr) => {
                resolve(new ApiResponse(200, { stdout: stdout, stderr: stderr, error: error} ));
            });
        });
    }

    async createAnnotationLevelLinks() {
        return new Promise((resolve, reject) => {
            exec("/usr/local/bin/R -f /scripts/addAnnotationLevelLinkDefinition.r", (error, stdout, stderr) => {
                resolve(new ApiResponse(200, { stdout: stdout, stderr: stderr, error: error} ));
            });
        });
    }

    async scan() {
        //const PROJECT_PATH = './test-1n'; // /home/rstudio/project/Data/humlabspeech_emuDB
        const PROJECT_PATH = process.env.PROJECT_PATH ? process.env.PROJECT_PATH : "/home/rstudio/project";

        return await Promise.all([
            this.getEmuDbConfig(PROJECT_PATH),
            this.getSessions(PROJECT_PATH),
            this.getBundles(PROJECT_PATH),
            this.getAnnotLevels(PROJECT_PATH)
            ])
            .then((datasets) => {
                let dbConfig = datasets[0];
                let sessions = datasets[1];
                let bundles = datasets[2];
                //let annotLevels = datasets[3];
                let output = {
                    dbConfig: dbConfig,
                    sessions: sessions,
                    bundles: bundles,
                    //annotLevels: annotLevels
                }
                return new ApiResponse(200, output);
        });
    }

    async getEmuDbConfig(projectPath = "./") {
        //Load the *_DBconfig.json
        let rawJson = fs.readFileSync(projectPath+"/Data/"+this.emuDbPrefix+"_emuDB/"+this.emuDbPrefix+"_DBconfig.json");
        return JSON.parse(rawJson);
    }

    async getSessions(projectPath = "./") {
        return new Promise((resolve, reject) => {
            exec("PROJECT_PATH="+projectPath+" R -s -f ./scripts/getSessions.R", (error, stdout, stderr) => {
                stdout = stdout.trim();
                let outputLines = stdout.split("\n");
                let jsonData = outputLines.slice(-1)[0]; //Last row is where we expect the relevant output to be
                let sessions = JSON.parse(jsonData);
                resolve(sessions);
            });
        });
    }

    async getBundles(projectPath = "./") {
        return new Promise((resolve, reject) => {
            exec("PROJECT_PATH="+projectPath+" R -s -f ./scripts/getBundles.R", (error, stdout, stderr) => {
                stdout = stdout.trim();
                let outputLines = stdout.split("\n");
                let jsonData = outputLines.slice(-1)[0]; //Last row is where we expect the relevant output to be
                let bundles = JSON.parse(jsonData);

                //Also read in the *_annot.json
                bundles.forEach((bundle) => {
                    let filePath = projectPath+"/Data/"+this.emuDbPrefix+"_emuDB/"+bundle.session+"_ses/"+bundle.name+"_bndl/"+bundle.name+"_annot.json";
                    let jsonRaw = fs.readFileSync(filePath);
                    let bundleAnnotJson = JSON.parse(jsonRaw);
                    bundle.annot = bundleAnnotJson;
                });

                resolve(bundles);
            });
        });
    }

    //This should probably be implemented at some point, but don't need it right now...
    async getBundleLists(projectPath = "./") {
        return [];
    }

    //This might be redundant since this information seems to exist in the *_DBconfig.json
    async getAnnotLevels(projectPath = "./") {
        return new Promise((resolve, reject) => {
            exec("PROJECT_PATH="+projectPath+" R -s -f ./scripts/getAnnotLevels.R", (error, stdout, stderr) => {
                stdout = stdout.trim();
                let outputLines = stdout.split("\n");
                let jsonData = outputLines.slice(-1)[0]; //Last row is where we expect the relevant output to be
                let annotLevels = JSON.parse(jsonData);
                resolve(annotLevels);
            });
        });
    }

    /*
    async getSessionsOld() {
        try {
            let emuDbDirList = fs.readdirSync(emuDbPath);
            const regex = RegExp('(.*)_ses', 'g');
            let sessions = [];
            for(let key in emuDbDirList) {
                let result = regex.exec(emuDbDirList[key]);
                if(result !== null) {
                    sessions.push({
                        path: result[0],
                        name: result[1]
                    });
                }
            }
            return sessions;
        }
        catch(error) {
            console.log(error)
        }
    }
    */

}

module.exports = EmuDbManager