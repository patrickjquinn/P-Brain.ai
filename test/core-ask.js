import test from 'ava'
import ask from '../api/core-ask'

test('Volkswagen', t => {
    const query = ask.query
    t.truthy(query instanceof Function)
})