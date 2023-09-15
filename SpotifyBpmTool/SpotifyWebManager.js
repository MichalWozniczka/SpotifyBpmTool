import { SpotifyWebAuthTokenManager } from "./SpotifyWebAuthTokenManager";
import { SpotifyWebAccessTokenManager } from "./SpotifyWebAccessTokenManager";

export class SpotifyWebManager
{
    async Login()
    {
        let authToken = new SpotifyWebAuthTokenManager(false /*loadFromStorage*/);
        await authToken.InitSpotifyWebAuthTokenManagerAsync();

        let accessToken = new SpotifyWebAccessTokenManager();
        await accessToken.InitSpotifyWebAccessTokenManagerAsync(authToken);  
    }
};