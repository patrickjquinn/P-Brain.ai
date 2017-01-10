var WtoN = require('words-to-num');

function * timer_resp(query){
	var time_to_set = query.split('for ')[1];

	var number = time_to_set.split(' ')[0];

	if (!number){
		number = time_to_set;
	}

	number = WtoN.convert(number);

	var unit = time_to_set.split(' ')[1];

	if (number){
		return ':timer: ' +number+' '+unit;
	} else {
		return 'Sorry, I dont understand '+query;
	}
}

module.exports = {
	get: timer_resp
}