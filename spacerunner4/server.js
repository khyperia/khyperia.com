const https = require('https');
const WebSocket = require('ws');
const fs = require('fs');

const options = {
    key: fs.readFileSync('/etc/lighttpd/certs/domain.key'),
    cert: fs.readFileSync('/etc/lighttpd/certs/domain.crt'),
};
const server = https.createServer(options)
const wss = new WebSocket.Server({ server });

wss.on('connection', function connection(ws) {
    console.log("New connection!")
    ws.on('message', function incoming(data) {
        // Broadcast to everyone else.
        wss.clients.forEach(function each(client) {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    });
});

server.listen(14759, function listening() {
  console.log('Listening on %d', server.address().port);
});
