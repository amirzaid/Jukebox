//import { access_token, refresh_token } from './main.js';
var access_token = ''; // Host's access-token
var refresh_token = ''; // Host's refresh-token
var headers = { 'Authorization': 'Bearer ' + access_token }; // Headers
var interval;

function getHeader() {
  return headers;
}

function getAccessToken() {
  console.log('amir test');
  console.log(refresh_token);
  console.log(access_token);
  // Obtain new access token
  $.ajax({
    url: '/refresh_token',
    data: { 'refresh_token': refresh_token },
    success: function (data) {
      access_token = data.access_token;
      headers = { 'Authorization': 'Bearer ' + access_token }; // Headers
      console.log('new access_token: ' + access_token);
      //clearInterval(interval);
      // Update interval
      /* interval = setInterval(() => {
        console.log('amir: ' + headers.Authorization);
        checkIfPlaying(playerURL, headers, player, playPauseBtn);
        recentlyPlayed(headers);
      }, 5000, headers); */
    }
  })
}

// Ajax error catcher
$(document).ajaxError(function (event, request, settings) {
  alert(request.status + " - Error requesting page " + settings.url);
  console.log(event);
  console.log(request);
  console.log(settings);

  // Unauthorized access
  if (request.status == 401) {
    console.log('access-token expired');
    getAccessToken();
    //clearInterval(interval);
  }
});

// Check if device is playing
function checkIfPlaying(playerURL, headers, player, playPauseBtn) {
  console.log(playerURL);
  console.log('headers: ' + JSON.stringify(headers));
  var currPlaying = document.querySelector('#currPlaying');
  var marquee = document.querySelector('#currPlaying marquee');
  var artwork = document.querySelector('#navbar img');

  $.ajax({
    method: 'GET',
    url: playerURL + '/currently-playing',
    headers: headers,
    success: function (response) {
      //console.log(response);
      var playerStatus = JSON.parse(JSON.stringify(response));
      player.isPlaying = playerStatus.is_playing;
      //console.log(player.isPlaying);
      player.isPlaying ? playPauseBtn.setAttribute('name', 'pause-outline') : playPauseBtn.setAttribute('name', 'play-outline');
      marquee.innerHTML = playerStatus.item.name + ' - ' + playerStatus.item.artists[0].name;
      artwork.src = playerStatus.item.album.images[0].url;
      //document.body.style.backgroundImage = "url(" + artwork.src + ")";

      var colorThieff = new ColorThief();
      var sourcImage = document.getElementById('image'); //('currTrackArtwork')
      sourcImage.src = document.getElementById('currTrackArtwork').src;
      $('#image').one('load', () => {
        //console.log(document.getElementById('image').src);
        //console.log('color:' + colorThieff.getColor(sourcImage));
        //var bgColor = colorThieff.getColor(sourcImage);
        // Change body background color to track artwork color
        document.body.animate([
          { backgroundColor: `rgb(${colorThieff.getColor(sourcImage)})` }
        ], {
          duration: 2000,
          fill: "forwards"
        });
      });
    }
  })
}

// Get Available Devices
function getDevices(headers, curr_device_id, devicesDropDown) {
  $.ajax({
    method: 'GET',
    url: 'https://api.spotify.com/v1/me/player/devices',
    headers: headers,
    success: (response) => {
      var devices = JSON.parse(JSON.stringify(response));
      devices.devices.forEach(device => {
        var newLi = document.createElement('a'); // I know it's a tag
        newLi.classList.add('dropdown-item');
        newLi.innerHTML = device.type + ' - ' + device.name;
        newLi.addEventListener('click', () => {
          curr_device_id = device.id;
          //console.log(device.id)
          //console.log(device.name)
          document.querySelector('#currDevice').innerHTML = device.name;
        });
        devicesDropDown.appendChild(newLi);
      });
    },
    error: (e) => {
      if (e.status == '401') {
        window.location.replace('/refresh_token')
      }
    }
  })
}

