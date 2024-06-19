class SpotifyService {
  constructor(spotifyApi) {
    this.spotifyApi = spotifyApi;
  }

  async getAuthorizationURL(scopes, state) {
    return this.spotifyApi.createAuthorizeURL(scopes, state);
  }

  async getSavedTracks() {
    return await this.spotifyApi.getMySavedTracks({
      limit: 50,
    });
  }

  async getMyTopTracks(timeRange) {
    return await this.spotifyApi.getMyTopTracks({
      limit: 50,
      time_range: timeRange,
    });
  }

  async getAudioFeaturesForTracks(tracks) {
    return await this.spotifyApi.getAudioFeaturesForTracks(tracks);
  }

  async getSeveralTracks() {
    const tracks = [];
    const savedTrack = await this.getSavedTracks();
    const longTermTracks = await this.getMyTopTracks("long_term");
    const mediumTermTracks = await this.getMyTopTracks("medium_term");
    const shortTermTracks = await this.getMyTopTracks("short_term");

    // Combined tracks
    const combinedTracks = [
      ...longTermTracks.body.items,
      ...mediumTermTracks.body.items,
      ...shortTermTracks.body.items,
      ...savedTrack.body.items,
    ];

    combinedTracks.forEach((track) => {
      if (!tracks.includes(track.id)) {
        tracks.push(track.id);
      }
    });

    return tracks;
  }

  async getAudioFeatures(tracks) {
    const audioFeaturesFirst = await this.getAudioFeaturesForTracks(
      tracks.slice(0, 100)
    );

    const audioFeaturesSecond = await this.getAudioFeaturesForTracks(
      tracks.slice(100, 200)
    );

    const audioFeatures = [
      ...audioFeaturesFirst.body.audio_features,
      ...audioFeaturesSecond.body.audio_features,
    ];

    return audioFeatures;
  }

  async filterTracks(tracks, minTempo, maxTempo) {
    const audioFeatures = await this.getAudioFeatures(tracks);
    const filteredTrack = [];

    //filter by specific range of tempo
    audioFeatures.forEach((track) => {
      if (track.tempo >= minTempo && track.tempo <= maxTempo) {
        filteredTrack.push(track.uri);
      }
    });

    return filteredTrack;
  }

  async getMyTopArtists(timeRange, limit) {
    return await this.spotifyApi.getMyTopArtists({
      time_range: timeRange,
      limit: limit,
    });
  }

  async getSeedArtists() {
    const artistIds = [];
    const recentArtists = await this.getMyTopArtists("short_term", 1);
    const topArtists = await this.getMyTopArtists("long_term", 1);
    const seedArtists = [...recentArtists.body.items, ...topArtists.body.items];

    artistIds.push(seedArtists.map((ar) => ar.id));

    return artistIds[0].join(",");
  }

  async getRecommendations(seedArtists, seedTracks, minTempo, maxTempo) {
    // Doubled tempo
    const doubledMinTempo = Math.round(minTempo / 2);
    const doubledMaxTempo = Math.round(maxTempo / 2);

    // Get recommendations
    const recommendations = await this.spotifyApi.getRecommendations({
      min_tempo: minTempo,
      max_tempo: maxTempo,
      seed_artists: seedArtists,
      seed_tracks: seedTracks,
      limit: 10,
    });

    // Get doubled recommendations
    const doubledRecommendations = await this.spotifyApi.getRecommendations({
      min_tempo: doubledMinTempo,
      max_tempo: doubledMaxTempo,
      seed_artists: seedArtists,
      seed_tracks: seedTracks,
      limit: 10,
    });

    recommendations.body.tracks.push(...doubledRecommendations.body.tracks);

    //Create the object
    return recommendations.body.tracks.map(
      (track) => `spotify:track:${track.id}`
    );
  }

  async createPlaylist(name) {
    return await this.spotifyApi.createPlaylist(name, {
      description: "running playlist",
      public: true,
    });
  }

  async addTracksToPlaylist(playlistId, tracks) {
    await this.spotifyApi.addTracksToPlaylist(playlistId, tracks);
  }

  async createPlaylistBasedOnBPM(tempo) {
    try {

      // Margin
      const minTempo = tempo + 2;
      const maxTempo = tempo - 2;

      // Get several tracks from the user first
      const tracks = await this.getSeveralTracks();

      // Filter tracks
      const filteredTrack = await this.filterTracks(tracks, minTempo, maxTempo);

      // Get seeds
      const seedArtists = await this.getSeedArtists();
      const seedTracks = tracks.slice(0, 3).join(",");

      // Get recommended tracks
      const filteredTrackUris = await this.getRecommendations(
        seedArtists,
        seedTracks,
        minTempo,
        maxTempo
      );

      // Create a playlist with the filtered tracks
      const playlist = await this.createPlaylist("Running playlist "+ tempo +" bpm");

      // Add tracks to the playlist
      await this.addTracksToPlaylist(playlist.body.id, filteredTrackUris);
      await this.addTracksToPlaylist(playlist.body.id, filteredTrack);
    } catch (error) {
      console.error("Error creating playlist:", error);
    }
  }
}

module.exports = SpotifyService;
