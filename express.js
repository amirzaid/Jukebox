// Require Express
const express = require("express");
var request = require("request"); // "Request" library
const querystring = require("querystring");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { query, Router, response } = require("express");
const path = require("path");
const http = require('http');
const admin = require("firebase-admin");
const bodyParser = require('body-parser');
require('dotenv').config();

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.DB_URL
});

// Get a database reference to our posts
var db = admin.database();
var ref = db.ref();

var app = express(); // Create express app
const server = http.createServer(app); // Create a server

var client_id = process.env.CLIENT_ID; // Your client id
var client_secret = process.env.CLIENT_SECRET; // Your secret
var redirect_uri = "http://spotify--jukebox.herokuapp.com/callback"; // Your redirect uri
var playerURL = 'https://api.spotify.com/v1/me/player'; // Player endpoint url
var access_token = ''
var refresh_token = ''

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function (length) {
  var text = "";
  var possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = "spotify_auth_state";

/* Middleware */
app
  .use(express.static(path.join(__dirname, "public"))) // Load public files
  .use(cors()) // Allow access to and from outsource api's
  .use(cookieParser()) // Cookie handler
  .use(express.urlencoded({ extended: true })) // Body-parser - handles post body data

////* Spotify handlers *////

// Authentication request
app.get("/login", function (req, res) {
  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = "user-read-private user-read-email user-modify-playback-state user-read-playback-state user-read-recently-played";
  res.redirect(
    "https://accounts.spotify.com/authorize?" +
    querystring.stringify({
      response_type: "code",
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state, // Optional, but strongly recommended. This provides protection against attacks such as cross-site request forgery.
      //show_dialog: false //defult
    })
  );
});

//  Spotify callback
app.get("/callback", (req, res) => {
  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null; // returned from login request
  var state = req.query.state || null; // returned from login request
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect(
      "/#" +
      querystring.stringify({
        error: "state_mismatch",
      })
    );
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: "https://accounts.spotify.com/api/token",
      form: {
        code: code, // required
        redirect_uri: redirect_uri, // required
        grant_type: "authorization_code", // required
      },
      headers: {
        Authorization: `Basic ${(new Buffer.from(client_id + ':' + client_secret).toString('base64'))}`, // required
      },
      json: true,
    };
    request.post(authOptions, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        access_token = body.access_token,
          refresh_token = body.refresh_token,
          expires_in = body.expires_in;

        var options = {
          url: "https://api.spotify.com/v1/me",
          headers: { Authorization: "Bearer " + access_token },
          json: true,
        };

        // use the access token to access the Spotify Web API
        request.get(options, function (error, response, body) {
          console.log('body id: ' + body.id);
          // Create new room in firebase db

          var roomID = generateRandomString(6);

          // Push room data to DB
          ref.child('rooms').push({
            roomID: roomID,
            host: body.id,
            access_token: access_token,
            refresh_token: refresh_token,
            participants: null
          });

          res.redirect(`/#roomid=${roomID}`); // Redirect user to index + roomid hash param
        });

      } else {
        res.redirect(
          "#" +
          querystring.stringify({
            error: "invalid_token",
          })
        );
      }
    });
  }
});

// Get refresh token
app.get('/refresh_token', function (req, res) {
  // requesting access token from refresh token
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': `Basic ${(new Buffer.from(client_id + ':' + client_secret).toString('base64'))}` },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      /* var access_token = body.access_token; */
      access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});

// add get access token func?
// add error catcher?
function getAccessToken() {
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': `Basic ${(new Buffer.from(client_id + ':' + client_secret).toString('base64'))}` },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      access_token = body.access_token;
      console.log(`new access token: ${access_token}`); // log new access token
    }
  });
}

// check if playing
app.get('/currently_playing', function (req, res) {
  var authOptions = {
    url: `${playerURL}/currently-playing`,
    headers: { 'Authorization': `Bearer ${access_token}` },
    json: true
  };
  request.get(authOptions, (error, response, body) => {
    res.send(response);
    if (response.statusCode && response.statusCode === 401) {
      getAccessToken()
    }
  })
})

// search track
app.get('/search_track', function (req, res) {
  var authOptions = {
    url: 'https://api.spotify.com/v1/search',
    headers: { 'Authorization': `Bearer ${access_token}` },
    qs: {
      "q": req.query.searchItem,
      "type": 'track'
    },
    json: true
  };
  request.get(authOptions, (error, response, body) => {
    res.send(response);
    if (response.statusCode && response.statusCode === 401) {
      getAccessToken()
    }
  })
})

// add track to queue
app.post('/add_track', function (req, res) {
  var authOptions = {
    url: `https://api.spotify.com/v1/me/player/queue?uri=${req.body.trackURI}`,
    headers: { 'Authorization': `Bearer ${access_token}` }
  };
  request.post(authOptions, (error, response, body) => {
    res.send(response);
    if (response.statusCode && response.statusCode === 401) {
      getAccessToken()
    }
  })
})

