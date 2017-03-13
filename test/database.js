import test from 'ava'
const tmp = require('tmp')
const Database = require('../sqlite_db')

let database = null
let database_file = null

function * expectThrow(t, fn) {
    try {
        yield fn
    } catch (err) {
        return;
    }
    t.fail('Function did not throw an error.');
}

test.beforeEach(function * () {
    database_file = tmp.fileSync();
    database = yield Database.setup(database_file.name)
})

test('globalSettings', function * (t) {
    t.is(yield database.getGlobalValue(1234), undefined)
    t.is(yield database.getGlobalValue(), undefined)
    t.is(yield database.getGlobalValue(null), undefined)
    t.is(yield database.getGlobalValue('test_key'), undefined)
    yield expectThrow(t, database.setGlobalValue())
    yield expectThrow(t, database.setGlobalValue(null))
    yield expectThrow(t, database.setGlobalValue(''))
    yield database.setGlobalValue('test_key')
    t.is(yield database.getGlobalValue('test_key'), null)
    yield database.setGlobalValue('test_key', 'test_value')
    t.is(yield database.getGlobalValue('test_key'), 'test_value')
    yield database.setGlobalValue('test_key', {value1: 'value1', value2: 'value2'})
    t.is((yield database.getGlobalValue('test_key')).value1, 'value1')
    t.is((yield database.getGlobalValue('test_key')).value2, 'value2')
    yield database.setGlobalValue('test_key2', '?=+///z#;')
    t.is(yield database.getGlobalValue('test_key2'), '?=+///z#;')
    const arr = yield database.getGlobalValue()
    t.true(Array.isArray(arr))
    t.is(arr.length, 2)
})

test('multiSetup', function * (t) {
    const multi_database_file = tmp.fileSync();
    for (let i = 0; i < 5; i++) {
        const multi_database = yield Database.setup(multi_database_file.name)
        yield multi_database.close()
    }
    multi_database_file.removeCallback()
})

test.afterEach(function * () {
    yield database.close()
    database_file.removeCallback()
})

