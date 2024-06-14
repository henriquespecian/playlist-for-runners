const SpotifyWebApi = require("spotify-web-api-node");

class SpotifyService {
  constructor(spotifyApi) {
    this.spotifyApi = spotifyApi;
  }

  async getAuthorizationURL(scopes, state) {
    return this.spotifyApi.createAuthorizeURL(scopes, state);
  }
 
}

module.exports = SpotifyService;
