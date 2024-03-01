import { exec } from "child_process";
import fs from 'fs';
import { nanoid } from "nanoid";
import ApiResponse from './ApiResponse.class.mjs';

export default class EmuDbManager {
    constructor(app) {
        this.app = app;
        this.emuDbPrefix = "VISP";
        this.scriptPath = "/container-agent/scripts";

        if(process.env.CONTAINER_AGENT_TEST == 'true') {
            this.scriptPath = "./src/scripts";
            process.env.UPLOAD_PATH = "./uploads";
        }
    }

    async create() {
        return new Promise((resolve, reject) => {

            /* we actually don't need any sessions data just to create an emu-db...
            //Make sure the speakerAge meta param is always an integer and not a string
            let sessionsJson = Buffer.from(process.env['EMUDB_SESSIONS'], 'base64').toString("utf8");
            let sessions = JSON.parse(sessionsJson);
            for(let key in sessions) {
                if(sessions[key].speakerAge) {
                    sessions[key].speakerAge = parseInt(sessions[key].speakerAge);
                }
            }

            process.env['EMUDB_SESSIONS'] = Buffer.from(JSON.stringify(sessions), 'utf8').toString("base64");
            */

            exec("R -s -f "+this.scriptPath+"/createEmuDb.R", (error, stdout, stderr) => {
                resolve(new ApiResponse(200, { stdout: stdout, stderr: stderr, error: error} ));
            });
        });
    }

    async createSessions() {
        return new Promise((resolve, reject) => {
            exec("R -s -f "+this.scriptPath+"/createSessions.R", (error, stdout, stderr) => {
                if(error != null && error.code != 0) {
                    resolve(new ApiResponse(500, { stdout: stdout, stderr: stderr, error: error }));
                }

                if(process.env.WRITE_META_JSON != "false" && process.env.WRITE_META_JSON !== false) {
                    this.writeMetaDataToSessions();
                }
                
                resolve(new ApiResponse(200, { stdout: stdout, stderr: stderr, error: error }));
            });
        });
    }

    writeMetaDataToSessions() {
        if(!process.env.EMUDB_SESSIONS) {
            return false;
        }
        let sessions = null;
        try {
            sessions = JSON.parse(Buffer.from(process.env.EMUDB_SESSIONS, 'base64').toString('utf8'));
        }
        catch(error) {
            return {
                status: false,
                message: error.toString()
            };
        }
        
        for(let key in sessions) {
            let session = sessions[key];
            let sessionMeta = {
                SessionId: session.sessionId ? session.sessionId : nanoid(),
                Gender: session.speakerGender,
                Age: session.speakerAge
            }
            
            let sessionMachineName = session.name.replace(/ /g, "_");
            sessionMachineName = sessionMachineName.toLowerCase();
            let sessionDirectoryPath = process.env.PROJECT_PATH+"/Data/"+this.emuDbPrefix+"_emuDB/"+sessionMachineName+"_ses";
            
            //It is possible that the session directory doesn not exist at this point if the user created a new session without any audio files (and only metadata), sort of a weird thing to do, but who am I to judge, so just create the session directory
            if(!fs.existsSync(sessionDirectoryPath)) {
                fs.mkdirSync(sessionDirectoryPath);
            }
            
            let filePath = sessionDirectoryPath+"/"+sessionMachineName+".meta_json";
            fs.writeFileSync(filePath, JSON.stringify(sessionMeta));
        }
    }

    async createBundleList() {
        return new Promise((resolve, reject) => {
            exec("R -s -f "+this.scriptPath+"/createBundleList.R", (error, stdout, stderr) => {
                resolve(new ApiResponse(200, { stdout: stdout, stderr: stderr, error: error} ));
            });
        });
    }

