require("dotenv").config();
const express = require("express");
const axios = require("axios");
const app = express();
const SpotifyWebApi = require("spotify-web-api-node");

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

app.get("/", async (req, res) => {
  const scopes = [
    "user-read-private",
    "user-read-email",
    "user-top-read",
    "playlist-modify-private",
    "playlist-modify-public",
  ];
  const state = "some-state-of-my-choice";

  // Create the authorization URL
  const authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);

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
    const trackIds = [];
    const artistIds = [];
    const minTempo = 158;
    const maxTempo = 162;
    const doubledMinTempo = Math.round(minTempo / 2);
    const doubledMaxTempo = Math.round(maxTempo / 2);

    //First get some seed to the recommendations api

    // Get the user's top tracks
    const topTracksResponse = await spotifyApi.getMyTopTracks({ limit: 5 });
    trackIds.push(topTracksResponse.body.items.map((track) => track.id));

    // Get the user's recent tracks
    const recentArtists = await spotifyApi.getMyTopArtists({
      time_range: "short_term",
      limit: 5,
    });
    artistIds.push(recentArtists.body.items.map((ar) => ar.id));

    // Get recommendations
    const recommendations = await spotifyApi.getRecommendations({
      min_tempo: minTempo,
      max_tempo: maxTempo,
      seed_tracks: [trackIds],
      seed_artists: [artistIds],
      limit: 10,
    });

    // Ger doubled recommendations
    const doubledRecommendations = await spotifyApi.getRecommendations({
      min_tempo: doubledMinTempo,
      max_tempo: doubledMaxTempo,
      seed_tracks: [trackIds],
      limit: 10,
    });

    recommendations.body.tracks.push(...doubledRecommendations.body.tracks);

    //Create the object
    const filteredTrackUris = recommendations.body.tracks.map(
      (track) => `spotify:track:${track.id}`
    );

    // Create a playlist with the filtered tracks
    const playlist = await spotifyApi.createPlaylist(
      "Running playlist 160 bpm - Reco",
      {
        description: "running playlist",
        public: true,
      }
    );

    // Add tracks to the playlist
    await spotifyApi.addTracksToPlaylist(playlist.body.id, filteredTrackUris);

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
