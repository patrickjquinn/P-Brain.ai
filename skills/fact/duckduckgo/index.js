'use strict';

var request = require('co-request');

function* ddg_resp(query) {
    var ddg_url = 'http://api.duckduckgo.com/?q=<query>&format=json&pretty=1';

    var data = yield request(ddg_url.replace('<query>', query));

    try {
        data = JSON.parse(data.body);
    } catch (e) {
        if (e) {
            console.log('error parsing duckduckgo body ' + e);
        }
        return null;
    }

    var resp = data.AbstractText;

    if (resp.split('.')[1] && resp.split('.')[1] !== "") {
        return resp.split('.')[0];
    } else {
        return resp;
    }
}

module.exports = {
    get: ddg_resp
}