    async updateBundleLists() {
        let bundleListsJson = new Buffer.from(process.env.BUNDLE_LISTS, 'base64');
        let bundleLists =JSON.parse(bundleListsJson);
        let projectPath = process.env.PROJECT_PATH;

        let path = projectPath+"/Data/VISP_emuDB/bundleLists";
        //check that the 'bundleLists' directory exists first - which may not always be the case
        await this.mkdir(path);

        return new Promise((resolve, reject) => {
            bundleLists.forEach(user => {
                let bundleList = [];
                user.bundles.forEach(bundle => {
                    bundleList.push({
                        session: bundle.session,
                        name: bundle.name,
                        comment: "",
                        finishedEditing: bundle.finishedEditing
                    });
                });

                fs.writeFileSync(path+"/"+user.username+"_bundleList.json", JSON.stringify(bundleList, null, 2));
            });

            resolve(new ApiResponse(200, { stdout: "", stderr: "", error: "" } ));
        });
    }

    async mkdir(path, recursive = true) {
        return new Promise((resolve, reject) => {
            fs.stat(path, {}, (err) => {
                if(err != null && err.code == "ENOENT") {
                    fs.mkdirSync(path, {
                        recursive: recursive
                    });
                }
                resolve();
            });
        });
    }

    async createAnnotationLevel() {
        return new Promise((resolve, reject) => {
            exec("R -s -f "+this.scriptPath+"/addAnnotationLevelDefinition.R", (error, stdout, stderr) => {
                resolve(new ApiResponse(200, { stdout: stdout, stderr: stderr, error: error} ));
            });
        });
    }

    async removeAnnotationLevel() {
        return new Promise((resolve, reject) => {
            exec("R -s -f "+this.scriptPath+"/removeAnnotationLevelDefinition.R", (error, stdout, stderr) => {
                resolve(new ApiResponse(200, { stdout: stdout, stderr: stderr, error: error} ));
            });
        });
    }

    async createAnnotationLevelLink() {
        return new Promise((resolve, reject) => {
            exec("R -s -f "+this.scriptPath+"/addAnnotationLevelLinkDefinition.R", (error, stdout, stderr) => {
                resolve(new ApiResponse(200, { stdout: stdout, stderr: stderr, error: error} ));
            });
        });
    }

    async removeAnnotationLevelLink() {
        return new Promise((resolve, reject) => {
            exec("R -s -f "+this.scriptPath+"/removeAnnotationLevelLinkDefinition.R", (error, stdout, stderr) => {
                resolve(new ApiResponse(200, { stdout: stdout, stderr: stderr, error: error} ));
            });
        });
    }

    async addDefaultPerspectives() {
        return new Promise((resolve, reject) => {
            exec("R -s -f "+this.scriptPath+"/addDefaultPerspectives.R", (error, stdout, stderr) => {
                //Edit the VISP_DBconfig.json to add perspective => signalCanvases spec
                const PROJECT_PATH = process.env.PROJECT_PATH ? process.env.PROJECT_PATH : "/home/rstudio/project";
                this.getEmuDbConfig(PROJECT_PATH).then(dbConfig => {
                    if(!dbConfig.EMUwebAppConfig.perspectives) {
                        reject(new ApiResponse(500, "dbConfig.EMUwebAppConfig.perspectives was not defined"));
                    }
                    if(dbConfig.EMUwebAppConfig.perspectives) {
                        dbConfig.EMUwebAppConfig.perspectives.forEach(perspective => {

                            if(perspective.name == "Formants") {
                                //check that we don't already have these entries
                                let found = false;
                                perspective.signalCanvases.assign.forEach(assignment => {
                                    if(assignment.signalCanvasName == "SPEC" && assignment.ssffTrackName == "FORMANTS") {
                                        found = true;
                                    }
                                });

                                if(!found) {
                                    perspective.signalCanvases.assign.push({
                                        "signalCanvasName": "SPEC",
                                        "ssffTrackName": "FORMANTS"
                                    });
                                }
                                
                            }
                            if(perspective.name == "Formants+F0") {
                                //check that we don't already have these entries
                                let found = false;
                                perspective.signalCanvases.assign.forEach(assignment => {
                                    if(assignment.signalCanvasName == "SPEC" && assignment.ssffTrackName == "FORMANTS") {
                                        found = true;
                                    }
                                });

                                if(!found) {
                                    perspective.signalCanvases.assign.push({
                                        "signalCanvasName": "SPEC",
                                        "ssffTrackName": "FORMANTS"
                                    });
                                }
                            }
                        });
                    }

                    this.writeEmuDbConfig(dbConfig, PROJECT_PATH).then(() => {
                        resolve(new ApiResponse(200, { stdout: stdout, stderr: stderr, error: error} ));
                    });
                });
            });
        });
    }

