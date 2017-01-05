var request = require('sync-request');

function yt(title, artist) {

    title = title.replace(/[^\w\s]/gi, '');
    artist = artist.replace(/[^\w\s]/gi, '');

    var url = 'https://www.googleapis.com/youtube/v3/search?q=' + title + ' ' + artist + '&part=snippet&maxResults=10&order=relevance&type=video&key=AIzaSyDY53lC9729bLz26TfKXYKINoYLLZOn0A8';
    try {
        var data = request('GET',url);

        data = JSON.parse(data.getBody());
        
        if (!data || !data.items || !data.items.length || !data.items[0]) {
            return null;
        } else {
            return 'https://www.youtube.com/watch?v=' + data.items[0].id.videoId;
        }
    } catch (e){
        console.log(e);
        return null;
    }
    
    return null;
}

module.exports = {
    get: yt
}