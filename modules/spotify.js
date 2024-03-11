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
    "user-library-read",
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
    const filteredTrack = [];
    const tracks = [];

    // Get several tracks from the user first
    const savedTrack = await spotifyApi.getMySavedTracks({
      limit: 50,
    });

    const longTermTracks = await spotifyApi.getMyTopTracks({
      limit: 50,
      time_range: "long_term",
    });

    const mediumTermTracks = await spotifyApi.getMyTopTracks({
      limit: 50,
      time_range: "medium_term",
    });

    const shortTermTracks = await spotifyApi.getMyTopTracks({
      limit: 50,
      time_range: "short_term",
    });

    // Combined trakcs
    const combinedTracks = [
      ...longTermTracks.body.items,
      ...mediumTermTracks.body.items,
      ...shortTermTracks.body.items,
      ...savedTrack.body.items,
    ];

    combinedTracks.forEach((track) => {
      tracks.push(track.id);
    });

    const audioFeaturesFirst = await spotifyApi.getAudioFeaturesForTracks(
      tracks.slice(0, 100)
    );

    const audioFeaturesSecond = await spotifyApi.getAudioFeaturesForTracks(
      tracks.slice(100, 200)
    );

    const audioFeatures = [
      ...audioFeaturesFirst.body.audio_features,
      ...audioFeaturesSecond.body.audio_features,
    ];

    //filter by specific range of tempo
    audioFeatures.forEach((track) => {
      if (track.tempo >= minTempo && track.tempo <= maxTempo) {
        filteredTrack.push(track.uri);
      }
    });

    const recentArtists = await spotifyApi.getMyTopArtists({
      time_range: "short_term",
      limit: 2,
    });

    const topArtists = await spotifyApi.getMyTopArtists({
      time_range: "long_term",
      limit: 3,
    });

    const seedArtists = [...recentArtists.body.items, ...topArtists.body.items];
    const seedTracks = tracks.slice(0, 5);

    artistIds.push(seedArtists.map((ar) => ar.id));

    // Get recommendations
    const recommendations = await spotifyApi.getRecommendations({
      min_tempo: minTempo,
      max_tempo: maxTempo,
      seed_artists: [artistIds[0]],
      seed_tracks: [seedTracks],
      limit: 10,
    });

    // Get doubled recommendations
    const doubledRecommendations = await spotifyApi.getRecommendations({
      min_tempo: doubledMinTempo,
      max_tempo: doubledMaxTempo,
      seed_artists: [artistIds[0]],
      seed_tracks: [seedTracks],
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
    await spotifyApi.addTracksToPlaylist(playlist.body.id, filteredTrack);

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