    async addTrackDefinitions() {
        return new Promise((resolve, reject) => {
            exec("R -s -f "+this.scriptPath+"/addTrackDefinitions.R", (error, stdout, stderr) => {
                resolve(new ApiResponse(200, { stdout: stdout, stderr: stderr, error: error} ));
            });
        });
    }

    async addSsffTrackDefinitions() {
        return new Promise((resolve, reject) => {
            exec("R -s -f "+this.scriptPath+"/addSsffTrackDefinitions.R", (error, stdout, stderr) => {
                resolve(new ApiResponse(200, { stdout: stdout, stderr: stderr, error: error} ));
            });
        });
    }

    async setSignalCanvasesOrder( ){
        return new Promise((resolve, reject) => {
            exec("R -s -f "+this.scriptPath+"/setSignalCanvasesOrder.R", (error, stdout, stderr) => {
                resolve(new ApiResponse(200, { stdout: stdout, stderr: stderr, error: error} ));
            });
        });
    }

    async setLevelCanvasesOrder( ){
        return new Promise((resolve, reject) => {
            exec("R -s -f "+this.scriptPath+"/setLevelCanvasesOrder.R", (error, stdout, stderr) => {
                resolve(new ApiResponse(200, { stdout: stdout, stderr: stderr, error: error} ));
            });
        });
    }

    async scan() {
        const PROJECT_PATH = process.env.PROJECT_PATH ? process.env.PROJECT_PATH : "/home/rstudio/project";

        return await Promise.all([
            this.getEmuDbConfig(PROJECT_PATH),
            this.getSessions(PROJECT_PATH),
            this.getBundles(PROJECT_PATH),
            this.getBundleLists(PROJECT_PATH)
            //this.getAnnotLevels(PROJECT_PATH)
            ])
            .then((datasets) => {
                let dbConfig = datasets[0];
                let sessions = datasets[1];
                let bundles = datasets[2];
                let bundleLists = datasets[3];

                if(dbConfig.error) {
                    return new ApiResponse(500, dbConfig.error);
                }

                //let annotLevels = datasets[3];
                let output = {
                    dbConfig: dbConfig,
                    sessions: sessions,
                    bundles: bundles,
                    bundleLists: bundleLists
                    //annotLevels: annotLevels
                }
                return new ApiResponse(200, output);
        }).catch((error) => {
            //console.log("emudb-scan threw error:");
            //console.log(error);
            return new ApiResponse(500, error);
        });
    }

    async getEmuDbConfig(projectPath = "./") {
        //Load the *_DBconfig.json
        const dbConfigFilePath = projectPath+"/Data/"+this.emuDbPrefix+"_emuDB/"+this.emuDbPrefix+"_DBconfig.json";
        if(!fs.existsSync(dbConfigFilePath)) {
            return {
                error: "getEmuDbConfig() - Path does not exist! : " + dbConfigFilePath
            }
        }
        let rawJson = fs.readFileSync(dbConfigFilePath, {
            encoding: 'utf-8'
        });
        return JSON.parse(rawJson);
    }

    async getEmuDbConfigAsApiResponse(projectPath = "./") {
        return new Promise(async (resolve, reject) => {
            this.getEmuDbConfig(projectPath).then((dbConfig) => {
                if(dbConfig.error) {
                    reject(new ApiResponse(500, dbConfig.error));
                }
                resolve(new ApiResponse(200, dbConfig));
            });
        });
    }

    async writeEmuDbConfig(dbConfig, projectPath = "./") {
        const dbConfigFilePath = projectPath+"/Data/"+this.emuDbPrefix+"_emuDB/"+this.emuDbPrefix+"_DBconfig.json";
        try {
            fs.writeFileSync(dbConfigFilePath, JSON.stringify(dbConfig));
        }
        catch(error) {
            console.log(error);
            return false;
        }
        return true;
    }

