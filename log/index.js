const fs = require('co-fs')

function * log_query(query) {
    const queries_obj = require('./log.json')
    const entry = { query, timestamp: Math.round(Number(new Date()) / 1000) }

    const queries = queries_obj.queries

    queries.push(entry)

    queries_obj.queries = queries

    yield fs.writeFile('./log/log.json', JSON.stringify(queries_obj, null, 4))
}

function * log_response(query, response, skill) {
    const responses_obj = require('./responses.json')
    const entry = { query, response, skill, timestamp: Math.round(Number(new Date()) / 1000) }

    const responses = responses_obj.responses

    responses.push(entry)

    responses_obj.responses = responses

    yield fs.writeFile('./log/responses.json', JSON.stringify(responses_obj, null, 4))
}

function * get_last_query() {
    const queries = require('./log.json').queries
    if (queries && queries.length) {
        return queries[0]
    } else {
        return null
    }
}

function * get_last_response() {
    const responses = require('./responses.json').responses
    if (responses && responses.length) {
        return responses[0]
    } else {
        return null
    }
}

module.exports = {
    add: log_query,
    get_last: get_last_query,
    response: log_response,
    get_last_response
}
