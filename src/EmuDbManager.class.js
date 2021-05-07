const { exec } = require("child_process");
const ApiResponse = require('./ApiResponse.class.js');

class EmuDbManager {
    constructor() {
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

}

module.exports = EmuDbManager