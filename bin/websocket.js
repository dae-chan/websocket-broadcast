var WebSocket = require('ws');

function broadcast(wss, ws, type, data) {
    wss.clients
        .forEach(client => {
            if (client != ws) {
                client.send(JSON.stringify({
                    type: type,
                    data: data,
                }));
            }
        });
}

function send(ws, type, data) {
    ws.send(JSON.stringify({
        type: type,
        data: data,
    }));
}

module.exports = function (server) {
    var wss = new WebSocket.Server({ server });

    // Chatroom
    var numUsers = 0;

    wss.on('connection', (ws) => {
        console.log("CONNECTED");
        var addedUser = false;

        ws.on('message', message => {
            let event, data;
            try {
                message = JSON.parse(message);
                event = message.event;
                data = message.data;
            } catch {
                data = message;
            }
            switch (event) {
                // when the client emits 'new message', this listens and executes
                case 'new message':
                    console.log("NEW MESSAGE" + JSON.stringify(data));
                    // we tell the client to execute 'new message'
                    broadcast(wss, ws, 'new message', {
                        username: ws.username,
                        message: data
                    });
                    break;
                // when the client emits 'add user', this listens and executes
                case 'add user':
                    const username = data;
                    console.log(`ADD USER` + username)
                    if (addedUser) return;

                    // we store the username in the socket session for this client
                    ws.username = username;
                    ++numUsers;
                    addedUser = true;
                    send(ws, 'login', {
                        numUsers: numUsers
                    })
                    // echo globally (all clients) that a person has connected
                    broadcast(wss, ws, 'user joined', {
                        username: ws.username,
                        numUsers: numUsers
                    });
                    break;
                // when the client emits 'typing', we broadcast it to others
                case 'typing':
                    broadcast(wss, ws, 'typing', {
                        username: socket.username
                    });
                    break;
                // when the client emits 'stop typing', we broadcast it to others
                case 'stop typing':
                    broadcast(wss, ws, 'stop typing', {
                        username: socket.username
                    });
                    break;
                // when the user disconnects.. perform this
                case 'disconnect':
                    if (addedUser) {
                        --numUsers;

                        // echo globally that this client has left
                        broadcast(wss, ws, 'user left', {
                            username: socket.username,
                            numUsers: numUsers
                        });
                    }
                    break;
            }
        })
    });
};