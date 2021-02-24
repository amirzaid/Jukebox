$(function () {
    var firebaseConfig = {};
    var uid = '' // Current user uid

    // Get firebase config
    function getFirebaseConfig() {
        return $.ajax({
            method: 'GET',
            url: '/firebase_config',
            success: (response) => {
                firebaseConfig = response
            }
        })
    }

    // Wait for firebase config to return
    getFirebaseConfig().then(res => {
        firebase.initializeApp(firebaseConfig);

        var hash = window.location.search; // Get hash params
        const urlParams = new URLSearchParams(hash);
        /* var nickname = urlParams.get('nickname'); */ // User's nickname - TBD
        var roomid = urlParams.get('roomid'); // Current room ID

        var user_db_key = ''; // User's key in room's db
        var room_db_key = ''; // Room's key in db
        var user; //Current firebase user

        // Copy given text to clipboard
        function copy2clipboard(str) {
            var copyText = document.createElement('textarea');
            copyText.value = str;
            document.body.appendChild(copyText);
            copyText.select();
            copyText.setSelectionRange(0, 99999); // For mobile
            document.execCommand('copy');
            document.body.removeChild(copyText);
        }
        // Help
        $('.help-popup').hide(); // Hide help box on default
        $('.help-btn').on('click', () => {
            $('.help-popup').css('display', 'flex');
            $('.help-text span').text(roomid);
        })
        // Close popup
        $('.close-help-text').on('click', () => {
            $('.help-popup').css('display', 'none');
        })
        // Copy roomid to clipboard
        $('.copy-roomid').on('click', () => {
            copy2clipboard($('.help-text span').text());
            $(".popup span").text("Copied to clipboard");
            $(".popup").addClass('animated');
            setTimeout(() => {
                $(".popup").removeClass('animated');
            }, 5000);
        })

        // Ask user before leaving page - displayed only after user interacted with the page
        window.addEventListener('beforeunload', (ev) => {
            // User wants to leave page
            ev.returnValue = 'Are you sure?'; // Not relevent 
        });

        // On page unload 
        window.addEventListener('unload', () => {
            // Remove user from room and delete user
            navigator.sendBeacon(`/removeUserFromRoom?room_key=${room_db_key}&user_key=${user_db_key}&uid=${uid}`)
        });

        firebase.auth().onAuthStateChanged(firebaseUser => {
            if (firebaseUser) { //Check if user logged in
                uid = firebaseUser.uid
                console.log('logged in');
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
                        user_db_key = response.user_key
                        room_db_key = response.room_key;
                        /* console.log('user_key-token: ' + user_db_key);
                        console.log('room_key-token: ' + room_db_key); */
                        main();
                    },
                    error: (err) => {
                        // Can't add user to room
                        alert(`Couldn't sign user to room - ${err}`);
                    }
                });

                // TBD - Update user's display name
                /* firebaseUser.updateProfile({
                    displayName: nickname
                }).then(() => {
                    // Update successful.
                    console.log(firebaseUser);
                }).catch(() => {
                    // An error happened.
                }) */
            }
            else { //If not - redirect to login page
                console.log('logged out');
                alert('User disconnected - Please log in')
                firebase.auth().signInAnonymously();
                window.location = '/';
            }
        })

        console.log('user: ' + user);
        function main() {
            var curr_device_id; // Currently active device
            var player = { isPlaying: false }; // Is currently playing
            const addTrackBtn = $('.search-bar .submit'); // Add song button
            var searchItem = $('.input');
            var skipBackBtn = $('#skipBack'); // Skip back button
            var skipForwardBtn = $('#skipForward'); // Skip forward button
            var playPauseBtn = $('#playPauseBtn');

            // Update list every 5 seconds
            setInterval(() => {
                checkIfPlaying(player, playPauseBtn);
            }, 5000);

            // Add Song to Queue
            addTrackBtn.on('click', () => {
                if (searchItem.val() != "")
                    addTrackToQueue();
            })

            // Play / Pause Playback
            playPauseBtn.on('click', () => {
                PlayPausePlayer(curr_device_id, player);
            })

            // Skip back track
            skipForwardBtn.on('click', () => {
                skip('/next', curr_device_id, playPauseBtn, player);
            });

            // Skip forward track
            skipBackBtn.on('click', () => {
                skip('/previous', curr_device_id, playPauseBtn, player);
            });
        }
    })
});
