const port = 8080;
const historySize = 64;

const { uuid } = require('uuidv4');
const express = require('express');
const app = express();
const expressWs = require('express-ws')(app);

var userStore = {};
var messageHistory = [];

app.use(express.static('public'));

app.ws('/ws', (ws, req) => {
    ws.id = uuid();
    console.log(`Connection opened at ${ws._socket.remoteAddress}, ${ws.id}.`);

    ws.on('close', () => {
        delete userStore[ws.id];
        console.log(`Connection closed at ${ws._socket.remoteAddress}, ${ws.id}.`);
    });

    ws.on('message', (msg) => {
        var json = JSON.parse(msg);

        switch(json["packet"]) {
            case 'auth':
                if(ws.id in userStore) {
                    console.log(`${ws.id} tried to re-authenticate.`);
                } else {
                    if(json["username"].length >= 3 && json["username"].length <= 32) {
                        userStore[ws.id] = {
                            username: json["username"],
                            ws: ws
                        };
                        var history = {
                            packet: 'history',
                            history: messageHistory
                        };
                        ws.send(JSON.stringify(history));
                        console.log(`Authenticated ${ws.id} as "${json["username"]}".`);
                    }
                }
                break;
            case 'message':
                if(ws.id in userStore) {
                    if(json["message"].length > 0 && json["message"].length <= 256) {
                        messageHistory.push(
                            {
                                username: userStore[ws.id]['username'],
                                message: json["message"]
                            }
                        );
                        if(messageHistory.length > historySize) {
                            messageHistory.shift();
                        }
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

app.listen(port, () => {
    console.log(`Chat Server listening on port ${port}.`);
});