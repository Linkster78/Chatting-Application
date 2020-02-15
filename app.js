//Program Constants
const port = 8080;
const historySize = 64;

//Libraries and express application
const { uuid } = require('uuidv4');
const express = require('express');
const app = express();
const expressWs = require('express-ws')(app);

//Server Storage
var userStore = {};
var messageHistory = [];

//Serve index.html, style.css and script.js
app.use(express.static('public'));

//Listens for incoming websocket connections
app.ws('/ws', (ws, req) => {
    //Generates a unique ID for the websocket connection
    ws.id = uuid();
    console.log(`Connection opened at ${ws._socket.remoteAddress}, ${ws.id}.`);

    //Called when the websocket connection closes
    ws.on('close', () => {
        //Deletes user from the userStore
        delete userStore[ws.id];
        console.log(`Connection closed at ${ws._socket.remoteAddress}, ${ws.id}.`);
    });

    //Called when a message is received from the websocket connection
    ws.on('message', (msg) => {
        //Parse message into JSON
        var json = JSON.parse(msg);

        //Switch depending of the packet type
        switch(json["packet"]) {
            //Packet type -> authentication
            case 'auth':
                //Make sure the user has not already authenticated
                if(ws.id in userStore) {
                    console.log(`${ws.id} tried to re-authenticate.`);
                } else {
                    //Double check to see if the username matches the length requirements
                    if(json["username"].length >= 3 && json["username"].length <= 32) {
                        //Store user object in userStore
                        userStore[ws.id] = {
                            username: json["username"],
                            ws: ws
                        };
                        //Send message history (previously sent messages) to the user
                        var history = {
                            packet: 'history',
                            history: messageHistory
                        };
                        ws.send(JSON.stringify(history));
                        console.log(`Authenticated ${ws.id} as "${json["username"]}".`);
                    }
                }
                break;
            //Packet type -> incoming message
            case 'message':
                //Make sure the user has authenticated beforehand
                if(ws.id in userStore) {
                    //Double check to see if the message matches the length requirements
                    if(json["message"].length > 0 && json["message"].length <= 256) {
                        //Add latest message to the end of the message history
                        messageHistory.push(
                            {
                                username: userStore[ws.id]['username'],
                                message: json["message"]
                            }
                        );
                        //If there are over <historySize> messages in the history, remove the one at index 0
                        if(messageHistory.length > historySize) {
                            messageHistory.shift();
                        }
                        //Transmit the message to all connected users
                        for(var id in userStore) {
                            userStore[id]['ws'].send(JSON.stringify(
                                {
                                    packet: 'message',
                                    username: userStore[ws.id]['username'],
                                    message: json["message"]
                                }
                            ));
                        }
                        console.log(`Message from "${userStore[ws.id]['username']}": "${json["message"]}".`);
                    }
                } else {
                    console.log(`${ws.id} tried to send a message without authenticating.`);
                }
                break;
            default:
                break;
        }
    });
});

//Start Server on specified port
app.listen(port, () => {
    console.log(`Chat Server listening on port ${port}.`);
});