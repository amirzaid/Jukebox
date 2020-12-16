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

    const nickname = $('[name = nickname]').hide();
    const joinBtn = $('#join').hide();
    const roomId = $('[name = roomid]');
    const nextBtn = $('#next');
    const loader = $('.loader-wrapper').hide();
    const logout = $('#logout').hide();
    const spotifyBtn = $('#spotify-login');
    const room_hash_value = params.roomid;
    var cookies = document.cookie;
    var current_user = firebase.auth().currentUser;

    // A room is defined
    function hideRoomID() {
        nickname.show();
        roomId.hide();
        joinBtn.show();
        nextBtn.hide();
    };

    // Close help button
    $('.close-help-text').on('click', () => {
        $('.help-text').css('display', 'none');
    })

    function map_cookies() {
        cookies = document.cookie
            .split(';')
            .map(cookie => cookie.split('='))
            .reduce((accumulator, [key, value]) =>
                ({ ...accumulator, [key.trim()]: decodeURIComponent(value) }),
                {});
    }

    // Redirect client if logged-in
    firebase.auth().onAuthStateChanged(firebaseUser => {
        if (firebaseUser) {
            if (cookies) {
                map_cookies();
            }
            console.log('cookies: ' + document.cookie);
            current_user = firebaseUser;
            logout.show();
            // Is host now
            firebase.auth().currentUser.getIdTokenResult()
                .then((idTokenResult) => {
                    console.log(idTokenResult);
                    // Confirm the user is a Host.
                    if (!!idTokenResult.claims.host) {
                        // Show admin UI.
                        /* console.log('user is host');
                        console.log(roomId); */
                    } else {
                        // Show regular user UI.
                        console.log('user is not a host');
                    }
                    // If input fields are full save them in a cookie and redirect
                    if (roomId.val() && nickname.val()) {
                        // reset cookies
                        document.cookie = "roomid=; expires=Thu, 01 Jan 1970 00:00:00 UTC";
                        document.cookie = "nickname=; expires=Thu, 01 Jan 1970 00:00:00 UTC";
                        // set cookies
                        document.cookie = `roomid=${roomId.val()}`;
                        document.cookie = `nickname=${nickname.val()}`;
                        window.location = `/jukebox.html?roomid=${roomId.val()}&nickname=${nickname.val()}`;
                    }
                    // One or more input field are not full
                    else {
                        // If cookies available - redirect
                        if (cookies.roomid && cookies.nickname) {
                            /* alert('User logged in - Redirecting.'); */
                            $('.help-text').css('display', 'flex');
                            window.location = `/jukebox.html?roomid=${cookies.roomid}&nickname=${cookies.nickname}`;
                        }
                    }
                })
                .catch((error) => {
                    console.log(error);
                });
        }
        else {
            alert('User disconnected.');
            logout.hide();
            spotifyBtn.show();
        }
    })

    nextBtn.on('click', () => {
        if (roomId.val() == '')
            alert('RoomID cannot be empty.');
        else {
            loader.show(); //Loading...
            // Check if room id is valid
            $.ajax({
                method: 'GET',
                url: `/checkroom/?roomid=${roomId.val()}`,
                success: (response) => {
                    loader.hide();
                    console.log(response);
                    window.location = `/#roomid=${response}`;
                    window.location.reload();
                },
                error: (response) => {
                    loader.hide();
                    alert('No existing room with this roomID.');
                }
            });
        }
    });

    spotifyBtn.on('click', function (event) {
        firebase.auth().signInAnonymously();
        current_user = firebase.auth().currentUser;
        // Wait for user to be logged in
        setTimeout(() => {
            if (current_user) {
                console.log(current_user);
                var uid = current_user.uid;
                $.ajax({
                    method: 'POST',
                    url: '/makeHost',
                    data: {
                        'uid': uid
                    },
                    success: (response) => {
                        console.log(current_user);
                        console.log('makehost done');
                        // Is host now
                    }
                })
            }
        }, 1000);
        window.location.href = '/login';
    })

    $('#login-form').on('submit', function (event) {
        event.preventDefault();
        // If disconnected - log user anonymously and event listener will redirect
        if (!current_user) {
            firebase.auth().signInAnonymously();
        }
        // If logged-in - refresh to trigger event listener
        else {
            location.reload();
        }
        /* alert('logged-in');
        console.log(current_user); */
        //return true;
    })

    //console.log(window.location.hash[0]);
    if (window.location.hash[0] == '#') {
        $('#spotify-login').hide();
        roomId.val(room_hash_value);
        hideRoomID();
    }

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
})