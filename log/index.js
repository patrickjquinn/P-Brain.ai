'use strict';

var fs = require('co-fs');

function* log_query(query){
	var queries_obj = require('./log.json'),
		entry = {"query":query, "timestamp":Math.round(+new Date()/1000)};

	var queries = queries_obj.queries; 

	queries.push(entry);

	queries_obj.queries = queries;

	yield fs.writeFile('./log/log.json', JSON.stringify(queries_obj,null,4));

	return;
}

function* log_response(query,response,skill){
	var responses_obj = require('./responses.json'),
		entry = {"query":query, "response":response,"skill":skill,"timestamp":Math.round(+new Date()/1000)};

	var responses = responses_obj.responses; 

	responses.push(entry);

	responses_obj.responses = responses;

	yield fs.writeFile('./log/responses.json', JSON.stringify(responses_obj,null,4));

	return;
}

function* get_last_query(){
	var queries = require('./log.json').queries;
	if (queries && queries.length){
		return queries[0];
	} else {
		return null;
	}
}

function* get_last_response(){
	var responses = require('./responses.json').responses;
	if (responses && responses.length){
		return responses[0];
	} else {
		return null;
	}
}

module.exports = {
	add: log_query,
	get_last: get_last_query,
	response: log_response,
	get_last_response: get_last_response
};