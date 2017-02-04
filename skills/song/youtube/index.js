const request = require('co-request')

function * yt(title, artist) {
    title = title.replace(/[^\w\s]/gi, '')
    artist = artist.replace(/[^\w\s]/gi, '')

    const url = 'https://www.googleapis.com/youtube/v3/search?q=' + title + ' ' + artist + '&part=snippet&maxResults=10&order=relevance&type=video&key=AIzaSyDY53lC9729bLz26TfKXYKINoYLLZOn0A8'
    try {
        let data = yield request(url)

        data = JSON.parse(data.body)

        if (!data || !data.items || !data.items.length || !data.items[0]) {
            return null
        } else {
            const video = {
                title: data.items[0].snippet.title,
                id: data.items[0].id.videoId
            }
            return video
        }
    } catch (e) {
        console.error(e)
        return null
    }
}

module.exports = {
    get: yt
}
