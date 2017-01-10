function *coin_resp(){
	var state = (Math.floor(Math.random() * 2) == 0) ? 'heads' : 'tails';

	return "It's " + state;
}

module.exports = {
	get: coin_resp
}
