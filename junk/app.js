var client_id = '677e9c59932b4ef3842105a3d342bb0f'; // Your client id
var client_secret = '8f7b02fcd4534e0da05d3c77216139a4'; // Your secret
var redirect_uri = 'http://localhost:8888/callback'; // Your redirect uri


(function () {
    // Your web app's Firebase configuration
    const firebaseConfig = {
      apiKey: "AIzaSyDuqbt9UjGjQbie1bUW-XSRsCrdD0dO010",
      authDomain: "jukebox-d932d.firebaseapp.com",
      databaseURL: "https://jukebox-d932d.firebaseio.com/",
      projectId: "jukebox-d932d",
      storageBucket: "jukebox-d932d.appspot.com",
      messagingSenderId: "831237212121",
      appId: "1:831237212121:web:61cb4cac1c030340287bc8"
    };
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);

    // Get elements
    const btnLogin = document.getElementById('btnLogin');
    const btnLogout = document.getElementById('btnLogout');
    const btnLoginSpotify = document.getElementById('btnLoginSpotify');
  
    // Http
    var http = require('http');

    // Express
    const express = require('express');
    //import * as express from 'express';
    const app = express();

    // Click event listener
    btnLogin.addEventListener('click', e => {
      console.log(firebase.auth().signInAnonymously());
    });
  
    // Click logout event listener
    btnLogout.addEventListener('click', e => {
      firebase.auth().signOut();
    });
  
    // Auth listener
    firebase.auth().onAuthStateChanged(firebaseUser => {
      console.log(firebaseUser);
      if (firebaseUser) {
        btnLogout.classList.remove('d-none');
        console.log('logged in');
      }
      else {
        btnLogout.classList.add('d-none');
        console.log('logged out');
      }
    });
  
    // Click Spotify event listener
    btnLoginSpotify.addEventListener('click', e => {
      console.log('test');
      app.get('/login', function (req, res) {
        var scopes = 'user-read-private user-read-email';
        res.redirect('https://accounts.spotify.com/authorize' +
          '?response_type=code' +
          '&client_id=' + my_client_id +
          (scopes ? '&scope=' + encodeURIComponent(scopes) : '') +
          '&redirect_uri=' + encodeURIComponent(redirect_uri));
      });
    });
  
  }());
  
  
  
  //var Spotify = require('spotify-web-api-js');
  //var s = new Spotify();
  
  var spotifyApi = new SpotifyWebApi();
  spotifyApi.setAccessToken('BQAW7dnzYQnXHCZLXwUh6cPHfHMJXsT0uj38fByKdNUGdhe_eLSZmCGmp5EKSM0swz1OB4su6EIk8wcs6xF7hatQGgVbl4FIDpV5CzpuucMK--hVxvCiB2isK1TmDNoH3X8soPGJ58HCY1zbsz3TVCZPpdGzXBfia7bvF3NCMhqaoXCc');
  
  function get_elvis_data() {
    getMe
  
    // get Elvis' albums, passing a callback. When a callback is passed, no Promise is returned
    spotifyApi.getArtistAlbums('43ZHCT0cAZBISjO8DG9PnE', function (err, data) {
      if (err) console.error(err);
      else console.log('Artist albums', data);
    });
  
    // get Elvis' albums, using Promises through Promise, Q or when
    spotifyApi.getArtistAlbums('43ZHCT0cAZBISjO8DG9PnE').then(
      function (data) {
        console.log('Artist albums', data);
      },
      function (err) {
        console.error(err);
      }
    );
  }
  
  
  
  function writeUserData() {
    var song = document.getElementById("searchBar");
    var songName = song.value;
  
    //console.log('amir');
    //alert("hi");
    var database = firebase.database();
    var ref = database.ref('songs');
    var data = {
      name: songName
    }
    console.log(data);
    console.log(ref);
    //ref.push().set(data);
    //console.log(ref.push(data));
  
    ref.push().set(data, function (error) {
      if (error) {
        alert("Data could not be saved." + error);
      } else {
        alert("Data saved successfully.");
      }
    });
  }
  
  
  
  