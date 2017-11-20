const yt = require('./youtube')

function hardRule(query, breakdown) {
    return query.trim().toLowerCase().startsWith('play')
}

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
        return {id: data.id, text: `Playing ${data.title}.`, url: `https://www.youtube.com/watch?v=${data.id}`, url_autolaunch: true}
    }
    return {text: 'Could not play song.'}
}

// These act as unit tests rather than training data because the skill supplies no intent.
const examples = () => (
    ['Play Everybody Knows by Leonard Cohen']
)

module.exports = {
    get: song_resp,
    hardRule,
    examples
}
