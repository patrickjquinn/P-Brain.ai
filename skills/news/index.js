const request = require('co-request')

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

    const key = yield global.db.getSkillValue('news', 'newsapi')
    let news_url = 'https://newsapi.org/v1/articles?sortBy=latest&apiKey=' + key + '&source=' + source

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

function * register() {
    if ((yield global.db.getSkillValue('news', 'newsapi')) == null) {
        console.log('Setting default API key for news')
        yield global.db.setSkillValue('news', 'newsapi', 'f4504df34ba9432f80ff040a41736518')
    }
}

module.exports = {
    get: news_resp,
    intent,
    examples
}
