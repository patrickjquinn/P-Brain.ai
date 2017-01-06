$('.chat[data-chat=person2]').addClass('active-chat');
$('.person[data-chat=person2]').addClass('active');

$('.left .person').mousedown(function(){
    if ($(this).hasClass('.active')) {
        return false;
    } else {
        var findChat = $(this).attr('data-chat');
        var personName = $(this).find('.name').text();
        $('.right .top .name').html(personName);
        $('.chat').removeClass('active-chat');
        $('.left .person').removeClass('active');
        $(this).addClass('active');
        $('.chat[data-chat = '+findChat+']').addClass('active-chat');
    }
});

function push_statment(msg) {
    $( ".chat" ).append('<div class="bubble me">'+msg+'</div>');
}

function push_response(msg) {
    if (msg == "Just a second..."){
        $( ".chat" ).append('<div class="bubble you loading">'+msg+'</div>');
    } else {
        $( ".chat" ).append('<div class="bubble you">'+msg+'</div>');
    }
}

function push_yt_response(id) {
    
    $( ".chat" ).append('<div style="border-radius: 5px !important;" class="bubble you"><div id="player_container"><div class="player" id="player'+id+'"></div></div></div>');
}

function push_movie_response(id) {
    var old = document.getElementById('movie');

    if (old){
        old.innerHTML = "";
    }
    $( ".chat" ).append('<div style="border-radius: 5px !important;" class="bubble you"><div id="movie"><div class="loader"></div></div></div>');
}

$('#textbox').on('keypress', function (e) {
    e.preventDefault();
    e.stopImmediatePropagation();

         if(e.which === 13){
            push_statment($('#textbox').val());
            log_speech($('#textbox').val())
            document.getElementById('textbox').value = '';
         }
    return false;
});