const wolfram = require('wolfram-alpha');

let client = null;

async function setup() {
    if ((await global.db.getSkillValue('fact', 'wolframalpha')) == null) {
        console.log('Setting default API key for Wolfram Alpha');
        await global.db.setSkillValue('fact', 'wolframalpha', 'U7L4VR-K3WJPLK6Y2');
    }
    client = wolfram.createClient(await global.db.getSkillValue('fact', 'wolframalpha'));
}

async function wlfra_resp(query) {
    try {
        const result = await client.query(query);
        for (let i = 0; i < result.length; i++) {
            if (result[i].primary) {
                return result[i].subpods[0].text;
            }
        }
        return "I'm sorry, I didn't understand that.";
    } catch (err) {
        console.log(err);
        return "I'm sorry, I didn't understand that.";
    }
}

module.exports = {
    get: wlfra_resp,
    setup,
};
