import { SpotifyConfig } from "./spotifyweb.config"; 
import { SpotifyWebAccessTokenManager } from "./SpotifyWebAccessTokenManager";
import { Album } from "./LibraryItem"
import { Playlist } from "./LibraryItem"
import { Track } from "./LibraryItem"

export class SpotifyWebManager
{
    async CreateAndPopulatePlaylistFromTracksAsync(name, ids)
    {
        console.log("Creating playlist with name " + name + " from track ids " + ids);

        // Get user id
        console.log("Getting user id");
        let userInfoResponse = await this.ExecuteWebRequestAsync("/me", "GET");
        let userInfoResponseJson = await userInfoResponse.json();
        let userId = userInfoResponseJson.id;

        // Create playlist
        console.log("Creating empty playlist");
        let playlistCreateResponse = await this.ExecuteWebRequestAsync("/users/" + userId + "/playlists", "POST", {name: name});
        let playlistCreateResponseJson = await playlistCreateResponse.json();
        let playlistId = playlistCreateResponseJson.id;

        // Add tracks to playlist
        console.log("Adding items to playlist");
        let remaining = 0;
        let limit = 100;
        let offset = 0;
        do
        {
            let trackBatch = ids.slice(offset, offset + limit).map(id => "spotify:track:" + id);
            await this.ExecuteWebRequestAsync("/playlists/" + playlistId + "/tracks", "POST", {uris: trackBatch});
            offset += limit;
            remaining = ids.length - offset;
        } while (remaining > 0);
    }
    
    async GetUsersSavedAlbumsAsync()
    {
        let items = await this.GetItemsFromApiCallAsync("/me/albums");

        let albums =  items.map(responseItem => 
            new Album(responseItem.album.name, 
                responseItem.album.id, 
                responseItem.album?.images[0]?.url,
                responseItem.album?.artists.map(artistObject => artistObject.name)));

        return albums;
    }

    async GetUsersSavedPlaylistsAsync()
    {
        let items = await this.GetItemsFromApiCallAsync("/me/playlists");

        let playlists = items.map(responseItem => 
            new Playlist(responseItem.name, 
                responseItem.id, 
                responseItem.images[0]?.url,
                responseItem.owner?.display_name));

        return playlists;
    }

    async GetUsersSavedTracksAsync()
    {
        let items = await this.GetItemsFromApiCallAsync("/me/tracks");
        
        let tracks = items.map(responseItem => 
            new Track(responseItem.track.name, 
                responseItem.track.id, 
                responseItem.track.album?.images[0]?.url,
                responseItem.track.artists?.map(artistObject => artistObject.name)));
        
        return tracks;
    }

    // URIs should be strings in format {type}:{id}
    async GetTracksFromUrisAsync(uris)
    {
        console.log("Getting tracks via web API with uri list " + uris);
        let tracks = [];
        for(let i = 0; i < uris.length; ++i)
        {
            let uri = uris[i];
            let [type, id] = uri.split(":");
            let newTracks;
            let items;
            let countryCode = await this.GetCountryCodeAsync();
            switch(type)
            {
                case "Album":
                    // We need to get the album info first or else we won't have album art
                    let response = await this.ExecuteWebRequestAsync("/albums/" + id + "?market=" + countryCode, "GET");
                    let albumObject = await response.json();
                    requestPath = "/albums/" + id + "/tracks";
                    items = await this.GetItemsFromApiCallAsync(requestPath);
                    newTracks = items.map(responseItem => 
                        new Track(responseItem.name, 
                            responseItem.id, 
                            albumObject.images[0]?.url,
                            responseItem.artists?.map(artistObject => artistObject.name)));
                    break;
                case "Playlist":
                    // Get the playlist tracks
                    requestPath = "/playlists/" + id + "/tracks";
                    items = await this.GetItemsFromApiCallAsync(requestPath);
                    newTracks = items.map(responseItem => 
                        new Track(responseItem.track.name, 
                            responseItem.track.id, 
                            responseItem.track.album?.images[0]?.url,
                            responseItem.track.artists?.map(artistObject => artistObject.name)));
                    break;
                case "Track":
                    // Just make the direct API call to get the track info
                    let trackResponse = await this.ExecuteWebRequestAsync("/tracks/" + id + "?market=" + countryCode, "GET");
                    let trackObject = await trackResponse.json();
                    newTracks = [new Track(trackObject.name, trackObject.id, trackObject.album?.images[0]?.url, trackObject.artists?.map(artistObject => artistObject.name))];
                    break;
            }

            tracks = tracks.concat(newTracks);
        }

        // Get rid of duplicates
        let idSet = new Set();
        let uniqueTracks = [];

        for(let i = 0; i < tracks.length; ++i)
        {
            let track = tracks[i];
            if(!idSet.has(track.id))
            {
                uniqueTracks.push(track);
                idSet.add(track.id);
            }
        }

        console.log("Tracks retrieved");
        return uniqueTracks;
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
            remaining = responseJson.total - offset;
        } while (remaining > 0);

        return items;
    }

    async GetTrackTemposAsync(trackIds)
    {
        console.log("Getting track tempos via web API with track id list " + trackIds);
        let idToTempoMap = {};
        let remaining = 0;
        let limit = 100;
        let offset = 0;
        do
        {
            let trackQueryString = trackIds.slice(offset, offset + limit).join(",");
            let response = await this.ExecuteWebRequestAsync("/audio-features?ids=" + trackQueryString, "GET");
            let responseJson = await response.json();

            const audioFeatures = responseJson.audio_features;
            for(let i = 0; i < audioFeatures.length; ++i)
            {
                let audioFeature = audioFeatures[i];
                if(audioFeature)
                {
                    idToTempoMap[audioFeature.id] = Math.floor(audioFeature.tempo);
                }
            }

            offset += limit;
            remaining = trackIds.length - offset;
        } while (remaining > 0);

        console.log("Track tempos retrieved");
        return idToTempoMap;
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
        console.log("Executing web request: " + method + " " + path + " Body: " + JSON.stringify(body));
        const options = {
            method: method,
            headers: this.GetWebRequestHeaders(accessToken),
            body: (body === undefined ? undefined : JSON.stringify(body)),
        };

        let retry = true;
        let statusCode;
        let response;
        let retryCount = 0;
        let retryLimit = 10;
        let retryDelay = 500;

        // Retry until success
        while(retry)
        {
            retry = false;

            response = await fetch(SpotifyConfig.ApiUrl + path, options);

            statusCode = response.status;
            if(retryCount < retryLimit && (statusCode < 200 || statusCode >= 300))
            {
                retry = true;
                ++retryCount;
                console.log("Web request failed. Retry count: " + retryCount);

                // sleep to delay retry
                await new Promise(r => setTimeout(r, retryDelay));
            }
            else if(retryCount >= retryLimit)
            {
                throw new Error("Exceeded retry count when executing web request in SpotifyWebManager");
            }
        }

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