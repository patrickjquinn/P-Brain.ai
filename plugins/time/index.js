function * time_resp(query){
	var time = new Date().toLocaleTimeString('en-GB', { hour: "numeric", 
                                             minute: "numeric"});

	return "It is " + time;
}

module.exports = {
	get: time_resp
}