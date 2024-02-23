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

        res.redirect("/home");
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
      },
      function (err) {
        console.log("Could not refresh access token", err);
      }
    );
  }
});

app.get("/home", async (req, res) => {
  if (isEmpty(spotifyApi.getAccessToken())) {
    res.redirect("/");
  }

  //Get top tracks
  spotifyApi.getMyTopTracks({ limit: 50 }).then(
    function (data) {
      const trackId = [];

      data.body.items.forEach((track) => {
        trackId.push(track.id);
      });

      //Get the tempo
      spotifyApi.getAudioFeaturesForTracks(trackId).then(
        function (data) {
          const minTempo = 158;
          const maxTempo = 162;

          const filteredTrack = [];
          //filter by specific range of tempo
          data.body.audio_features.forEach((track) => {
            if (track.tempo >= minTempo && track.tempo <= maxTempo) {
              filteredTrack.push("spotify:track:" + track.id);
            }
          });

          //Create a playlist with the tempo name and the tracks
          spotifyApi
            .createPlaylist("Running playlist 160 bpm", {
              description: "running playlist",
              public: true,
            })
            .then(
              function (data) {
                // Add tracks to a playlist
                spotifyApi
                  .addTracksToPlaylist(data.body.id, filteredTrack)
                  .then(
                    function (data) {
                      console.log("Added tracks to playlist!");
                    },
                    function (err) {
                      console.log("Something went wrong!", err);
                    }
                  );

                console.log("Created playlist!");
              },
              function (err) {
                console.log("Something went wrong!", err);
              }
            );
        },
        function (err) {
          done(err);
        }
      );
    },
    function (err) {
      console.log("Something went wrong!", err);
    }
  );
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
