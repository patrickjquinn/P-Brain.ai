var request = require('co-request');
var parser = require('xml2json');
var config = require('../../config/');
var google = require('./google/');

var not_found_responses = ["Hmmm I dont seem to know ", "Sorry I couldn't understand ", "My memory banks dont contain "];

var keys = config.get;

String.prototype.replaceAll = function(str1, str2, ignore) {
    return this.replace(new RegExp(str1.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g, "\\$&"), (ignore ? "gi" : "g")), (typeof(str2) == "string") ? str2.replace(/\$/g, "$$$$") : str2);
};

function* _intent() {
    return {
        keywords: ['who is qqqq', 'where is qqqq', 'when did qqqq', 'what is qqqq', '√ ', '-', '+', '%'],
        module: 'fact'
    };
}

function* get_wlfra_result(query) {
    var url = 'http://api.wolframalpha.com/v2/query?input=<query>&appid=' + keys.wolframalpha.key;

    var data = yield request(url.replace('<query>', query));

    try {
        data = JSON.parse(parser.toJson(data.body));
    } catch (e) {
        if (e) {
            console.log('error parsing wolframalpha body ' + e);
        }
        return null;
    }

    var pods = data.queryresult.pod;

    var result = "";

    try {
        if (pods && pods.length && pods.length > 0) {
            for (var i = 0; i < pods.length; i++) {
                var index = pods[i];

                if (index.primary === 'true') {
                    result = index.subpod.plaintext;
                    break;
                }

                if (index.id == "Result") {
                    result = index.subpod.plaintext;
                    break;
                }
            }

            if (result === "") {
                for (var i = 0; i < pods.length; i++) {
                    var index = pods[i];

                    if (index.title == "Basic information") {
                        result = index.subpod.plaintext;
                        break;
                    }
                }
            }
        } else {
            return null;
        }

        if (result.indexOf('|') != -1) {
            result = result.replaceAll(' |', ', ');
        }

        return result;
    } catch (e) {
        console.log(e);
        return null;
    }
}

function* get_ddg_result(query) {
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

function* fact_resp(query) {

    var fact = yield google.get(query);

    if (!fact || fact === "") {
        fact = yield get_ddg_result(query);
    }

    if (!fact || fact === "") {
        fact = yield get_wlfra_result(query);
    }

    if (!fact || fact === ""){
    	fact = not_found_responses[Math.floor(Math.random()*not_found_responses.length)] + query;
    }

    return fact;
}

module.exports = {
    get: fact_resp,
    intent: _intent
};