// Get Recently-Played
function recentlyPlayed(headers, username) {
  $.ajax({
    method: 'GET',
    url: 'https://api.spotify.com/v1/me/player/recently-played',
    headers: headers,
    data: {
      'limit': '20'
    },
    success: (response) => {
      var recently_played = JSON.parse(JSON.stringify(response));
      var tbl = document.querySelector('#songTbl'); // Get table element
      var prevPlayIdx = document.querySelector('#previouslyPlayedRow').rowIndex;
      var currIdx = prevPlayIdx; // Current last index in table
      //console.log(prevPlayIdx);
      //console.log(tbl.rows[prevPlayIdx + 1]);
      while (tbl.rows[prevPlayIdx + 1] != null) {
        tbl.deleteRow(prevPlayIdx + 1);
      }

      recently_played.items.forEach(track => {
        var track_name = track.track.name;
        var track_artist = track.track.artists[0].name;

        // Add song to table
        var row = tbl.insertRow(currIdx + 1);
        currIdx++;
        //console.log(prevPlayIdx + 1);
        row.classList.add('table-secondary')
        var trackNameCell = row.insertCell(0);
        var trackArtistCell = row.insertCell(1);
        var requestedByCell = row.insertCell(2);

        trackNameCell.innerHTML = track_name;
        trackArtistCell.innerHTML = track_artist;
        requestedByCell.innerHTML = username;
      })
    },
    error: (() => {
      getAccessToken();
    })
  })
}

// Add track to queue
function addTrackToQueue(headers, username) {
  var userId = '';
  var searchItem = document.querySelector('#searchItem').value;
  // Clear search
  document.querySelector('#searchItem').value = '';
  // Focus on search
  document.querySelector('#searchItem').focus();

  // Search Song
  $.ajax({
    method: "GET",
    url: "https://api.spotify.com/v1/search",
    headers: headers,
    data: {
      "q": searchItem,
      "type": "track",
    },
    success: function (response) {
      // Get artist name
      console.log(response);
      var search = JSON.parse(JSON.stringify(response));
      var artistName = search.tracks.items[0].artists[0].name;
      var trackName = search.tracks.items[0].name;
      var trackURI = search.tracks.items[0].uri;
      //console.log(trackURI); // Dev

      // Add song to table
      var tbl = document.querySelector('#songTbl'); // Get table element
      var row = tbl.insertRow(1);
      var trackNameCell = row.insertCell(0);
      var trackArtistCell = row.insertCell(1);
      var requestedByCell = row.insertCell(2);
      //var trackArtwork = document.createElement('img');
      //trackArtwork.setAttribute('src', search.tracks.items[0].artists[0].images[0].url)
      trackNameCell.innerHTML = trackName;
      trackArtistCell.innerHTML = artistName;
      requestedByCell.innerHTML = username;

      // Add song to queue - Working weird
      $.ajax({
        method: 'POST',
        url: 'https://api.spotify.com/v1/me/player/queue?uri=' + trackURI,
        headers: headers//,
        //data: {
        //  "uri": trackURI,
        //  "device": curr_device_id
        //}
      })
    }
  });
}

// Play / Pause player
function PlayPausePlayer(headers, curr_device_id, playerURL, player) {
  var playPauseURL = playerURL + (player.isPlaying ? '/pause' : '/play');
  console.log(player.isPlaying);
  console.log(playPauseURL);
  $.ajax({
    method: 'PUT',
    url: playPauseURL,
    headers: headers,
    data: {
      "device_id": curr_device_id
    },
    // Needs to wait a second, otherwise return the same state
    success: setTimeout(function () {
      checkIfPlaying(playerURL, headers, player, playPauseBtn);
    }, 1000)
  })
}

// Skip back / forward
function skip(skipURL, headers, curr_device_id, playPauseBtn, playerURL, player) {
  //console.log(skipURL);
  $.ajax({
    method: 'POST',
    url: skipURL,
    headers: headers,
    data: {
      "device_id": curr_device_id
    },
    // Needs to wait a second, otherwise return the same state
    success: setTimeout(function () {
      checkIfPlaying(playerURL, headers, player, playPauseBtn);
    }, 1000)
  })
}

//export { checkIfPlaying, getDevices, recentlyPlayed, addTrackToQueue, PlayPausePlayer, skip };