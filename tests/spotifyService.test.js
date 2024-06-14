const SpotifyService = require("../modules/spotifyService");
const SpotifyWebApi = require("spotify-web-api-node");

const spotifyApiMock = new SpotifyWebApi({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  redirectUri: "http://localhost:8080/callback",
});

const spotifyService = new SpotifyService(spotifyApiMock);
jest.mock('spotify-web-api-node');

test("return authorizarion URL", () => {
  
  const scopes = [
    "user-read-private",
    "user-read-email",
    "user-top-read",
    "playlist-modify-private",
    "playlist-modify-public",
    "user-library-read",
  ];
  const state = "some-state-of-my-choice";
  const authorizeURL = "https://accounts.spotify.com/authorize"

  spotifyService.getAuthorizationURL.mockResolveValue(authorizeURL);

  expect(spotifyService.getAuthorizationURL(scopes,state)).toBe(authorizeURL);
});
