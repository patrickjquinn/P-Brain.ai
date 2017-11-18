let player
const client = new WebTorrent()
let recognition = null;
if ('webkitSpeechRecognition' in window) {
    console.log('Using webkitSpeechRecognition')
    recognition = new webkitSpeechRecognition()
} else if ('SpeechRecognition' in window) {
    console.log('Using SpeechRecognition')
    recognition = new SpeechRecognition()
} else {
    console.log('No speech recognition supported')
}

if (recognition) {
    recognition.continuous = true
    recognition.lang = 'en-GB'
    recognition.onresult = function (event) {
        let inputString = event.results['0']['0'].transcript

        const yes_input = inputString.slice(0, 3)

        if (yes_input == 'yes') {
            inputString = inputString.replace('yes ', '')
        }

        push_statment(inputString)

        if (inputString !== null && typeof inputString !== undefined) {
            if (player && inputString.indexOf('pause') != -1) {
                pause_song()
            } else if (player && inputString.toUpperCase().trim() == 'PLAY') {
                play_song()
            } else if (player && inputString.indexOf('stop') != -1) {
                stop_song()
            } else {
                get_resp(inputString, recognition.is_response)
            }
        } else {
            console.log('testing')
        }

        annyang.start({
            autoRestart: true,
            continuous: false
        })

        console.log(inputString)
    }

    recognition.onerror = function (event) {
        console.log(event.error)

        if (player) {
            if (player.getPlayerState() == 1 || player.getPlayerState() == 2 || player.getPlayerState() === 0) {}
        }
        if (event.error != 'aborted') {
            annyang.start({
                autoRestart: true,
                continuous: false
            })
        }
    }
}

function response_handler(response) {
    const intent = response.type

    let response_funct

    switch (intent) {
        case 'song':
        case 'rick':
            response_funct = play_yt
            break
        case 'movie':
            response_funct = load_torrent
            break
        default:
            response_funct = display_response
    }

    response_funct(response.msg)
}

client.on('error', err => {
    console.error('ERROR: ' + err.message)
})

function hasExtension(inputID, exts) {
    const fileName = inputID
    return (new RegExp('(' + exts.join('|').replace(/\./g, '\\.') + ')$')).test(fileName)
}

function load_torrent(msg) {
    const url = msg.url
    push_movie_response()

    console.log('torrent working')
    client.add(url, torrent => {
        torrent.files.forEach(file => {
            if (hasExtension(file.name, ['.mkv', '.mp4', '.mov', '.avi'])) {
                console.log(file.name)
                file.appendTo('#movie')
                file.getBlobURL((err, url) => {
                    if (err) {
                        return log(err.message)
                    }
                })
            }
        })
    })
}

const delay = (function () {
    let timer = 0
    return function (callback, ms) {
        clearTimeout(timer)
        timer = setTimeout(callback, ms)
    }
})()

function speak_response(msg, callback) {
    const worte = new SpeechSynthesisUtterance(msg)
    worte.lang = 'en-UK'
    if (callback) {
        worte.onend = callback
    }
    window.speechSynthesis.speak(worte)
}

function display_response(msg) {
    let output = msg
    if (msg.text) {
        output = msg.text
    }
    function speech_wrapper() {
        // Don't say yes and make this a response type.
        observe_speech(false, true)
    }
    if (msg.silent) {
        push_silent_response(output, msg.canRespond ? speech_wrapper : null)
    } else {
        push_response(output, msg.canRespond ? speech_wrapper : null)
    }
}

function observe_speech(prompt = true, is_response = false) {
    if (prompt) {
        speak_response('Yes?')
    }

    annyang.abort()

    delay(() => {
        pause_song()
        recognition.is_response = is_response
        recognition.start()
    }, 600)
}

function log_speech(speech) {
    push_statment(speech)

    if (player && speech.indexOf('pause') != -1) {
        pause_song()
    } else if (player && speech.toUpperCase().trim() == 'PLAY') {
        play_song()
    } else if (player && speech.indexOf('stop') != -1) {
        stop_song()
    } else {
        get_resp(speech)
    }
}

function isURL(str) {
    const pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|' + // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
        '(\\#[-a-z\\d_]*)?$', 'i') // fragment locator
    return pattern.test(str)
}

function get_resp(q, is_response = false) {
    push_response('Just a second...')

    let query = q
    if (query.indexOf('+') != -1) {
        query = query.replace('+', 'plus')
    } else if (query.indexOf('÷') != -1) {
        query = query.replace('÷', 'divided by')
    } else if (query.indexOf('√') != -1) {
        query = query.replace('√', 'square root of')
    }

    socket.emit('ask', {text: query, isResponse: is_response})
}

function pause_song() {
    if (player) {
        player.pauseVideo()
    }
}

function play_song() {
    if (player) {
        player.playVideo()
    }
}

function stop_song() {
    if (player) {
        player.stopVideo()
    }
}

function onPlayerStateChange(event) {
    if (event.data === 0) {
        player.nextVideo()
    } else if (event.data == 1) {
        console.log(player.getPlaylist())
    }
}

function play_yt(msg) {
    if (msg.id) {
        push_yt_response(msg.id)
        push_silent_response(msg.text)

        stop_song()

        if (player) {
            player.stopVideo()
            const frame = document.getElementById('player_container')
            frame.innerHTML = '<div id="player"></div>'
        }

        player = new YT.Player('player' + msg.id, {
            height: '300',
            width: '600',
            videoId: msg.id,
            events: {
                onReady: onPlayerReady,
                onStateChange: onPlayerStateChange
            }
        })
    } else {
        display_response(msg)
    }
}

function onPlayerReady(event) {
    event.target.playVideo()
}
