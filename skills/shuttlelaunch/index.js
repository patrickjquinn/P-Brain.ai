'use strict';

var request = require('co-request');

function* _intent() {
    return {
        keywords: ['space', 'shuttle', 'launch'],
        module: 'shuttlelaunch'
    };
}

function* shuttle_resp(query) {
    var shuttle_url = 'https://launchlibrary.net/1.2/launch',
        options = {
            url: shuttle_url,
            headers: {
                'User-Agent': 'P-Brain.ai Shuttle Skill'
            }
        };
    var data = yield request(options);
    data = JSON.parse(data.body);
    var resp = data.launches[0];
    var resp_string = 'The next launch will be the ' + resp.name + ' on ' + resp.net.split(',')[0] + '.';
    return resp_string;
}

module.exports = {
    get: shuttle_resp,
    intent: _intent
};