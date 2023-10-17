import { makeRedirectUri } from "expo-auth-session";
import Constants from "expo-constants";

let redirectUri = makeRedirectUri({
    useProxy:  Constants.appOwnership === "standalone" ? false : true,
    native: "spotifybpmtool://redirect",
});

export const SpotifyConfig = {
    ClientId: "4fd58641642a49c3b0dea0cc62e3c152",
    AuthUrl: "https://accounts.spotify.com/authorize",
    TokenUrl: "https://accounts.spotify.com/api/token",
    ApiUrl: "https://api.spotify.com/v1",
    RedirectUri: redirectUri,
    Scopes: [ "user-library-read", 
        "user-modify-playback-state",
        "user-read-playback-state",
        "user-read-private",
        "playlist-modify-public" ],
};