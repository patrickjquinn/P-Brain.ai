var request = require('sync-request');

function * joke_resp(query){
	var joke_url = 'https://api.chucknorris.io/jokes/random';

	var data = request('GET', joke_url);

	data = JSON.parse(data.getBody());

	return data.value;
}

module.exports = {
	get:joke_resp
}