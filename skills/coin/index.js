function * coin_resp(){
	var state = (Math.floor(Math.random() * 2) == 0) ? 'heads' : 'tails';

	return "It's " + state;
}

function * _intent(){
	return {keywords:['heads','tails','flip','toss','flipacoin'], module:'coin'};
}

module.exports = {
	get: coin_resp,
	intent: _intent
}
