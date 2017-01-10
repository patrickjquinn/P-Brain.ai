var request = require('sync-request');
var WtoN = require('words-to-num');

var api_opnw = 'http://api.openweathermap.org/data/2.5/weather?q=dublin,ie&units=metric&appid=f08bfa92a064d679ae0fad789a886f66';
var api_opnw_in = 'http://api.openweathermap.org/data/2.5/weather?appid=f08bfa92a064d679ae0fad789a886f66&units=metric&q=';
var api_opnw_on = 'http://api.openweathermap.org/data/2.5/forecast?appid=f08bfa92a064d679ae0fad789a886f66&units=metric&q=';


function get_index_from_day(){
	var d = new Date();
	var n = d.getDay();

	return n;
}

function get_new_day_index(forcasted_day){
	var new_index;
	if (day.toUpperCase().trim() == 'MONDAY'){
		return 1;
	} else if (day.toUpperCase().trim() == 'TUESDAY'){
		return 2
	} else if (day.toUpperCase().trim() == 'WEDNESDAY'){
		return 3;
	} else if (day.toUpperCase().trim() == 'THURSDAY'){ 
		return 4
	} else if (day.toUpperCase().trim() == 'FRIDAY'){ 
		return 5;
	} else if (day.toUpperCase().trim() == 'SATURDAY'){
		return 6;
	} else {
		return 7;
	}
}

function * weather_resp(query){

	var res;
	var country;

	var forcast = false;
	var index;

	if (query.indexOf(' in ') != -1){
		country = query.split(' in ')[1];

		if (country && country != ''){
			res = request('GET', api_opnw_in + country, {
			  'headers': {
			    'Content-type': 'application/json'
			  }
			});
		} else {
			res = request('GET', api_opnw, {
			  'headers': {
			    'Content-type': 'application/json'
			  }
			});
		}
	} else if (query.indexOf(' for ') != -1 || query.indexOf(' on ') != -1) {
		country = query.split(' on ')[1];

		forcast = true;

		if (!country){
			country = query.split(' for ')[1];
		}

		if (country.indexOf(' tomorrow') != -1){
			index = get_index_from_day() + 1;
		} else {
			index = get_index_from_day(country);
		}


		res = request('GET', api_opnw_on + "dublin,ie", {
			'headers': {
				'Content-type': 'application/json'
			}
		});

		forcast = true;
	} else if (query.indexOf(' tomorrow') != -1){
			index = get_index_from_day() + 1
			forcast = true;
			res = request('GET', api_opnw_on + "dublin,ie", {
			'headers': {
				'Content-type': 'application/json'
			}
		});
	} else {
		res = request('GET', api_opnw, {
		  'headers': {
		    'Content-type': 'application/json'
		  }
		});
	}

	res = JSON.parse(res.getBody());

	var weather_cond;
	var temp;
	var condition;
	var message;

	if (forcast){
		weather_cond = res.list[index];
		temp = Math.floor(res.list[index].main.temp).toString() + '°';
		 condition = weather_cond.weather[0].main;
	} else {
		weather_cond = res.weather[0];
		temp = Math.floor(res.main.temp).toString() + '°';
		condition = weather_cond.main;
	}

	if (condition == 'Clear'){
		message = 'It is currently <temp> and <condition>';
	} else {
		message = 'It is currently <temp> with <condition>';
	}

	if (forcast) {
		message = message.replace('It is currently', 'It will be');
	}

	var weather = message.replace('<temp>', temp);
	weather = weather.replace('<condition>', condition);

	if (country && country != '' && !forcast){
		weather = weather + ' in ' + country;
	} else if (country && country != '' && forcast){
		if (country.trim() != 'tomorrow'){
			weather = weather + ' on ' + country;
		}
	}

	if (query.indexOf('tomorrow') != -1 && weather.indexOf('tomorrow') == -1){
		weather = weather+" tomorrow";
	} 

	if (query.indexOf('temperature') != -1 && weather.indexOf('and') != -1){
		var con_string = ' and '+condition;
		weather = weather.replace(con_string, '');
	} else if (query.indexOf('temperature') != -1){
		var con_string = ' with '+condition;
		weather = weather.replace(con_string, '');
	}

	return weather;
}


module.exports = {
	get: weather_resp
}