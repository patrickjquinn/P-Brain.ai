var api = "http://" + ip_addr + ":4567/api/ask?q=";
var player;
var client = new WebTorrent();
var recognition = new webkitSpeechRecognition();

function response_handler(response) {
    var intent = response.type;
    var msg = response.msg;

    var response_funct;

    switch (intent) {
        case "time":
            response_funct = push_response;
            break;
        case "timer":
            response_funct = set_timer;
            break;
        case "weather":
            response_funct = push_response;
            break;
        case "joke":
            response_funct = push_response;
            break;
        case "song":
            response_funct = play_yt;
            break;
        case "movie":
            response_funct = load_torrent;
            break;
        case "fact":
            response_funct = push_response;
            break;
        default:
            response_funct = push_response;
    }

    response_funct(msg);
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
            get_resp(api + inputString, inputString);
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

function load_torrent(url) {
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
    push_response(msg);
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
        get_resp(api + speech, speech);
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

function set_timer(timer) {
    timer = timer.replace(':timer:', '');

    var sec_num = parseInt(timer, 10) / 1000; // Convert the time to seconds.
    var remaining = getTimeRemaining(parseInt(timer, 10));
    console.log(remaining);

    var message = 'Okay, timer set for ' + formatTime(remaining);

    push_response(message);
    push_timer_response();
    initializeClock(sec_num);
}

function getTimeRemaining(t) {
    var seconds = Math.floor((t / 1000) % 60);
    var minutes = Math.floor((t / 1000 / 60) % 60);
    var hours = Math.floor((t / (1000 * 60 * 60)) % 24);
    var days = Math.floor(t / (1000 * 60 * 60 * 24));
    return {
        'total': t,
        'days': days,
        'hours': hours,
        'minutes': minutes,
        'seconds': seconds
    };
}

function formatTime(time) {
    var message = "";
    var units = [];
    function pushUnit(num, unit) {
        if (num > 0) {
            units.push(num + " " + unit + (num > 1 ? "s" : ""));
        }
    }
    pushUnit(time.days, "day");
    pushUnit(time.hours, "hour");
    pushUnit(time.minutes, "minute");
    pushUnit(time.seconds, "second");
    if (units.length > 1) {
        units.splice(units.length - 1, 0, "and");
    }
    for (var  i = 0; i < units.length; i++) {
        message += ((i > 0) ? " " : "") + units[i];
    }
    return message;
}

function initializeClock(time) {

    var deadline = new Date(Date.parse(new Date()) + time * 1000);

    var clock = document.getElementsByClassName('countdown')[0];

    function updateClock() {
        var t = getTimeRemaining(Date.parse(deadline) - Date.parse(new Date()));
        clock.innerHTML = formatTime(t);

        if (t.total <= 0) {
            clearInterval(timeinterval);
            speak_response('Hey there! Your timer is finished!');
            push_timer_response('Hey there! Your timer is finished!');
        }
    }

    updateClock();
    var timeinterval = setInterval(updateClock, 1000);
}


function get_resp(api, q) {
    var xmlhttp,json_resp;

    display_response('Just a second...');

    xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            $(".loading").remove();

            json_resp = JSON.parse(xmlhttp.responseText);

            response_handler(json_resp);
        } else if (xmlhttp.readyState == 4 && xmlhttp.status == 500) {
            $(".loading").remove();

            json_resp = JSON.parse(xmlhttp.responseText);
            display_response(json_resp.msg);
        }
    };

    if (api.indexOf('+') != -1) {
        api = api.replace('+', 'plus');
    } else if (api.indexOf('÷') != -1) {
        api = api.replace('÷', 'divided by');
    } else if (api.indexOf('√') != -1) {
        api = api.replace('√', 'square root of');
    }

    xmlhttp.open("GET", api, true);
    xmlhttp.send();
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


function play_yt(id) {

    id = id.replace('https://www.youtube.com/watch?v=', '');

    push_yt_response(id);

    stop_song();

    if (player) {
        player.stopVideo();
        var frame = document.getElementById("player_container");
        frame.innerHTML = '<div id="player"></div>';
    }

    player = new YT.Player('player' + id, {
        height: '300',
        width: '600',
        videoId: id,
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerReady(event) {
    event.target.playVideo();
}
