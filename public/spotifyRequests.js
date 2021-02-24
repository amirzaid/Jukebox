var access_token = ''; // Host's access-token
var refresh_token = ''; // Host's refresh-token
var headers = { 'Authorization': 'Bearer ' + access_token }; // Headers
var interval;
var loader = $('.loader-wrapper');

// Used in main
function getHeader() {
  return headers;
}

function getAccessToken() {
  /* console.log(refresh_token);
  console.log(access_token); */
  // Obtain new access token
  $.ajax({
    url: '/refresh_token',
    data: { 'refresh_token': refresh_token },
    success: function (data) {
      access_token = data.access_token;
      headers = { 'Authorization': 'Bearer ' + access_token }; // Headers
      console.log('new access_token: ' + access_token);
    }
  })
}

// Ajax error catcher
$(document).ajaxError(function (event, request, settings) {
  alert(request.status + " - Error requesting page " + settings.url);
  /* console.log(event);
  console.log(request);
  console.log(settings); */
  loader.show(); //Loading...

  // Unauthorized access
  if (request.status == 401) {
    console.log('access-token expired');
    /* getAccessToken(); */
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
function checkIfPlaying(player, playPauseBtn) {
  /* function checkIfPlaying(playerURL, headers, player, playPauseBtn) { */
  var artwork = $('#artwork');

  $.ajax({
    method: 'GET',
    url: '/currently_playing',
    success: function (response) {
      var playerStatus = response.body;
      console.log(playerStatus);
      player.isPlaying = playerStatus.is_playing; // Playing status
      // If playing - display pause button | If paused - display play button
      player.isPlaying ? playPauseBtn.attr('name', 'pause') : playPauseBtn.attr('name', 'play');
      /* player.isPlaying ? playPauseBtn.setAttribute('name', 'pause') : playPauseBtn.setAttribute('name', 'play'); */
      $('#track-name').text(playerStatus.item.name); // Track name element
      $('#artist-name').text(playerStatus.item.artists[0].name); // Track artist element
      artwork.attr('src', playerStatus.item.album.images[0].url); // Set artwork src url to current track url

      // Get album artwork theme colors
      var colorThieff = new ColorThief();
      var sourcImage = $('#image')
      sourcImage.attr('src', artwork.attr('src'))
      console.log(sourcImage[0]);
      if (player.isPlaying) {
        artwork.css('width', '328px');
        artwork.css('height', '328px');
      }
      else {
        artwork.css('width', '234px');
        artwork.css('height', '234px');
      }
      sourcImage.on('load', () => {
        // Change body background color to track artwork color

        // one color
        document.body.animate([
          {
            backgroundColor: `rgb(${colorThieff.getColor(sourcImage[0])})`
          }
        ], {
          duration: 2000,
          fill: "forwards"
        });
      });
      loader.hide();
    },
    error: (err) => console.log(err)
  })
}

// Add track to queue
function addTrackToQueue() {
  /* function addTrackToQueue(headers, username) { */
  var searchInput = $('.input')
  var searchItem = searchInput.val()
  // Clear search
  searchInput.val('')
  // Focus on search
  searchInput[0].focus()
  // Search Song
  $.ajax({
    method: "GET",
    url: "/search_track",
    data: { "searchItem": searchItem },
    success: function (response) {
      // Get artist name
      var search = response.body;
      var trackURI = search.tracks.items[0].uri;
      console.log(trackURI);

      // Add song to queue
      $.ajax({
        method: 'POST',
        url: '/add_track',
        data: jQuery.param({ 'trackURI': trackURI })
      })

      // Show popup
      $(".popup span").text("Queue updated");
      $(".popup").addClass('animated');
      setTimeout(() => {
        $(".popup").removeClass('animated');
      }, 5000);
    }
  });
}

// Play / Pause player
function PlayPausePlayer(curr_device_id, player) {
  /* function PlayPausePlayer(headers, curr_device_id, playerURL, player) { */
  var play_pause = player.isPlaying ? '/pause' : '/play';
  $.ajax({
    method: 'PUT',
    url: '/play_pause_player',
    data: {
      'play_pause': play_pause,
      'device_id': curr_device_id
    },
    // Needs to wait a second, otherwise return the same state
    success: setTimeout(function () {
      checkIfPlaying(player, playPauseBtn);
      /* checkIfPlaying(playerURL, headers, player, playPauseBtn); */
    }, 1000)
  })
}

// Skip back / forward
function skip(skipURL, curr_device_id, playPauseBtn, player) {
  /* function skip(skipURL, headers, curr_device_id, playPauseBtn, playerURL, player) { */
  $.ajax({
    method: 'POST',
    url: '/skip',
    data: {
      'skip_form': skipURL,
      'device_id': curr_device_id
    },
    // Needs to wait a second, otherwise return the same state
    success: setTimeout(function () {
      checkIfPlaying(player, playPauseBtn);
      /* checkIfPlaying(playerURL, headers, player, playPauseBtn); */
    }, 1000)
  })
}
