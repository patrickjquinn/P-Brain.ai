const fs = require('fs');

const DETAILS_FILE = 'config/personal_details.json';

const intent = () => ({
    keywords: ["you can call me qqqq", "i'm called qqqq"],
    module: 'personal_details'
});

let details = {}

function * name_resp(query) {
    let words = query.toLowerCase().split(' ')

    let nameIndex = words.length - 1
    if (words.indexOf("me") >= 0) {
        nameIndex = words.indexOf("me") + 1;
    } else if (words.indexOf("called") >= 0) {
        nameIndex = words.indexOf("called") + 1;
    }
    const names = words.splice(nameIndex, words.length - nameIndex)
    if (names.length == 0) {
        return {text: "I'm sorry, I couldn't understand your name."}
    }

    let name = ""
    // Make the first letters uppercase and make it into one string.
    for (let i = 0; i < names.length; i++) {
        name += ` ${names[i].charAt(0).toUpperCase() + names[i].slice(1)}`
    }
    details.name = name.trim()
    fs.writeFile(DETAILS_FILE, JSON.stringify(details, null, 2), function (err) {
        if (err) {
            return console.log(err)
        }
    })

    return {text:`Okay I'll call you ${details.name}.`,name:details.name};
}

function * register(app, io) {
    try {
        details = JSON.parse(fs.readFileSync(DETAILS_FILE));
        console.log("Loaded personal details from config.");
    } catch (err) {
        // Ignore and use the default name.
    }
    app.get('/', function(req, res) {
        res.json(details)
    });
}

const examples = () => (
    ['You can call me Patrick', "I'm called Marco.", "Im called Polo."]
)

module.exports = {
    get: name_resp,
    register: register,
    intent: intent,
    examples
};