// Play / Pause player
app.put('/play_pause_player', function (req, res) {
  var authOptions = {
    url: `${playerURL}${req.body.play_pause}`,
    headers: { 'Authorization': `Bearer ${access_token}` },
    qs: { "device_id": req.body.curr_device_id }
  };
  request.put(authOptions, (error, response, body) => {
    res.send(response);
    if (response.statusCode && response.statusCode === 401) {
      getAccessToken()
    }
  })
})

// Skip back / forward
app.post('/skip', function (req, res) {
  var authOptions = {
    url: `${playerURL}${req.body.skip_form}`,
    headers: { 'Authorization': `Bearer ${access_token}` },
    qs: { "device_id": req.body.curr_device_id }
  };
  request.post(authOptions, (error, response, body) => {
    res.send(response);
    if (response.statusCode && response.statusCode === 401) {
      getAccessToken()
    }
  })
})

////* END - Spotify handlers *////


////* Firebase handlers *////
// Your web app's Firebase configuration
var firebaseConfig = {
  apiKey: process.env.API_KEY,
  authDomain: "jukebox-d932d.firebaseapp.com",
  databaseURL: "https://jukebox-d932d.firebaseio.com/",
  projectId: "jukebox-d932d",
  storageBucket: "jukebox-d932d.appspot.com",
  messagingSenderId: "831237212121",
  appId: "1:831237212121:web:61cb4cac1c030340287bc8",
};

// get firebase config
app.get('/firebase_config', (req, res) => {
  res.send(firebaseConfig)
})

////* DB handlers *////

// Check for valid room id
app.get('/checkroom', (req, res) => {
  // Look for room with same roomid
  ref.child('rooms').orderByChild('roomID').equalTo(req.query.roomid).once('value', (snapshot) => {
    // If exist
    if (snapshot.val()) {
      console.log('ok');
      res.send(req.query.roomid); // Send roomid back to client
    }
    // No room found
    else {
      res.statusCode = 400;
      console.log('room doesnt exist');
      res.send(400, `Room doesn't exist`);
    }
  })
});

// Add user to room
app.post('/addUserToRoom', (req, res) => {
  console.log(req.body);
  var roomid = req.body.roomid;
  var uid = req.body.uid;

  // Look for room with same roomid
  ref.child('rooms').orderByChild('roomID').equalTo(roomid).once('value', snapshot => {
    // If exist
    if (snapshot.val()) {
      //console.log(snapshot.key);
      //console.log(snapshot.val());
      var room_key = Object.keys(snapshot.val())[0];
      //console.log(room_key);
      //console.log(snapshot.child(room_key).val().access_token);

      // Check if user is in this room
      ref.child(`rooms/${room_key}/participants`).orderByChild('uid').equalTo(uid).once('value', snapshot2 => {
        var user_key;
        // User already in a room
        if (snapshot2.val()) {
          //console.log(snapshot2.key);
          //console.log(Object.keys(snapshot2.val())[0]);
          console.log('user already in a room');
          user_key = Object.keys(snapshot2.val())[0];
        }
        // Assign user to room
        else {
          console.log('user entered the room');
          var newKeyRef = ref.child(`/rooms/${room_key}/participants`).push({
            uid
          });
          user_key = newKeyRef.key;
        }
        var room = snapshot.child(room_key).val();
        //var user_key = Object.keys(snapshot2.val())[0];
        //console.log(snapshot2.child(`${user_key}`).val().uid);
        //console.log(snapshot2.val());
        //console.log(room);
        var user = {
          access_token: room.access_token,
          refresh_token: room.refresh_token,
          room_key: room_key,
          user_key: user_key
        }
        // Update access and refresh tokens
        access_token = room.access_token
        refresh_token = room.refresh_token

        /* console.log(user); */

        res.send(200, user); // Send user data to client
        //res.send(200, snapshot.child(room_key).val().access_token);
      })
    }
    // No room found
    else {
      // Didn't find room with given id
      res.send(400);
    }
  })
})

//Remove user from room
app.post('/removeUserFromRoom', (req, res) => {
  var room_key = req.query.room_key;
  var user_key = req.query.user_key;
  var uid = req.query.uid;

  /* dev - console.log(ref.child(`rooms/${room_key}/paticipants/${user_key}`));
  console.log(`rooms/${room_key}/participants/${user_key}`); */
  ref.child(`rooms/${room_key}/participants/${user_key}`).remove()
    .then((value) => {
      // Successfuly removed user from room
      console.log('success: ' + value);
      // Delete current user
      admin.auth().deleteUser(uid)
      res.send(value);
    })
    .catch((error) => {
      // An Error occured
      console.log('failed: ' + error);
      res.send(error);
    });
})

// TBD
app.post('/makeHost', (req, res) => {
  uid = req.body.uid;
  console.log(uid);
  // Set admin privilege on the user corresponding to uid.

  admin.auth().setCustomUserClaims(uid, { host: true }).then(() => {
    // The new custom claims will propagate to the user's ID token the
    // next time a new one is issued.
  });

  res.send();
})

////* END - DB handlers *////
////* END - Firebase handlers *////

const PORT = process.env.PORT || 5000; // Get port

// Set server to listen on PORT
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
