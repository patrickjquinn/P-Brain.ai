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

    const data = yield yt.get(track, artist)
    if (data) {
        return {'id': data.id, 'text': `Playing ${data.title}.`}
    } else {
        return {'text': 'Could not play song.'}
    }
}

module.exports = {
    get: song_resp,
    intent
}
