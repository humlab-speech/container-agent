export default class ApiResponse {
    constructor(code = 200, body = "") {
        this.code = code;
        this.body = body;
    }

    toJSON() {
        //let body = this.reduceToJson(this.body);
        return JSON.stringify({
            code: this.code,
            body: this.body
        });
    }

    reduceToJson(data) {
        if(typeof data != "string") {
            return "non-string data";
        }
        let startOfJson = data.indexOf("{");
        let endOfJson = data.lastIndexOf("}");

        if(startOfJson == -1 || endOfJson == -1) {
            console.error("Could not reduce to JSON: "+data);
        }
        else {
            data = data.substring(startOfJson); //Strip leading garbage
            data = data.substring(0, endOfJson+1); //Strip trailing garbage
        }
        return data;
    }
}