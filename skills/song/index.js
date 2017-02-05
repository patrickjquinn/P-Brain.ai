const yt = require('./youtube')

const intent = () => ({
    keywords: ['play qqqq by qqqq', 'play qqqq', 'what is love'],
    module: 'song'
})

function * song_resp(query) {
    query = query.replace('play', '')
    let track = query.split('by')[0].trim()
    let artist = query.split('by')[1]

    if (query.includes('what is love')) {
        track = 'what is love'
        artist = 'Haddaway'
    }

    if (!artist || artist === '') {
        artist = ''
    } else {
        artist = artist.trim()
    }

    const data = yield yt.get(track, artist)
    if (data) {
        return {id: data.id, text: `Playing ${data.title}.`}
    }
    return {text: 'Could not play song.'}
}

const examples = () => (
    ['Play Everybody Knows by Leonard Cohen', 'Play Lady Gaga', 'Play Year 3000', 'Play David Bowie', 'Play']
)

module.exports = {
    get: song_resp,
    intent,
    examples
}
