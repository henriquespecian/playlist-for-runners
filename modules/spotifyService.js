class SpotifyService {
  constructor(spotifyApi) {
    this.spotifyApi = spotifyApi;
  }

  async getAuthorizationURL(scopes, state) {
    return this.spotifyApi.createAuthorizeURL(scopes, state);
  }

  async getSavedTracks() {
    return await spotifyApi.getMySavedTracks({
      limit: 50,
    });
  }

  async getMyTopTracks(timeRange) {
    return await spotifyApi.getMyTopTracks({
      limit: 50,
      time_range: timeRange,
    });
  }

  async getAudioFeaturesForTracks(tracks){
    return await spotifyApi.getAudioFeaturesForTracks(
      tracks
    );
  }

  async getSeveralTracks(){
    const tracks = [];
    const savedTrack = await this.getSavedTracks();
    const longTermTracks = await getMyTopTracks("long_term");
    const mediumTermTracks = await getMyTopTracks("medium_term");
    const shortTermTracks = await getMyTopTracks("short_term");

    // Combined tracks
    const combinedTracks = [
      ...longTermTracks.body.items,
      ...mediumTermTracks.body.items,
      ...shortTermTracks.body.items,
      ...savedTrack.body.items,
    ];

    combinedTracks.forEach((track) => {
      tracks.push(track.id);
    });

    return tracks;
  }

  async getAudioFeatures(tracks){
    const audioFeaturesFirst = this.getAudioFeaturesForTracks(tracks.slice(0, 100));
    const audioFeaturesSecond = this.getAudioFeaturesForTracks(tracks.slice(100, 200));

    const audioFeatures = [
      ...audioFeaturesFirst.body.audio_features,
      ...audioFeaturesSecond.body.audio_features,
    ];

    return audioFeatures;
  }

  async filterTracks(tracks, minTempo, maxTempo){
    const audioFeatures = this.getAudioFeatures(tracks);
    const filteredTrack = [];  

    //filter by specific range of tempo
    audioFeatures.forEach((track) => {
      if (track.tempo >= minTempo && track.tempo <= maxTempo) {
        filteredTrack.push(track.uri);
      }
    });

    return filteredTrack;
  }  

  async getMyTopArtists(timeRange, limit){
    return await spotifyApi.getMyTopArtists({
      time_range: timeRange,
      limit: limit,
    });
  }

  async getSeedArtists() {
    const artistIds = [];
    const recentArtists = this.getMyTopArtists("short_term", 2);
    const topArtists = this.getMyTopArtists("long_term", 3);
    const seedArtists = [...recentArtists.body.items, ...topArtists.body.items];
    
    artistIds.push(seedArtists.map((ar) => ar.id));

    return artistIds[0];
  }

  async createPlaylist(minTempo, maxTempo) {    

    const doubledMinTempo = Math.round(minTempo / 2);
    const doubledMaxTempo = Math.round(maxTempo / 2);      
    
    // Get several tracks from the user first
    const tracks = await this.getSeveralTracks();

    // Filter tracks
    const filteredTrack = this.filterTracks(tracks, minTempo, maxTempo);

    // Get seeds
    const seedArtists = this.getSeedArtists();
    const seedTracks = tracks.slice(0, 5);   

    // Get recommendations
    const recommendations = await spotifyApi.getRecommendations({
      min_tempo: minTempo,
      max_tempo: maxTempo,
      seed_artists: [seedArtists],
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
  }
}

module.exports = SpotifyService;
