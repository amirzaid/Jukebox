//import { access_token, refresh_token } from './main.js';
var access_token = ''; // Host's access-token
var refresh_token = ''; // Host's refresh-token
var headers = { 'Authorization': 'Bearer ' + access_token }; // Headers
var interval;
var loader = $('.loader-wrapper');

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
  /* alert(request.status + " - Error requesting page " + settings.url);
  console.log(event);
  console.log(request);
  console.log(settings); */
  loader.show(); //Loading...

  // Unauthorized access
  if (request.status == 401) {
    console.log('access-token expired');
    getAccessToken();
    //clearInterval(interval);
  }
});

// Convert rgb string to hex string
function rgb2Hex(color) {
  rgb = String(color).split(',');
  var hex = rgb.map((x) => {             //For each array element
    x = parseInt(x).toString(16);      //Convert to a base16 string
    return (x.length == 1) ? "0" + x : x;  //Add zero if we get only one character
  })
  hex = "#" + hex.join(""); // Join to hex format
  return hex;
}

// Check if device is playing
function checkIfPlaying(playerURL, headers, player, playPauseBtn) {
  console.log(playerURL);
  console.log('headers: ' + JSON.stringify(headers));
  var artwork = document.querySelector('#artwork');

  $.ajax({
    method: 'GET',
    url: playerURL + '/currently-playing',
    headers: headers,
    success: function (response) {
      //console.log(response);
      var playerStatus = JSON.parse(JSON.stringify(response));
      player.isPlaying = playerStatus.is_playing;
      //console.log(player.isPlaying);
      player.isPlaying ? playPauseBtn.setAttribute('name', 'pause') : playPauseBtn.setAttribute('name', 'play');
      document.querySelector('#track-name').innerHTML = playerStatus.item.name;
      document.querySelector('#artist-name').innerHTML = playerStatus.item.artists[0].name;
      artwork.src = playerStatus.item.album.images[0].url;

      var colorThieff = new ColorThief();
      var sourcImage = document.getElementById('image');
      sourcImage.src = document.getElementById('artwork').src;
      if (player.isPlaying) {
        document.getElementById('artwork').style.width = "328px";
        document.getElementById('artwork').style.height = "328px";
      }
      else {
        document.getElementById('artwork').style.width = "234px";
        document.getElementById('artwork').style.height = "234px";
      }
      $('#image').one('load', () => {
        // Change body background color to track artwork color
        // linear-gradient
        /* $('body').css({ 'background': `-webkit-linear-gradient(${rgb2Hex(colorThieff.getColor(sourcImage))},  #383838 `, 'background-attachment': 'fixed' }); */

        // one color
        document.body.animate([
          {
            backgroundColor: `rgb(${colorThieff.getColor(sourcImage)})`
          }
        ], {
          duration: 2000,
          fill: "forwards"
        });
      });
      loader.hide();
    }
  })
}

// Add track to queue
function addTrackToQueue(headers, username) {
  var userId = '';
  var searchItem = document.querySelector('.input').value;
  // Clear search
  document.querySelector('.input').value = '';
  // Focus on search
  document.querySelector('.input').focus();

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
      var trackURI = search.tracks.items[0].uri;
      //console.log(trackURI); // Dev

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

      /* $('.popup').css({ 'right': '10px', 'opacity': '1' }); */

      /* const t1 = new TimelineMax();
      t1.fromTo(document.querySelector('.popup'), 0.6, { right: '-165px', opacity: '0', ease: Power2.easeInOut }, { right: '10px', opacity: '1', ease: Power2.easeInOut }); */

      /* var tl = new TimelineMax();

      console.log('animation test');
      tl.from(document.querySelector('.popup'), 1.0, { right: '-165px' });
      tl.to(document.querySelector('.popup'), 1.0, { right: '10px' }); */

      $(".popup").addClass('animated');
      setTimeout(() => {
        $(".popup").removeClass('animated');
      }, 5000);
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