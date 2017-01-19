var yt = require('./youtube');

function* _intent() {
    return {
        keywords: ['play qqqq by qqqq', 'play qqqq'],
        module: 'song'
    };
}

function* song_resp(query) {

    query = query.replace('play', '');

    var track = query.split('by')[0].trim();
    var artist = query.split('by')[1];

    if (!artist || artist === '') {
        artist = '';
    } else {
        artist = artist.trim();
    }

    var url = yield yt.get(track, artist);

    return url;
}

module.exports = {
    get: song_resp,
    intent: _intent
};