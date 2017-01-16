$('.chat[data-chat=person2]').addClass('active-chat');
$('.person[data-chat=person2]').addClass('active');
$('.left .person').mousedown(function() {
    if ($(this).hasClass('.active')) {
        return false;
    } else {
        var findChat = $(this).attr('data-chat');
        var personName = $(this).find('.name').text();
        $('.right .top .name').html(personName);
        $('.chat').removeClass('active-chat');
        $('.left .person').removeClass('active');
        $(this).addClass('active');
        $('.chat[data-chat = ' + findChat + ']').addClass('active-chat');
    }
});

function push_statment(msg) {
    $(".chat").append('<div class="bubble me">' + msg + '</div>');
}

function push_silent_response(msg) {
    $(".chat").append('<div class="bubble you">' + msg + '</div>');
}

function push_response(msg) {
    if (msg == "Just a second...") {
        $(".chat").append('<div class="bubble you loading">' + msg + '</div>');
    } else {
        speak_response(msg);

        if (msg.toUpperCase().indexOf(' CLOUD') != -1) {
            $(".chat").append('<div class="bubble you"><i class="fa fa-cloud" aria-hidden="true"></i>  ' + " " + msg + '</div>');
        } else if (msg.toUpperCase().indexOf(' RAIN') != -1 || msg.toUpperCase().indexOf(' DRIZZLE') != -1) {
            $(".chat").append('<div class="bubble you"><i class="fa fa-tint" aria-hidden="true"></i>  ' + " " + msg + '</div>');
        } else if (msg.toUpperCase().indexOf(' SUN') != -1 || msg.toUpperCase().indexOf('AND CLEAR') != -1) {
            $(".chat").append('<div class="bubble you"><i class="fa fa-sun-o" aria-hidden="true"></i>  ' + " " + msg + '</div>');
        } else if (msg.toUpperCase().indexOf(' SNOW') != -1) {
            $(".chat").append('<div class="bubble you"><i class="fa fa-snowflake-o" aria-hidden="true"></i>  ' + " " + msg + '</div>');
        } else if (msg.indexOf(' AM') != -1 || msg.indexOf(' PM') != -1) {
            $(".chat").append('<div class="bubble you"><i class="fa fa-clock-o" aria-hidden="true"></i>' + " " + msg + '</div>');
        } else {
            $(".chat").append('<div class="bubble you">' + msg + '</div>');
        }
    }
}

function push_yt_response(id) {

    $(".chat").append('<div style="border-radius: 5px !important;" class="bubble you"><div id="player_container"><div class="player" id="player' + id + '"></div></div></div>');
}

function push_timer_response(msg) {
    if (!msg) {
        $(".chat").append('<div class="bubble you countdown"><span class="days"></span>:<span class="hours"></span>:<span class="minutes"></span>:<span class="seconds"></span></div>');
    } else {
        // $('.countdown').remove();
        var old = document.getElementsByClassName('countdown')[0];
        old.innerHTML = msg;
        $('.countdown').removeClass('countdown');
    }
}

function push_movie_response(id) {
    var old = document.getElementById('movie');

    if (old) {
        old.innerHTML = "";
    }
    $(".chat").append('<div style="border-radius: 5px !important;" class="bubble you"><div id="movie"><div class="loader"></div></div></div>');
}

$('#textbox').keypress(function(e) {
    if (e.which == 13) {
        $(this).blur();
        push_statment($('#textbox').val());
        log_speech($('#textbox').val());
        document.getElementById('textbox').value = '';

        return false;
    }
});