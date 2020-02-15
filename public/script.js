//Define socket object for client use
let socket;

//Wait until jquery document is loaded
$(document).ready(() => {
    //Reset all text fields to clear browser-cached text
    $("#inputUsername").val("");
    $("#inputChat").val("");    
    $("#chatTextArea").val("");

    //When the connect button is clicked...
    $("#buttonConnect").click(() => {
        var username = $("#inputUsername").val();
        //Check if a socket object hasn't already been defined and the username matches the length requirements
        if(typeof(socket) == 'undefined' && username.length >= 3 && username.length <= 32) {
            //Initialize the websocket connection
            socket = new WebSocket(`ws://${window.location.host}/ws`);
            //Callback, called when the socket connection is opened
            socket.onopen = (event) => {
                //Send an authentication packet
                socket.send(JSON.stringify(
                    {
                        packet: 'auth',
                        username: username
                    }
                ));
                //Hide the login panel, show the chat panel, set the status label
                $("#loginDiv").css("display", "none");
                $("#chatDiv").css("display", "");
                $("#statusLabel").text(`Logged in as ${username}`);
            };
            //Callback, called when a message is received from the server
            socket.onmessage = (event) => {
                var json = JSON.parse(event.data);
                //Switch depending of the packet type
                switch(json["packet"]) {
                    //Packet type -> message history
                    case 'history':
                        var area = $("#chatTextArea");
                        var history = json["history"];
                        //Add every message from the history in the text area
                        for(var i = 0; i < history.length; i++) {
                            var message = history[i];
                            area.val(`${area.val()}[${message["username"]}]: ${message["message"]}\n`);
                        }
                        break;
                    //Packet type -> incoming message
                    case 'message':
                        var area = $("#chatTextArea");
                        //Add the message to the text area
                        area.val(`${area.val()}[${json["username"]}]: ${json["message"]}\n`);
                        break;
                    default:
                        break;
                }
            };
            //Callback, called when the connection is closed
            socket.onclose = (event) => {
                document.body.textContent = "Connection to the Chat Server closed.";
            };
        }
    });

    //When the send button is clicked...
    $("#buttonSend").click(() => {
        var message = $("#inputChat").val();
        //Check if the message matches the length requirements
        if(message.length > 0 && message.length <= 256) {
            //Clear the message input
            $("#inputChat").val("");
            //Send the message to the server
            socket.send(JSON.stringify(
                {
                    packet: 'message',
                    message: message
                }
            ));
        }
    });
});