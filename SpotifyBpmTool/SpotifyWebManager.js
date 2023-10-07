import { SpotifyConfig } from "./spotifyweb.config"; 
import { SpotifyWebAccessTokenManager } from "./SpotifyWebAccessTokenManager";
import { Album } from "./LibraryItem"
import { Playlist } from "./LibraryItem"
import { Track } from "./LibraryItem"

export class SpotifyWebManager
{
    async GetUsersSavedAlbumsAsync()
    {
        let items = await this.GetItemsFromApiCallAsync("/me/albums");

        let albums =  items.map(responseItem => 
            new Album(responseItem.album.name, 
                responseItem.album.id, 
                responseItem.album.images[0].url,
                responseItem.album.artists.map(artistObject => artistObject.name)));

        return albums;
    }

    async GetUsersSavedPlaylistsAsync()
    {
        let items = await this.GetItemsFromApiCallAsync("/me/playlists");

        let playlists = items.map(responseItem => 
            new Playlist(responseItem.name, 
                responseItem.id, 
                responseItem.images[0]?.url,
                responseItem.owner.display_name));

        return playlists;
    }

    async GetUsersSavedTracksAsync()
    {
        let items = await this.GetItemsFromApiCallAsync("/me/tracks");
        
        let tracks = items.map(responseItem => 
            new Track(responseItem.track.name, 
                responseItem.track.id, 
                responseItem.track.album.images[0].url,
                responseItem.track.artists.map(artistObject => artistObject.name)));
        
        return tracks;
    }

    async GetItemsFromApiCallAsync(path)
    {
        let items = [];
        let remaining = 0;
        let limit = 50;
        let offset = 0;
        let countryCode = await this.GetCountryCodeAsync();
        do
        {
            let response = await this.ExecuteWebRequestAsync(path + "?limit=" + limit + "&offset=" + offset + "&market=" + countryCode, "GET");
            let responseJson = await response.json();
            items = items.concat(responseJson.items);
            offset += limit;
            remaining = responseJson.total - (limit * offset);

        } while (remaining > 0);

        return items;
    }

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
        await this.ExecuteWebRequestAsync("/me/player/play?device_id=" + deviceId, "PUT", body);
    }

    async GetDefaultDeviceIdAsync()
    {
        const response = await this.ExecuteWebRequestAsync("/me/player/devices", "GET");
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

    async ExecuteWebRequestAsync(path, method, body = undefined)
    {
        let accessToken = await this.AccessTokenManager.GetAccessTokenAsync();
        console.log("Executing web request: " + method + " " + path);
        const options = {
            method: method,
            headers: this.GetWebRequestHeaders(accessToken),
            body: (body === undefined ? undefined : JSON.stringify(body)),
        };

        const response = await fetch(SpotifyConfig.ApiUrl + path, options);
        return response;
    } 

    GetWebRequestHeaders(accessToken)
    {
        const headers = new Headers();
        headers.append("Authorization", "Bearer " + accessToken);
        headers.append("Content-Type", "application/json");

        return headers;
    }

    async GetCountryCodeAsync()
    {
        if(!this.countryCode)
        {
            let response = await this.ExecuteWebRequestAsync("/me", "GET");
            let responseJson = await response.json();
            this.countryCode = responseJson.country;    
        }

        return this.countryCode;
    }

    async AttemptConnectWithoutLoginAsync()
    {
        console.log("Attempting to connect to spotify web manager without login");
        this.AccessTokenManager = new SpotifyWebAccessTokenManager();
        const accessTokenInitResult = await this.AccessTokenManager.InitSpotifyWebAccessTokenManagerAsync(true /*refreshOnly*/);

        if(!accessTokenInitResult)
        {
            console.log("Connection failed");
            return false;
        }
        
        console.log("Connection succeeded");
        return true;
    }

    async LoginAsync()
    {
        console.log("Attempting to log into spotify web manager");
        this.AccessTokenManager = new SpotifyWebAccessTokenManager();
        const accessTokenInitResult = await this.AccessTokenManager.InitSpotifyWebAccessTokenManagerAsync();

        if(!accessTokenInitResult)
        {
            console.log("Login failed");
            return false;
        }
        
        console.log("Login succeeded");
        return true;
    }

    AccessTokenManager;
};