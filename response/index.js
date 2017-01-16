function *handle_response(request) {
	console.log(request);

	var funct = require('../skills/'+request.responseType);
	var response = yield funct.get(request.originalQuery);

	return response;
}

module.exports = {
	get : handle_response
};