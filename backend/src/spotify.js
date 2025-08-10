require("dotenv").config();
const express = require("express");
const axios = require("axios");
const app = express();
const SpotifyWebApi = require("spotify-web-api-node");
const SpotifyService = require("./spotifyService");

app.listen(8080, () => {
  console.log("App is listening on port 8080!");
});

axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  redirectUri: "http://localhost:8080/callback",
});

const spotifyService = new SpotifyService(spotifyApi);

app.get("/", async (req, res) => {
  const scopes = [
    "user-read-private",
    "user-read-email",
    "user-top-read",
    "playlist-modify-private",
    "playlist-modify-public",
    "user-library-read",
  ];
  const state = "some-state-of-my-choice";

  // Create the authorization URL
  const authorizeURL = spotifyService.getAuthorizationURL(scopes, state);

  res.send("<a href='" + authorizeURL + "'>Sign in</a>");
});

app.get("/callback", async (req, res) => {
  if (isEmpty(spotifyApi.getAccessToken())) {
    const code = req.query.code;

    // Retrieve an access token and a refresh token
    spotifyApi.authorizationCodeGrant(code).then(
      function (data) {
        // Set the access token on the API object to use it in later calls
        spotifyApi.setAccessToken(data.body["access_token"]);
        spotifyApi.setRefreshToken(data.body["refresh_token"]);

        res.send(
          "<a href='/home'>Create 160bpm playlist including doubled BPM (80bpm) </a>"
        );
      },
      function (err) {
        console.log("Something went wrong!", err);
      }
    );
  } else {
    spotifyApi.refreshAccessToken().then(
      function (data) {
        console.log("The access token has been refreshed!");

        //save the new accessToken
        spotifyApi.setAccessToken(data.body["access_token"]);

        res.send(
          "<a href='/home'>Create 160bpm playlist including doubled BPM (80bpm) </a>"
        );
      },
      function (err) {
        console.log("Could not refresh access token", err);
      }
    );
  }
});

app.get("/home", async (req, res) => {
  try {
    // Check if Spotify access token is empty
    if (isEmpty(spotifyApi.getAccessToken())) {
      return res.redirect("/");
    }

    const tempo = 160

    spotifyService.createPlaylistBasedOnBPM(tempo);

    res.send("Access your spotify and enjoy your running");
  } catch (error) {
    console.error("Something went wrong!", error);
    res.status(500).send("Something went wrong!");
  }
});

function isEmpty(value) {
  if (Array.isArray(value)) {
    for (var i = 0; i < value.length; i++) {
      if (value[i]) {
        return false;
      }
    }
    return true;
  } else {
    if (
      value === undefined ||
      value === null ||
      value === "" ||
      JSON.stringify(value) === "{}"
    ) {
      return true;
    }
    return false;
  }
}
