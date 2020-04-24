const { WebSocket } = require('mock-socket');

const logger = require('../../../../utils/logger');
const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');
const { getAllKodi } = require('../../../../lib/device/kodi/kodi.getAllKodi');

const JSONRPC = {
  GetConfiguration: null,
  Introspect: null,
  NotifyAll: null,
  Permission: null,
  Ping: function Ping() {
    return 'pong';
  },
  SetConfiguration: null,
  Version: null,
};

const Addons = {
  ExecuteAddon: null,
  GetAddonDetails: null,
  GetAddons: null,
  SetAddonEnabled: null,
};
const Application = {
  GetProperties: null,
  Quit: null,
  SetMute: function SetMute(value) {
    return value;
  },
  SetVolume: function SetVolume(param) {
    if (param && param.volume && param.volume === 'increment') {
      return 52;
    }
    return 50;
  },
  OnVolumeChanged: null,
};
const AudioLibrary = {
  Clean: null,
  Export: null,
  GetAlbumDetails: null,
  GetAlbums: null,
  GetArtistDetails: null,
  GetArtists: null,
  GetGenres: null,
  GetProperties: null,
  GetRecentlyAddedAlbums: null,
  GetRecentlyAddedSongs: null,
  GetRecentlyPlayedAlbums: null,
  GetRecentlyPlayedSongs: null,
  GetRoles: null,
  GetSongDetails: null,
  GetSongs: null,
  Scan: null,
  SetAlbumDetails: null,
  SetArtistDetails: null,
  SetSongDetails: null,
  OnCleanFinished: null,
  OnCleanStarted: null,
  OnExport: null,
  OnRemove: null,
  OnScanFinished: null,
  OnScanStarted: null,
  OnUpdate: null,
};
const Favourites = {
  AddFavourite: null,
  GetFavourites: null,
};
const Files = {
  GetDirectory: null,
  GetFileDetails: null,
  GetSources: null,
  SetFileDetails: null,
};
const GUI = {
  ActivateWindow: null,
  GetProperties: null,
  GetStereoscopicModes: null,
  SetFullscreen: null,
  SetStereoscopicMode: null,
  ShowNotification: null,
  OnDPMSActivated: null,
  OnDPMSDeactivated: null,
  OnScreensaverActivated: null,
  OnScreensaverDeactivated: null,
};
const Input = {
  Back: null,
  ContextMenu: null,
  Down: null,
  ExecuteAction: null,
  Home: null,
  Info: null,
  Left: null,
  Right: null,
  Select: null,
  SendText: null,
  ShowCodec: null,
  ShowOSD: null,
  ShowPlayerProcessInfo: null,
  Up: null,
  OnInputFinished: null,
  OnInputRequested: null,
};
const PVR = {
  AddTimer: null,
  DeleteTimer: null,
  GetBroadcastDetails: null,
  GetBroadcasts: null,
  GetChannelDetails: null,
  GetChannelGroupDetails: null,
  GetChannelGroups: null,
  GetChannels: null,
  GetProperties: null,
  GetRecordingDetails: null,
  GetRecordings: null,
  GetTimerDetails: null,
  GetTimers: null,
  Record: null,
  Scan: null,
  ToggleTimer: null,
};
const Player = {
  GetActivePlayers: function GetActivePlayers() {
    return [{ playerid: 1 }];
  },
  GetItem: null,
  GetPlayers: null,
  GetProperties: null,
  GoTo: null,
  Move: null,
  Open: function Open() {
    return 'OK';
  },
  PlayPause: function PlayPause() {
    return { speed: 0 };
  },
  Rotate: null,
  Seek: null,
  SetAudioStream: null,
  SetPartymode: null,
  SetRepeat: null,
  SetShuffle: null,
  SetSpeed: null,
  SetSubtitle: null,
  SetVideoStream: null,
  Stop: function Stop() {
    return 'OK';
  },
  Zoom: null,
  OnPause: null,
  OnPlay: null,
  OnPropertyChanged: null,
  OnSeek: null,
  OnSpeedChanged: null,
  OnStop: null,
};
const Playlist = {
  Add: null,
  Clear: null,
  GetItems: null,
  GetPlaylists: null,
  GetProperties: null,
  Insert: null,
  Remove: null,
  Swap: null,
  OnAdd: null,
  OnClear: null,
  OnRemove: null,
};
const Profiles = {
  GetCurrentProfile: null,
  GetProfiles: null,
  LoadProfile: null,
};
const Settings = {
  GetCategories: null,
  GetSections: null,
  GetSettingValue: null,
  GetSettings: null,
  ResetSettingValue: null,
  SetSettingValue: null,
};
const System = {
  EjectOpticalDrive: null,
  GetProperties: null,
  Hibernate: null,
  Reboot: null,
  Shutdown: null,
  Suspend: null,
  OnLowBattery: null,
  OnQuit: null,
  OnRestart: null,
  OnSleep: null,
  OnWake: null,
};
const Textures = {
  GetTextures: null,
  RemoveTexture: null,
};
const VideoLibrary = {
  Clean: null,
  Export: null,
  GetEpisodeDetails: null,
  GetEpisodes: null,
  GetGenres: null,
  GetInProgressTVShows: null,
  GetMovieDetails: null,
  GetMovieSetDetails: null,
  GetMovieSets: null,
  GetMovies: function GetMovies() {
    return { movies: [{ name: 'movie_name', file: 'file_path' }] };
  },
  GetMusicVideoDetails: null,
  GetMusicVideos: null,
  GetRecentlyAddedEpisodes: null,
  GetRecentlyAddedMovies: null,
  GetRecentlyAddedMusicVideos: null,
  GetSeasonDetails: null,
  GetSeasons: null,
  GetTVShowDetails: null,
  GetTVShows: null,
  GetTags: null,
  RefreshEpisode: null,
  RefreshMovie: null,
  RefreshMusicVideo: null,
  RefreshTVShow: null,
  RemoveEpisode: null,
  RemoveMovie: null,
  RemoveMusicVideo: null,
  RemoveTVShow: null,
  Scan: null,
  SetEpisodeDetails: null,
  SetMovieDetails: null,
  SetMovieSetDetails: null,
  SetMusicVideoDetails: null,
  SetSeasonDetails: null,
  SetTVShowDetails: null,
  OnCleanFinished: null,
  OnCleanStarted: null,
  OnExport: null,
  OnRemove: null,
  OnScanFinished: null,
  OnScanStarted: null,
  OnUpdate: null,
};
const XBMC = {
  GetInfoBooleans: null,
  GetInfoLabels: null,
};

