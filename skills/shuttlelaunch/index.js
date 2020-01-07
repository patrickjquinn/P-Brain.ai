const request = require('../../api/request');

const intent = () => ({
    keywords: ['space', 'shuttle', 'launch'],
    module: 'shuttlelaunch',
});

async function shuttle_resp() {
    let shuttle_url = 'https://launchlibrary.net/1.2/launch',
        options = {
            url: shuttle_url,
            headers: {
                'User-Agent': 'P-Brain.ai Shuttle Skill',
            },
        };
    let data = await request(options);
    data = JSON.parse(data.body);
    const resp = data.launches[0];
    return {
        text: 'The next launch will be the ' + resp.name + ' on ' + resp.net.split(',')[0] + '.',
    };
}

const examples = () => ['When next launch?', "When's next shuttle launch?"];

module.exports = {
    get: shuttle_resp,
    intent,
    examples,
};
