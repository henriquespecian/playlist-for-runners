const SpotifyService = require("../src/spotifyService");
const SpotifyWebApi = require("spotify-web-api-node");
jest.mock('spotify-web-api-node');

const spotifyApiMock = new SpotifyWebApi();
const spotifyService = new SpotifyService(spotifyApiMock);

test("should return authorizarion URL", async () => {
  
  const scopes = [
    "user-read-private",
    "user-read-email"
  ];
  const state = "some-state-of-my-choice";
  const authorizeURL = "https://accounts.spotify.com/authorize"

  spotifyApiMock.createAuthorizeURL.mockReturnValue(authorizeURL);

  const result = await spotifyService.getAuthorizationURL(scopes, state);

  expect(result).toBe(authorizeURL);
});

