const fs = require('fs');

const intent = () => ({
    keywords: ["your new name is qqqq", "i'm going to call you", "set name",
        "what is your name", "what's your name"],
    module: 'name'
});

let name = 'Brain';

function * name_resp(query) {
    if (query.includes("what")) {
        return `My name is ${name}.`;
    } else {
        const words = query.split(' ');
        name = words[words.length - 1];
        name = name.charAt(0).toUpperCase() + name.slice(1);

        fs.writeFile('name.json', JSON.stringify({name: name}, null, 2), function (err) {
            if (err) {
                return console.log(err);
            }
        });

        return `You can now call me ${name}.`;
    }
}

function register(app) {
    try {
        const nameJson = JSON.parse(fs.readFileSync('name.json'));
        name = nameJson.name;
        console.log(`Name loaded from file: ${name}`);
    } catch (err) {
        console.log(`Could not load names file, using name: ${name}`);
    }
    app.get('/', function(req, res) {
        res.json({name: name});
    });
}

module.exports = {
    get: name_resp,
    register: register,
    intent: intent
};
