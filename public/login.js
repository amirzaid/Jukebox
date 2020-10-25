$(function () {
    // Your web app's Firebase configuration
    var firebaseConfig = {
        apiKey: "AIzaSyDuqbt9UjGjQbie1bUW-XSRsCrdD0dO010",
        authDomain: "jukebox-d932d.firebaseapp.com",
        databaseURL: "https://jukebox-d932d.firebaseio.com/",
        projectId: "jukebox-d932d",
        storageBucket: "jukebox-d932d.appspot.com",
        messagingSenderId: "831237212121",
        appId: "1:831237212121:web:61cb4cac1c030340287bc8",
    };

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);

    /* Obtains parameters from the hash of the URL
        * @return Object
        */
    function getHashParams() {
        var hashParams = {};
        var e, r = /([^&;=]+)=?([^&;]*)/g,
            q = window.location.hash.substring(1);
        while (e = r.exec(q)) {
            hashParams[e[1]] = decodeURIComponent(e[2]);
        }
        return hashParams;
    };

    var params = getHashParams();
    //console.log(params);

    var params = getHashParams();
    //var access_token = params.access_token,
    //  refresh_token = params.refresh_token,
    //  expires_in = params.expires_in,
    //  error = params.error;

    const nickname = $('[name = nickname]').hide();
    const joinBtn = $('#join').hide();
    const roomId = $('[name = roomid]');
    const nextBtn = $('#next');
    const loader = $('.loader-wrapper').hide();
    const room_hash_value = params.roomid;

    // A room is defined
    function hideRoomID() {
        nickname.show();
        roomId.hide();
        joinBtn.show();
        nextBtn.hide();
    };

    nextBtn.on('click', () => {
        if (roomId.val() == '')
            alert('RoomID cannot be empty');
        else {
            loader.show(); //Loading...
            // Check if room id is valid
            $.ajax({
                method: 'GET',
                url: `/checkroom/?roomid=${roomId.val()}`,
                success: (response) => {
                    loader.hide();
                    console.log(response);
                    window.location = `http://localhost:5000/#roomid=${response}`;
                    window.location.reload();
                },
                error: (response) => {
                    loader.hide();
                    alert('No existing room with this roomID');
                }
            });
        }
    });

    $('#login-form').on('submit', function (event) {
        event.preventDefault();
        alert('logged-in');
        firebase.auth().signInAnonymously();
        /* firebase.auth().signInAnonymously().then(() => {
            alert(firebase.auth().currentUser);
        }) */;
        return true;
    })

    //console.log(window.location.hash[0]);
    if (window.location.hash[0] == '#') {
        $('#spotify-login').hide();
        roomId.val(room_hash_value);
        hideRoomID();
    }

    /* $('spotify-login').on('click', () => {
        $.ajax({
            method: 'GET',
            url: '/login',
            success: (response) => {
                firebase.auth().signInAnonymously(); // Create host user
                // Add host claim 
                $.ajax({
                    method: 'POST',
                    url: '/addCustomClaim',
                    data: {
                        'uid': firebase.auth().currentUser
                    }
                })
            }
        })
    }); */

    //var hash = window.location.hash; // Get hash params
    //var access_token = hash.substring(hash.indexOf('=') + 1, hash.indexOf('&')); // Get substring from = (after access token header) and up to & before refresh token header
    //document.querySelector('#access-token').setAttribute('value', access_token); // Set access-token

    //document.querySelector('#access-token').setAttribute('value', access_token); // Set access-token
    //document.querySelector('#refresh-token').setAttribute('value', refresh_token); // Set refresh-token
    //console.log(access_token);
    //console.log(refresh_token);
    //console.log(expires_in);

    // Obtain new access token
    document.getElementById('obtain-new-token').addEventListener('click', function () {
        $.ajax({
            url: '/refresh_token',
            data: {
                'refresh_token': refresh_token
            }
        }).done(function (data) {
            console.log(data.access_token);
            console.log(data);
            //  access_token = data.access_token;
            //  oauthPlaceholder.innerHTML = oauthTemplate({
            //    access_token: access_token,
            //    refresh_token: refresh_token
            //  });
        });
    }, false);

    //(function () {
    //  console.log('amir');
    //
    //  /**

    //
    //  var params = getHashParams();
    //  var access_token = params.access_token,
    //    refresh_token = params.refresh_token,
    //    error = params.error;
    //
    //  console.log(refresh_token);
    //
    //  // Obtain new access token
    //  document.getElementById('obtain-new-token').addEventListener('click', function () {
    //    $.ajax({
    //      url: '/refresh_token',
    //      data: {
    //        'refresh_token': refresh_token
    //      }
    //    }).done(function (data) {
    //      access_token = data.access_token;
    //      oauthPlaceholder.innerHTML = oauthTemplate({
    //        access_token: access_token,
    //        refresh_token: refresh_token
    //      });
    //    });
    //  }, false);
    //});
})