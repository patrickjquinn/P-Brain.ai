var request = require('co-request');
var config = require('../../config');
var keys = config.get;

var api_opnw = 'http://api.openweathermap.org/data/2.5/weather?q=<query>&units=metric&appid=' + keys.openweathermap.key;
var api_opnw_in = 'http://api.openweathermap.org/data/2.5/weather?appid=' + keys.openweathermap.key + '&units=metric&q=';
var api_opnw_on = 'http://api.openweathermap.org/data/2.5/forecast?appid=' + keys.openweathermap.key + '&units=metric&q=';

function* _intent() {
    return {
        keywords: ['what is the weather', 'whats it like in qqqq', 'temperature'],
        module: 'weather'
    };
}

function get_index_from_day() {
    var d = new Date();
    var n = d.getDay();

    return n;
}

function* get_country() {
    var country_res = yield request('http://ipinfo.io');

    country_res = JSON.parse(country_res.body);

    var loc_string = country_res.city + "," + country_res.country;

    return loc_string.toLowerCase();
}

function get_new_day_index(forcasted_day) {
    var new_index;
    if (forcasted_day.toUpperCase().trim() == 'MONDAY') {
        return 1;
    } else if (forcasted_day.toUpperCase().trim() == 'TUESDAY') {
        return 2;
    } else if (forcasted_day.toUpperCase().trim() == 'WEDNESDAY') {
        return 3;
    } else if (forcasted_day.toUpperCase().trim() == 'THURSDAY') {
        return 4;
    } else if (forcasted_day.toUpperCase().trim() == 'FRIDAY') {
        return 5;
    } else if (forcasted_day.toUpperCase().trim() == 'SATURDAY') {
        return 6;
    } else {
        return 7;
    }
}

function* weather_resp(query) {

    var res;
    var country;
    var index;

    var forcast = false;
    var current_loc = yield get_country();

    if (!current_loc || current_loc == '') {
        current_loc = 'dublin';
    }


    if (query.indexOf(' in ') != -1) {
        country = query.split(' in ')[1];

        if (country && country != '') {
            res = yield request(api_opnw_in + country, {
                'headers': {
                    'Content-type': 'application/json'
                }
            });
        } else {
            res = yield request(api_opnw.replace('<query>', current_loc), {
                'headers': {
                    'Content-type': 'application/json'
                }
            });
        }
    } else if (query.indexOf(' for ') != -1 || query.indexOf(' on ') != -1) {
        country = query.split(' on ')[1];

        forcast = true;

        if (!country) {
            country = query.split(' for ')[1];
        }

        if (country.indexOf(' tomorrow') != -1) {
            index = get_index_from_day() + 1;
        } else {
            index = get_index_from_day(country);
        }


        res = yield request(api_opnw_on + current_loc, {
            'headers': {
                'Content-type': 'application/json'
            }
        });

        forcast = true;
    } else if (query.indexOf(' tomorrow') != -1) {
        index = get_index_from_day() + 1;
        forcast = true;
        res = yield request(api_opnw_on + current_loc, {
            'headers': {
                'Content-type': 'application/json'
            }
        });
    } else {
        res = yield request(api_opnw.replace('<query>', current_loc), {
            'headers': {
                'Content-type': 'application/json'
            }
        });
    }

    res = JSON.parse(res.body);

    var weather_cond;
    var temp;
    var condition;
    var message;

    if (forcast) {
        weather_cond = res.list[index];
        temp = Math.floor(res.list[index].main.temp).toString() + '°';
        condition = weather_cond.weather[0].main;
    } else {
        weather_cond = res.weather[0];
        temp = Math.floor(res.main.temp).toString() + '°';
        condition = weather_cond.main;
    }

    if (condition == 'Clear') {
        message = 'It is currently <temp> and <condition>';
    } else {
        message = 'It is currently <temp> with <condition>';
    }

    if (forcast) {
        message = message.replace('It is currently', 'It will be');
    }

    var weather = message.replace('<temp>', temp);
    weather = weather.replace('<condition>', condition);

    if (country && country != '' && !forcast) {
        weather = weather + ' in ' + country;
    } else if (country && country != '' && forcast) {
        if (country.trim() != 'tomorrow') {
            weather = weather + ' on ' + country;
        }
    }

    if (query.indexOf('tomorrow') != -1 && weather.indexOf('tomorrow') == -1) {
        weather = weather + " tomorrow";
    }

    if (query.indexOf('temperature') != -1 && weather.indexOf('and') != -1) {
        var con_string = ' and ' + condition;
        weather = weather.replace(con_string, '');
    } else if (query.indexOf('temperature') != -1) {
        var con_string = ' with ' + condition;
        weather = weather.replace(con_string, '');
    }

    return weather;
}


module.exports = {
    get: weather_resp,
    intent: _intent
};