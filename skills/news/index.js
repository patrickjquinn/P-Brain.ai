const request = require('co-request')
const config = require('../../config')
const keys = config.get

const intent = () => ({
    keywords: ['news', 'bbc news'],
    module: 'news'
})

function * news_resp(query) {
    let source = 'bbc-news'

    if (query.indexOf('tech') != -1) {
        source = 'the-verge'
    } else if (query.indexOf('sport') != -1) {
        source = 'bbc-sport'
    } else if (query.indexOf('science') != -1) {
        source = 'new-scientist'
    } else if (query.indexOf('business') != -1) {
        source = 'bloomberg'
    }

    let news_url = 'https://newsapi.org/v1/articles?sortBy=latest&apiKey=' + keys.newsapi.key + '&source=' + source

    if (source == 'bbc-news' || source == 'bbc-sport' || source == 'new-scientist' || source == 'bloomberg') {
        news_url = news_url.replace('latest', 'top')
    }

    let data = yield request(news_url)

    data = JSON.parse(data.body)

    const resp = data.articles

    const item = resp[Math.floor(Math.random() * resp.length)]

    if (item.title.toUpperCase() != item.description.toUpperCase()) {
        return {text: item.title + '. ' + item.description}
    }
    return {text: item.title + '.'}
}

const examples = () => (
    ['Tell me the current news.']
)

module.exports = {
    get: news_resp,
    intent,
    examples
}
