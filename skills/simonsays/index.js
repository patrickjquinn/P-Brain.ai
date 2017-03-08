const intent = () => ({
	keywords: ['simon says', 'simon says qqqq'],
	module: 'simonsays'
});

function * resp(query) {
	const resp = query.split('says ')[1];
	return resp;
}

module.exports = {
	get: resp,
	intent
};
