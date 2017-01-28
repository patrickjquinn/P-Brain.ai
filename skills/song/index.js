const yt = require('./youtube')

const intent = () => ({
    keywords: ['play qqqq by qqqq', 'play qqqq', 'what is love'],
    module: 'song'
})

function * song_resp(query) {
    if (query.includes('what is love')) {
        return yield yt.get('what is love', 'Haddaway')
    }

    query = query.replace('play', '')

    const track = query.split('by')[0].trim()
    let artist = query.split('by')[1]

    if (!artist || artist === '') {
        artist = ''
    } else {
        artist = artist.trim()
    }

    const url = yield yt.get(track, artist)

    return url
}

module.exports = {
    get: song_resp,
    intent
}
