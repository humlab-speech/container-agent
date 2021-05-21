class ApiResponse {
    constructor(code = 200, body = "") {
        this.code = code;
        this.body = body;
    }

    toJSON() {
        return JSON.stringify({
            code: this.code,
            body: this.body
        });
    }
}

module.exports = ApiResponse