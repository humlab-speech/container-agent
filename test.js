//console.log(typeof "hello");


let data = [{
    sessionId: 1,
    name: "Session 1",
    speakerGender: "", //unused
    speakerAge: "", //unused
    files: [] //unused
}];

//base64 encode the data
let encodedData = Buffer.from(JSON.stringify(data)).toString('base64');


let sessions = JSON.parse(Buffer.from(encodedData, 'base64').toString('utf8'));

console.log(sessions);

/*
function reduceToJson(data) {
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

    let pureJson = reduceToJson('{"dbConfig":{"name":"VISP","UUI…comment":"","finishedEditing":false}]}]}}\n\x01\x00\x00\x00\x00\x00\x00');

console.log(JSON.parse(pureJson));

*/