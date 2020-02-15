let socket;

$(document).ready(() => {
    $("#inputUsername").val("");
    $("#inputChat").val("");    
    $("#chatTextArea").val("");

    $("#buttonConnect").click(() => {
        var username = $("#inputUsername").val();
        if(typeof(socket) == 'undefined' && username.length >= 3 && username.length <= 32) {
            socket = new WebSocket(`ws://${window.location.host}/ws`);
            socket.onopen = (event) => {
                socket.send(JSON.stringify(
                    {
                        packet: 'auth',
                        username: username
                    }
                ));
                $("#loginDiv").css("display", "none");
                $("#chatDiv").css("display", "");
                $("#statusLabel").text(`Logged in as ${username}`);
            };
            socket.onmessage = (event) => {
                var json = JSON.parse(event.data);
                switch(json["packet"]) {
                    case 'history':
                        var area = $("#chatTextArea");
                        var history = json["history"];
                        for(var i = 0; i < history.length; i++) {
                            var message = history[i];
                            area.val(`${area.val()}[${message["username"]}]: ${message["message"]}\n`);
                        }
                        break;
                    case 'message':
                        var area = $("#chatTextArea");
                        area.val(`${area.val()}[${json["username"]}]: ${json["message"]}\n`);
                        break;
                    default:
                        break;
                }
            };
            socket.onclose = (event) => {
                document.body.textContent = "Connection to the Chat Server closed.";
            };
        }
    });

    $("#buttonSend").click(() => {
        var message = $("#inputChat").val();
        if(message.length > 0 && message.length <= 256) {
            $("#inputChat").val("");
            socket.send(JSON.stringify(
                {
                    packet: 'message',
                    message: message
                }
            ));
        }
    });
});