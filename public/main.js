//import { response } from 'express';

//const { head } = require("request");

//import { checkIfPlaying, getDevices, recentlyPlayed, addTrackToQueue, PlayPausePlayer, skip } from './spotifyRequests.js';
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

    var hash = window.location.search; // Get hash params
    const urlParams = new URLSearchParams(hash);
    var nickname = urlParams.get('nickname'); // User's nickname
    var roomid = urlParams.get('roomid'); // Current room ID

    var user_db_key = ''; // User's key in room's db
    var room_db_key = ''; // Room's key in db
    var user; //Current firebase user

    // Ask user before leaving page - displayed only after user interacted with the page
    window.addEventListener('beforeunload', (ev) => {
        // User wants to leave page
        ev.returnValue = 'Are you sure?';
    });

    window.addEventListener('unload', () => {
        //user?.delete(); //delete the current user
        $.ajax({
            method: 'POST',
            url: '/removeUserFromRoom',
            data: {
                'room_key': room_db_key,
                'user_key': user_db_key
            },
            success: (response) => {
                // Removed user
            },
            error: (err) => {
                // Couldn't remove user
            }
        })
        firebase.auth().signOut();
        console.log('user signed out');
    });

    firebase.auth().onAuthStateChanged(firebaseUser => {
        console.log(firebaseUser);
        if (firebaseUser) { //Check if user logged in
            console.log('logged in');
            console.log(firebaseUser.uid)
            // Add user to room's participants
            $.ajax({
                method: 'POST',
                url: '/addUserToRoom',
                data: {
                    'uid': firebaseUser.uid,
                    'roomid': roomid
                },
                success: (response) => {
                    // User joined the room
                    access_token = response.access_token;
                    refresh_token = response.refresh_token;
                    user_db_key = response.user_key
                    room_db_key = response.room_key;
                    headers = { 'Authorization': 'Bearer ' + access_token }; // Headers
                    console.log('access-token: ' + access_token);
                    console.log('refresh-token: ' + refresh_token);
                    console.log('user_key-token: ' + user_db_key);
                    console.log('room_key-token: ' + room_db_key);
                    main();
                },
                error: (err) => {
                    // Can't add user to room
                    alert(`Couldn't sign user to room - ${err}`);
                }
            });

            // Update user's display name
            firebaseUser.updateProfile({
                displayName: nickname
            }).then(() => {
                // Update successful.
                console.log(firebaseUser);
            }).catch(() => {
                // An error happened.
            })
        }
        else { //If not - redirect to login page
            console.log('logged out');
            alert('User disconnected - Please log in')
            //firebase.auth().signInAnonymously();
            window.location = '/';
        }
    })

    console.log('user: ' + user);
    function main() {
        // Spotify Requests
        //var refresh_token = urlParams.get('refresh_token');

        var devicesDropDown = document.querySelector('#deviceDrop'); // Devices menu
        var curr_device_id; // Currently active device
        var playerURL = 'https://api.spotify.com/v1/me/player'; // Player endpoint url
        var player = { isPlaying: false }; // Is currently playing
        const abtn = document.querySelector('#addBtn'); // Add song button
        var skipBackBtn = document.querySelector('#skipBack'); // Skip back button
        var skipForwardBtn = document.querySelector('#skipForward'); // Skip forward button
        var playPauseBtn = document.querySelector('#playPauseBtn');
        var logo = ` <svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-collection-play-fill"
    fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path fill-rule="evenodd"
        d="M1.5 14.5A1.5 1.5 0 0 1 0 13V6a1.5 1.5 0 0 1 1.5-1.5h13A1.5 1.5 0 0 1 16 6v7a1.5 1.5 0 0 1-1.5 1.5h-13zm5.265-7.924A.5.5 0 0 0 6 7v5a.5.5 0 0 0 .765.424l4-2.5a.5.5 0 0 0 0-.848l-4-2.5zM2 3a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 0-1h-11A.5.5 0 0 0 2 3zm2-2a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 0-1h-7A.5.5 0 0 0 4 1z" />
</svg>`;


        // Set room's name
        document.querySelector('.navbar-brand').innerHTML = `host's name ${logo}`;

        // Get avaiable devices
        getDevices(headers, curr_device_id, devicesDropDown);

        // Update list every 5 seconds
        setInterval(() => {
            headers = getHeader();
            console.log('amir: ' + headers.Authorization);
            checkIfPlaying(playerURL, headers, player, playPauseBtn);
            recentlyPlayed(headers);
        }, 5000);

        // Hover Events

        // Skip Back
        /*skipBackBtn.addEventListener('mouseenter', () => {
            skipBackBtn.setAttribute('name', 'play-skip-back-circle-outline');
        })
        skipBackBtn.addEventListener('mouseleave', () => {
            skipBackBtn.setAttribute('name', 'play-skip-back-outline');
        })
        // Play / Pause
        playPauseBtn.addEventListener('mouseenter', () => {
            console.log(player.isPlaying);
            player.isPlaying ? playPauseBtn.setAttribute('name', 'pause-circle-outline') :
                playPauseBtn.setAttribute('name', 'play-circle-outline')
        })
        playPauseBtn.addEventListener('mouseleave', () => {
            player.isPlaying ? playPauseBtn.setAttribute('name', 'pause-outline') :
                playPauseBtn.setAttribute('name', 'play-outline')
        })
        // Skip Forward
        skipForwardBtn.addEventListener('mouseenter', () => {
            skipForwardBtn.setAttribute('name', 'play-skip-forward-circle-outline');
        })
        skipForwardBtn.addEventListener('mouseleave', () => {
            skipForwardBtn.setAttribute('name', 'play-skip-forward-outline');
        })*/

        // End - hover

        // Add Song to Queue
        abtn.addEventListener('click', () => {
            addTrackToQueue(headers, nickname);
        })

        // Play / Pause Playback
        playPauseBtn.addEventListener('click', () => {
            PlayPausePlayer(headers, curr_device_id, playerURL, player);
        })

        // Skip back track
        skipForwardBtn.addEventListener('click', () => {
            skip(playerURL + '/next', headers, curr_device_id, playPauseBtn, playerURL, player);
        });

        // Skip forward track
        skipBackBtn.addEventListener('click', () => {
            skip(playerURL + '/previous', headers, curr_device_id, playPauseBtn, playerURL, player);
        });

        // Room handeling
        const socket = io();

        socket.on('message', message => {
            console.log(message);
        });
    }
});

//export { access_token, refresh_token };