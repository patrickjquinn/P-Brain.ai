var request = require('co-request');

function * _intent(){
	return {keywords:['start movie qqqq'], module:'movie'};
}

function *movie_resp(query){
	var term = query.split(' movie ')[1];

	var movie_api = 'https://yts.ag/api/v2/list_movies.json?query_term=<query>&sort_by=peers'
	
	var data = yield request(movie_api.replace('<query>', term));

	data = JSON.parse(data.body);

	return data.data.movies[0].torrents[0].url;
}

module.exports = {
	get:movie_resp,
	intent:_intent
}