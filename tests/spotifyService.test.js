const SpotifyService = require("../modules/spotifyService");
const SpotifyWebApi = require("spotify-web-api-node");

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  redirectUri: "http://localhost:8080/callback",
});

const spotifyService = new SpotifyService(spotifyApi);

test("getAuthorizationURL", () => {
  const scopes = [
    "user-read-private",
    "user-read-email",
    "user-top-read",
    "playlist-modify-private",
    "playlist-modify-public",
    "user-library-read",
  ];

  const state = "some-state-of-my-choice";

  expect(spotifyService.sum(1, 2)).toBe(3);
});
