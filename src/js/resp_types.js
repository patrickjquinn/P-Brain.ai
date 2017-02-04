var player;
var client = new WebTorrent();
var recognition = new webkitSpeechRecognition();

function response_handler(response) {
    var intent = response.type;

    var response_funct;

    switch (intent) {
        case "song":
        case "rick":
            response_funct = play_yt;
            break;
        case "movie":
            response_funct = load_torrent;
            break;
        default:
            response_funct = display_response;
    }

    response_funct(response.msg);
}

client.on('error', function(err) {
    console.error('ERROR: ' + err.message);
});

recognition.continuous = true;

recognition.lang = "en-GB";

recognition.onresult = function(event) {

    var inputString = event.results['0']['0'].transcript;

    var yes_input = inputString.slice(0, 3);

    if (yes_input == 'yes') {
        inputString = inputString.replace('yes ', '');
    }

    push_statment(inputString);

    if (inputString !== null && typeof inputString !== undefined) {
        if (player && inputString.indexOf('pause') != -1) {
            pause_song();
        } else if (player && inputString.toUpperCase().trim() == 'PLAY') {
            play_song();
        } else if (player && inputString.indexOf('stop') != -1) {
            stop_song();
        } else {
            get_resp(inputString);
        }
    } else {
        console.log('testing');
    }

    if (player) {
        if (player.getPlayerState() == 1 || player.getPlayerState() == 2 || player.getPlayerState() === 0) {
            // document.getElementById("resp_text").className = "top";
            console.log('added top');
        }
    }

    annyang.start({
        autoRestart: true,
        continuous: false
    });

    console.log(inputString);
};

recognition.onerror = function(event) {
    console.log(event.error);

    if (player) {
        if (player.getPlayerState() == 1 || player.getPlayerState() == 2 || player.getPlayerState() === 0) {}
    }
    if (event.error != 'aborted') {
        annyang.start({
            autoRestart: true,
            continuous: false
        });
    }
};

function hasExtension(inputID, exts) {
    var fileName = inputID;
    return (new RegExp('(' + exts.join('|').replace(/\./g, '\\.') + ')$')).test(fileName);
}

function load_torrent(msg) {
    var url = msg.url;
    push_movie_response();

    console.log('torrent working');
    client.add(url, function(torrent) {

        torrent.files.forEach(function(file) {

            if (hasExtension(file.name, ['.mkv', '.mp4', '.mov', '.avi'])) {
                console.log(file.name);
                file.appendTo('#movie');
                file.getBlobURL(function(err, url) {
                    if (err) return log(err.message);
                });
            }

        });
    });
}

var delay = (function() {
    var timer = 0;
    return function(callback, ms) {
        clearTimeout(timer);
        timer = setTimeout(callback, ms);
    };
})();

function speak_response(msg) {
    var worte = new SpeechSynthesisUtterance(msg);
    worte.lang = "en-UK";
    window.speechSynthesis.speak(worte);
}

function display_response(msg) {
    var output = msg;
    if (msg.text) {
        output = msg.text;
    }
    push_response(output);
}

function display_greeting() {
    var dt = new Date().getHours();

    var response;

    if (dt >= 0 && dt <= 11) {
        response = 'Good Morning!';
    } else if (dt >= 12 && dt <= 17) {
        response = 'Good Afternoon!';
    } else {
        response = 'Good Evening!';
    }

    delay(function() {
        push_silent_response(response);
    }, 600);
}

function observe_speech() {

    speak_response('Yes?');

    annyang.abort();

    delay(function() {
        pause_song();
        recognition.start();
    }, 600);


}

function log_speech(speech) {

    console.log(speech);

    push_statment(speech);

    if (player && speech.indexOf('pause') != -1) {
        pause_song();
    } else if (player && speech.toUpperCase().trim() == 'PLAY') {
        play_song();
    } else if (player && speech.indexOf('stop') != -1) {
        stop_song();
    } else {
        get_resp(speech);
    }

}

function isURL(str) {
    var pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|' + // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
        '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
    return pattern.test(str);
}

function get_resp(q) {
    push_response('Just a second...');

    var query = q;
    if (query.indexOf('+') != -1) {
        query = query.replace('+', 'plus');
    } else if (query.indexOf('÷') != -1) {
        query = query.replace('÷', 'divided by');
    } else if (query.indexOf('√') != -1) {
        query = query.replace('√', 'square root of');
    }

    socket.emit('ask', { text: query});
}

function pause_song() {
    if (player) {
        player.pauseVideo();
    }
}

function play_song() {
    if (player) {
        player.playVideo();
    }
}

function stop_song() {
    if (player) {
        player.stopVideo();
    }
}

function onPlayerStateChange(event) {
    if (event.data === 0) {
        player.nextVideo();
    } else if (event.data == 1) {
        console.log(player.getPlaylist());
    }
}


function play_yt(msg) {
    if (msg.id) {
        push_yt_response(msg.id);
        push_silent_response(msg.text);

        stop_song();

        if (player) {
            player.stopVideo();
            var frame = document.getElementById("player_container");
            frame.innerHTML = '<div id="player"></div>';
        }

        player = new YT.Player('player' + msg.id, {
            height: '300',
            width: '600',
            videoId: msg.id,
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange
            }
        });
    } else {
        display_response(msg);
    }
}

function onPlayerReady(event) {
    event.target.playVideo();
}