/**
 * @description Connect Kodi Media Center and build connection.
 * @example
 * kodi.connect();
 */
async function connect() {
  // GET all Kodi devices
  const devices = await getAllKodi();

  if (!devices) {
    throw new ServiceNotConfiguredError('No Kodi device configured');
  }

  for (let i = 0; i < devices.length; i += 1) {
    let host = '';
    let port = '';
    for (let j = 0; j < devices[i].params.length; j += 1) {
      if (devices[i].params[j].name === 'host') {
        host = devices[i].params[j].value;
      } else if (devices[i].params[j].name === 'port') {
        port = devices[i].params[j].value;
      }
    }

    logger.debug(`'Try to connect to kodi with host: ${host} on port ${port}'`);

    const fakeURL = `ws://${host}:${port}/jsonrpc`;
    const kodiConnection = new WebSocket(fakeURL);

    // Add fake fucntion definition
    Object.assign(kodiConnection, { JSONRPC });
    Object.assign(kodiConnection, { Addons });
    Object.assign(kodiConnection, { Application });
    Object.assign(kodiConnection, { AudioLibrary });
    Object.assign(kodiConnection, { Favourites });
    Object.assign(kodiConnection, { Files });
    Object.assign(kodiConnection, { GUI });
    Object.assign(kodiConnection, { Input });
    Object.assign(kodiConnection, { PVR });
    Object.assign(kodiConnection, { Player });
    Object.assign(kodiConnection, { Playlist });
    Object.assign(kodiConnection, { Profiles });
    Object.assign(kodiConnection, { Settings });
    Object.assign(kodiConnection, { System });
    Object.assign(kodiConnection, { Textures });
    Object.assign(kodiConnection, { VideoLibrary });
    Object.assign(kodiConnection, { XBMC });

    if (kodiConnection) {
      if (this.mapOfKodiConnection === null) {
        this.mapOfKodiConnection = new Map();
      }
      this.mapOfKodiConnection.set(devices[i].id, kodiConnection);
    }
  }
}

module.exports = {
  connect,
};
