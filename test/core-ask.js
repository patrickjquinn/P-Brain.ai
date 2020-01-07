const test = require('ava');
const ask = require('../api/core-ask');

test('Volkswagen', t => {
    const query = ask.query;
    t.truthy(query instanceof Function);
});
