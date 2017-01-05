var request = require('sync-request');
var api_opnw = 'http://api.openweathermap.org/data/2.5/weather?q=dublin,ie&units=metric&appid=f08bfa92a064d679ae0fad789a886f66';
var api_opnw_in = 'http://api.openweathermap.org/data/2.5/weather?appid=f08bfa92a064d679ae0fad789a886f66&units=metric&q=';
var yt = require('../youtube');
var parser = require('xml2json');
var intents = require('../intents');
var magnetLink = require('magnet-link');
var genify = require('thunkify-wrap').genify;




var news = ['the-verge', 'bbc-news', 'bloomberg','bbc-sport','new-scientist',]


function *handle_response(request) {

	console.log(request);

	var funct = eval(intents.paths[request.responseType]);

	var response = yield funct(request.originalQuery);

	return response;
}



function * time_resp(query){
	var time = new Date().toLocaleTimeString('en-GB', { hour: "numeric", 
                                             minute: "numeric"});

	return "It is " + time;
}

function * day_resp(query){
	
}

function * location_resp(query){
	return "You are currently at 423, Wyckham Point, Dundrum."
}

function * id_resp(query){
	return 'You are P, AKA Bed Goblin, AKA Norbert, AKA Patrick.'
}

function * news_resp(query){

	var source = 'bbc-news';

	if (query.indexOf('tech') != -1){
		source = 'the-verge';
	} else if (query.indexOf('sport') != -1 ){
		source = 'bbc-sport';
	} else if (query.indexOf('science') != -1){
		source = 'new-scientist';
	} else if (query.indexOf('business') != -1){
		source = 'bloomberg';
	}


	var news_url = 'https://newsapi.org/v1/articles?sortBy=latest&apiKey=f4504df34ba9432f80ff040a41736518&source='+source;

	if (source == 'bbc-news' || source == 'bbc-sport' || source == 'new-scientist' || source == 'bloomberg') {
		news_url = news_url.replace('latest', 'top');
	}

	var data = request('GET',news_url);

	data = JSON.parse(data.getBody());

	var resp = data.articles;

	var item = resp[Math.floor(Math.random()*resp.length)];

	if (item.title.toUpperCase() != item.description.toUpperCase()){
		return item.title + '. ' + item.description;
	} else {
		return item.title + '.';
	}

	
}

function * lang_resp(query){
	
}



function *coin_resp(){
	var state = (Math.floor(Math.random() * 2) == 0) ? 'heads' : 'tails';

	return "It's " + state;
}

function * song_resp(query){

	query = query.replace('play', '');

	var track = query.split('by')[0].trim();
	var artist = query.split('by')[1];

	if (!artist || artist == ''){
		artist = '';
	} else {
		artist = artist.trim();
	}

	var url = yt.get(track, artist);

	return url;
}

function * skip_resp(query){
	
}

function * prev_resp(query){
	
}

function * play_resp(query){
	
}

function * fact_resp(query){
	var fact = get_ddg_result(query);

	if (!fact || fact == ""){
		fact = get_wlfra_result(query);
	}
	
	return fact;
}

function * weather_resp(query){

	var res;
	var country;

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
	} else {
		res = request('GET', api_opnw, {
		  'headers': {
		    'Content-type': 'application/json'
		  }
		});
	}

	res = JSON.parse(res.getBody());

	var condition = res.weather[0].main;

	var temp = Math.floor(res.main.temp).toString() + '°';


	var message;



	if (condition == 'Clear'){
		message = 'It is currently <temp> and <condition>';
	} else {
		message = 'It is currently <temp> with <condition>';
	}

	var weather = message.replace('<temp>', temp);
	weather = weather.replace('<condition>', condition);

	if (country && country != ''){
		weather = weather + ' in ' + country;
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

function *get_ddg_result(query) {
	var ddg_url = 'http://api.duckduckgo.com/?q=<query>&format=json&pretty=1';

	var data = request('GET',ddg_url.replace('<query>', query));

	data = JSON.parse(data.getBody());

	var resp = data.AbstractText;

	if (resp.split('.')[1] && resp.split('.')[1] != ""){
		return resp.split('.')[0];
	} else {
		return resp;
	}
}

String.prototype.replaceAll = function(str1, str2, ignore) 
{
    return this.replace(new RegExp(str1.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g,"\\$&"),(ignore?"gi":"g")),(typeof(str2)=="string")?str2.replace(/\$/g,"$$$$"):str2);
}

function *get_wlfra_result(query) {
	var url = 'http://api.wolframalpha.com/v2/query?input=<query>&appid=U7L4VR-K3WJPLK6Y2';

	var data = request('GET', url.replace('<query>',query));

	data = JSON.parse(parser.toJson(data.getBody()));

	var pods = data.queryresult.pod;

	var result = "";

	try {
		for (var i = 0; i < pods.length; i++){
			var index = pods[i];

			if (index.primary === 'true') {
          		result = index.subpod.plaintext;
          		break;
	        }

			if (index.id == "Result"){
				result = index.subpod.plaintext;
				break;
			}
		}

		if (result == ""){
			for (var i = 0; i < pods.length; i++){
				var index = pods[i];

				if (index.title == "Basic information"){
					result = index.subpod.plaintext;
					break;
				}
			}
		}

		// if (result.indexOf('1 | ') == 0) {

	 //        var idx = 1;
	 //        var defns = result.split(/\n/);

	 //        var len  = (defns.length > 3) ? 3 : defns.length,
	 //            result = '';

	 //        for (var i = 0; i < len; i++) {
	 //          result += defns[i].replace(/^(.*)\|(.*)\|/, '') + '.';
	 //        }

  //     	}

      	if (result.indexOf('|') != -1){
      		result = result.replaceAll(' |', ', ');
      	}

		return result;
	} catch (e){
		console.log(e);
		return "";
	}


}

function *movie_resp(query){
	var term = query.split(' movie ')[1];

	var movie_api = 'https://yts.ag/api/v2/list_movies.json?query_term=<query>&sort_by=peers'
	
	var data = request('GET', movie_api.replace('<query>', term));

	data = JSON.parse(data.getBody());


	// magnetLink = genify(magnetLink);

	// var magnet = yield * magnetLink();

	// console.log(magnet);

	return data.data.movies[0].torrents[0].url;

}

function * joke_resp(query){
	var joke_url = 'https://api.chucknorris.io/jokes/random';

	var data = request('GET', joke_url);

	data = JSON.parse(data.getBody());

	return data.value;
}

function * year_resp(query){
	
}

function * default_resp(query){
	
}

module.exports = {
	get : handle_response
};