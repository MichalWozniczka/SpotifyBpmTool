import { SpotifyConfig } from "./spotifyweb.config"; 
import { SpotifyWebAccessTokenManager } from "./SpotifyWebAccessTokenManager";

export class SpotifyWebManager
{
    async ResumePlaybackAsync()
    {
        await this.PlayAsync();
    }

    async PlayTracksAsync(uriTrackList)
    {
        await this.PlayAsync({ uris: uriTrackList });
    }

    async PlayAsync(body)
    {
        const deviceId = await this.GetDefaultDeviceIdAsync(); 
        await this.ExecuteWebRequestAsync("/me/player/play?device_id=" + deviceId, "PUT", await this.AccessTokenManager.GetAccessTokenAsync(), body);
    }

    async GetDefaultDeviceIdAsync()
    {
        const response = await this.ExecuteWebRequestAsync("/me/player/devices", "GET", await this.AccessTokenManager.GetAccessTokenAsync());
        let deviceList = (await response.json()).devices;
        let activeDevice = deviceList.find(device => device.is_active);

        if (activeDevice === undefined)
        {
            activeDevice = deviceList.find(device => device.type == "Smartphone");
        }

        if (activeDevice === undefined)
        {
            activeDevice = deviceList[0];
        }

        return activeDevice.id;
    }

    async ExecuteWebRequestAsync(path, method, accessToken, body = undefined)
    {
        const options = {
            method: method,
            headers: this.GetWebRequestHeaders(accessToken),
            body: (body === undefined ? undefined : JSON.stringify(body)),
        };

        return await fetch(SpotifyConfig.ApiUrl + path, options);
    } 

    GetWebRequestHeaders(accessToken)
    {
        const headers = new Headers();
        headers.append("Authorization", "Bearer " + accessToken);
        headers.append("Content-Type", "application/json");

        return headers;
    }

    async LoginAsync()
    {
        this.AccessTokenManager = new SpotifyWebAccessTokenManager();
        await this.AccessTokenManager.InitSpotifyWebAccessTokenManagerAsync();

        await this.ResumePlaybackAsync(); 
    }

    AccessTokenManager;
};