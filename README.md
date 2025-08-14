## The end

Spotify killed this project :(

https://developer.spotify.com/blog/2024-11-27-changes-to-the-web-api

# Playlist for Runners

This project provides a service to create personalized running playlists using the Spotify Web API. The playlists are generated based on the user's saved tracks, top tracks, and specific tempo ranges suitable for running.

## Installation

1. Clone the repository:

```
git clone https://github.com/henriquespecian/playlist-for-runners.git
cd playlist-for-runners
```

2. Install dependencies:

```
npm install
```
4. Create your project in spotify 

- [Getting started](https://developer.spotify.com/documentation/web-api)

Use this URL in "Redirect URIs"

```
http://localhost:8080/callback
```

3. Create a `.env` file in the root directory and add your Spotify API credentials:

```
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REDIRECT_URI=your_redirect_uri
```

4. Run

```
npm run start:dev
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgements

- [Spotify Web API Node](https://github.com/thelinmichael/spotify-web-api-node) - A Node.js wrapper for the Spotify Web API.
- [Spotify Web API Documentation](https://developer.spotify.com/documentation/web-api/) - Official documentation for the Spotify Web API.

---

Happy running! 🏃‍♂️🎶
