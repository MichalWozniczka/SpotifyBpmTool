import { SpotifyConfig } from "./spotifyweb.config";
import { SpotifyWebAuthTokenManager } from "./SpotifyWebAuthTokenManager";
import * as AuthSession from "expo-auth-session";
import AsyncStorage from "@react-native-async-storage/async-storage";

export class SpotifyWebAccessTokenManager
{
    async InitSpotifyWebAccessTokenManagerAsync(refreshOnly = false)
    {
        console.log("Initializing access token manager");
        
        let scopesString = SpotifyConfig.Scopes.join(",");
        let storedScopesString = await AsyncStorage.getItem(this.ScopesStorageKey);
        if(scopesString != storedScopesString)
        {
            console.log("Permission scopes changed. Forcing auth token init.");
            refreshOnly = false;
            await AsyncStorage.removeItem(this.RefreshTokenStorageKey);
        }

        this.Initialized = await this.RefreshOrInitAccessTokenAsync(refreshOnly);

        
        if(scopesString != storedScopesString)
        {
            await AsyncStorage.setItem(this.ScopesStorageKey, scopesString);
        }

        return this.Initialized;
    }
    async GetAccessTokenAsync()
    {
        if(this.IsExpired())
        {
            console.log("Access token expired or not initialized. Attempting to refresh/init access token.");
            await this.RefreshOrInitAccessTokenAsync();
        }

        return this.AccessToken;
    }

    IsExpired()
    {
        const currentEpoch = Math.round(new Date().getTime() / 1000);
        return !this.Initialized || this.ExpirationTime < currentEpoch;
    }

    async RefreshOrInitAccessTokenAsync(refreshOnly)
    {
        let accessTokenResponse = await this.GetAccessTokenViaRefreshAsync().catch(async (error) => { console.log("Failed to refresh access token. " + error); });

        if(!refreshOnly)
        {
            accessTokenResponse ??= await this.GetAccessTokenViaAuthTokenManagerAsync();
        }

        if(!accessTokenResponse)
        {
            console.log("Failed to acquire access token");
            await AsyncStorage.removeItem(this.RefreshTokenStorageKey);
            return false;
        }

        console.log("Acquired access token");
        this.AccessToken = accessTokenResponse.accessToken;
        this.ExpirationTime = accessTokenResponse.issuedAt + accessTokenResponse.expiresIn;
        this.RefreshToken = accessTokenResponse.refreshToken; 
        await AsyncStorage.setItem(this.RefreshTokenStorageKey, this.RefreshToken);

        return true;
    }

    async GetAccessTokenViaRefreshAsync()
    {
        this.RefreshToken ??= await AsyncStorage.getItem(this.RefreshTokenStorageKey);
        if(!this.RefreshToken)
        {
            console.log("Refresh token not found in local storage");
            return null;
        }
        
        console.log("Found refresh token in local storage. Attempting token refresh");
        const refreshRequestOptions = {
            clientId: SpotifyConfig.ClientId, 
            refreshToken: this.RefreshToken, 
            extraParams: {
                grant_type: "refresh_token",
            }
        }
        
        const discovery = { tokenEndpoint: SpotifyConfig.TokenUrl };

        accessTokenResponse = await AuthSession.refreshAsync(refreshRequestOptions, discovery);
        return accessTokenResponse;
    }

    async GetAccessTokenViaAuthTokenManagerAsync()
    {
        console.log("Attempting to acquire access token via auth token request");
        const authTokenManager = new SpotifyWebAuthTokenManager();
        const authTokenInitResult = await authTokenManager.InitSpotifyWebAuthTokenManagerAsync(SpotifyConfig.Scopes);
        if(!authTokenInitResult)
        {
            return null;
        }

        const authToken = await authTokenManager.GetAuthTokenAsync();
        const accessRequestOptions = {
            clientId: SpotifyConfig.ClientId,
            code: authToken,
            redirectUri: SpotifyConfig.RedirectUri,
            extraParams: {
                grant_type: "authorization_code",
                code_verifier: await authTokenManager.GetCodeVerifierAsync(),
            },
        };
        
        const discovery = { tokenEndpoint: SpotifyConfig.TokenUrl };
        
        const accessTokenResponse = await AuthSession.exchangeCodeAsync(accessRequestOptions, discovery);
        return accessTokenResponse;
    }

    AccessToken;
    ExpirationTime;
    RefreshToken;
    RefreshTokenStorageKey = "RefreshTokenStorageKey";
    ScopesStorageKey = "Scopes";
    Initialized = false;
}