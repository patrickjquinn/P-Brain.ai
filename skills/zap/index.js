const http = require('http')

const intent = () => ({
    keywords: ['switch to', 'switch to qqqq'],
    module: 'zap'
})

function * zap_resp(query) {
	const sky = "1:0:16:A:4:85:C00000:0:0:0:"

    const channel = query.split('to ')[1]
	
	if(channel.toString == "sky cinema"){
		console.log("In LOOP");
	
		if(zap(sky)){
			return 'Zapped'
		}
	}
}

function * zap(channel) {
	var state;

	var options = {
		host: '192.168.178.172',
		path: '/web/zap?sRef='.concat(channel)
	};

	callback = 
	function(response) {
		var str = '';
		response.on('data', function (chunk) {str += chunk;});
		response.on('end', function () {
								var parsed = JSON.parse(str);
								state = parsed.e2state;
							});
	}
	
	http.request(options, callback).end();
	
	return state
}

module.exports = {
    get: zap_resp,
    intent
}