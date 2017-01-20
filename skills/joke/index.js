var request = require('co-request');

function * _intent(){
	return {keywords:['tell me a joke','say something funny','make me laugh'], module:'joke'};
}

function * joke_resp(query){
	var joke_url = 'https://api.chucknorris.io/jokes/random';

	var data = yield request(joke_url);

	data = JSON.parse(data.body);

	return data.value;
}

module.exports = {
	get:joke_resp,
	intent:_intent
}