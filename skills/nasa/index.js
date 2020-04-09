const request = require('../../api/request');

async function setup() {
    if ((await global.db.getSkillValue('nasa', 'apikey')) == null) {
        console.log('Setting default API key for Nasa');
        await global.db.setSkillValue(
            'nasa',
            'apikey',
            //put your nasa api key here:
            '',
        );
    }
}

const intent = () => ({
    keywords: ['show the picture of the day', "what's today picture", 'show me the picture'],
    module: 'nasa',
});

async function nasa_resp() {
    
    const key = await global.db.getSkillValue('nasa', 'apikey');
    
    const nasa_url = 'https://api.nasa.gov/planetary/apod?api_key='+key;

    let data = await request(nasa_url);

    data = JSON.parse(data.body);
  
    let title = data.title + ' by ' + data.copyright;
    let image = data.url;

    return { text: title, image: data.url};
}

const examples = () => ['Show me the picture of the day', 'What is todays picture', 'Show the picture'];

module.exports = {
    get: nasa_resp,
    intent,
    examples,
    setup
};
