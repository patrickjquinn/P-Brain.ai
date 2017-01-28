const request = require('co-request')

const intent = () => ({
    keywords: ['start movie qqqq'],
    module: 'movie'
})

function * movie_resp(query) {
    const term = query.split(' movie ')[1]

    const movie_api = 'https://yts.ag/api/v2/list_movies.json?query_term=<query>&sort_by=peers'

    let data = yield request(movie_api.replace('<query>', term))

    data = JSON.parse(data.body)

    return data.data.movies[0].torrents[0].url
}

module.exports = {
    get: movie_resp,
    intent
}