    async getSessions(projectPath = "./") {
        let sessions = [];
        try {
            let emuDbDirList = fs.readdirSync(projectPath + "/Data/VISP_emuDB");
            const regex = RegExp('(.*)_ses');
            for(let key in emuDbDirList) {
                let result = regex.exec(emuDbDirList[key]);
                if(result !== null) {
                    sessions.push({
                        path: result[0],
                        name: result[1]
                    });
                }
            }
        }
        catch(error) {
            return error;
        }
        return sessions;
    }

    async getBundles(projectPath = "./") {
        let sessions = await this.getSessions(projectPath);
        let bundles = [];

        for(let sessKey in sessions) {
            let session = sessions[sessKey];
            try {
                let sessionDirBundleList = fs.readdirSync(projectPath + "/Data/VISP_emuDB/" + session.name + "_ses");
                
                for(let bundleKey in sessionDirBundleList) {
                    const bundleRegex = RegExp('(.*)_bndl', 'g');
                    let result = bundleRegex.exec(sessionDirBundleList[bundleKey]);
                    if(result !== null) {
                        bundles.push({
                            session: session.name,
                            path: result[0],
                            name: result[1]
                        });
                    }
                }
            }
            catch(error) {
                return error;
            }
        }

        return bundles;
    }

    async getBundleLists(projectPath = "./") {
        let bundleListFiles = fs.readdirSync(projectPath + "/Data/VISP_emuDB/bundleLists");
        let bundleLists = [];
        for(let key in bundleListFiles) {
            let bundleList = fs.readFileSync(projectPath + "/Data/VISP_emuDB/bundleLists/" + bundleListFiles[key]);
            let breakPoint = bundleListFiles[key].lastIndexOf("_");
            bundleLists.push({
                username: bundleListFiles[key].substring(0, breakPoint),
                file: bundleListFiles[key],
                bundleList: JSON.parse(bundleList)
            });
        }
        return bundleLists;
    }

    async getSessionsR(projectPath = "./") {
        return new Promise((resolve, reject) => {
            exec("PROJECT_PATH="+projectPath+" R -s -f "+this.scriptPath+"/getSessions.R", (error, stdout, stderr) => {
                stdout = stdout.trim();
                let outputLines = stdout.split("\n");
                let jsonData = outputLines.slice(-1)[0]; //Last row is where we expect the relevant output to be
                let sessions = JSON.parse(jsonData);
                resolve(sessions);
            });
        });
    }

    async getBundlesR(projectPath = "./") {
        return new Promise((resolve, reject) => {
            exec("PROJECT_PATH="+projectPath+" R -s -f "+this.scriptPath+"/getBundles.R", (error, stdout, stderr) => {
                stdout = stdout.trim();
                let outputLines = stdout.split("\n");
                let jsonData = outputLines.slice(-1)[0]; //Last row is where we expect the relevant output to be
                let bundles = JSON.parse(jsonData);

                //Also read in the *_annot.json
                bundles.forEach((bundle) => {
                    let filePath = projectPath+"/Data/"+this.emuDbPrefix+"_emuDB/"+bundle.session+"_ses/"+bundle.name+"_bndl/"+bundle.name+"_annot.json";
                    let jsonRaw = fs.readFileSync(filePath, {
                        encoding: 'utf-8'
                    });
                    let bundleAnnotJson = JSON.parse(jsonRaw);
                    bundle.annot = bundleAnnotJson;
                });

                resolve(bundles);
            });
        });
    }

    //This might be redundant since this information seems to exist in the *_DBconfig.json
    async getAnnotLevels(projectPath = "./") {
        return new Promise((resolve, reject) => {
            exec("PROJECT_PATH="+projectPath+" R -s -f "+this.scriptPath+"/getAnnotLevels.R", (error, stdout, stderr) => {
                stdout = stdout.trim();
                let outputLines = stdout.split("\n");
                let jsonData = outputLines.slice(-1)[0]; //Last row is where we expect the relevant output to be
                let annotLevels = JSON.parse(jsonData);
                resolve(annotLevels);
            });
        });
    }

}
