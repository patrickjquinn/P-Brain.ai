var request = require('sync-request');

function * _intent(){
	return {keywords:['tell me a joke','say something funny','make me laugh'], module:'joke'};
}

function * joke_resp(query){
	var joke_url = 'https://api.chucknorris.io/jokes/random';

	var data = request('GET', joke_url);

	data = JSON.parse(data.getBody());

	return data.value;
}

module.exports = {
	get:joke_resp,
	intent:_intent
}