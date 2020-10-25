// Load HTTP library
const http = require('http');
const fs = require('fs');
const path = require('path');
const { serialize } = require('v8');

// Create an HTTP server to handle responses
const server = http.createServer((req, res) => {
    // File path
    let filePath = path.join(__dirname, 'public', req.url === '/' ? 'index.html' : req.url);

    // File ext
    let extname = path.extname(filePath);

    // Content-Type
    let contentType = 'text/html';

    switch (extname) {
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
        case '.json':
            contentType = 'application/json';
            break;
        case '.png':
            contentType = 'image/png';
            break;
        case '.jpg':
            contentType = 'image/jpg';
            break;
    }
    
    // Read file
    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(500);
            res.end(`Server Error: ${err.code}`);
        }
        else {
            res.writeHead(200, {'Content-Type': contentType});
            res.end(content, 'utf-8');
        }
    });
    
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Spotify login
var client_id = '677e9c59932b4ef3842105a3d342bb0f'; // Your client id
var client_secret = '8f7b02fcd4534e0da05d3c77216139a4'; // Your secret
var redirect_uri = 'http://localhost:8888/callback'; // Your redirect uri

// http.get('/login', (req, res) => {
//     var scopes = 'user-read-private user-read-email';
//     res.redirect('https://accounts.spotify.com/authorize' +
//     '?response_type=code' +
//     '&client_id=' + client_id +
//     (scopes ? '&scope=' + encodeURIComponent(scopes) : '') +
//     '&redirect_uri=' + encodeURIComponent(redirect_uri));
//   });

var stateKey = 'spotify_auth_state';
http.get('/login', (req, res) => {
    // your application requests authorization
    var scope = 'user-read-private user-read-email';
    res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
        response_type: 'code',
        client_id: client_id,
        scope: scope,
        redirect_uri: redirect_uri,
        state: state
    }));
});