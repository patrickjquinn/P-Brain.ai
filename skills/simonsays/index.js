function hardRule(query, breakdown) {
	return query.startsWith('simon says')
}

function * resp(query) {
	let resp = query.split('says ')[1]
	resp = resp.charAt(0).toUpperCase() + resp.slice(1) + '.'
	// 20% chance to append 'Simon says'
	if (Math.random() < 0.2) {
		resp = `Simon says: ${resp}`
	}
	return resp;
}

module.exports = {
	get: resp,
	hardRule
};
