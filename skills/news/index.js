var request = require('sync-request');
var news = ['the-verge', 'bbc-news', 'bloomberg','bbc-sport','new-scientist',];
var config = require('../../config');
var keys = config.get;

function * _intent(){
	return {keywords:['news'], module:'news'};
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


	var news_url = 'https://newsapi.org/v1/articles?sortBy=latest&apiKey='+keys.newsapi.key+'&source='+source;

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

module.exports = {
	get:news_resp,
	intent:_intent
}