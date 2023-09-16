import { SpotifyConfig } from "./spotifyweb.config";
import { SpotifyWebAuthTokenManager } from "./SpotifyWebAuthTokenManager";
import * as AuthSession from "expo-auth-session";
import AsyncStorage from "@react-native-async-storage/async-storage";

export class SpotifyWebAccessTokenManager
{
    async InitSpotifyWebAccessTokenManagerAsync()
    {
        AsyncStorage.clear();
        await this.RefreshAccessTokenAsync();
    }

    async GetAccessTokenAsync()
    {
        if(this.IsExpired())
        {
            await this.RefreshAccessTokenAsync();
        }

        return this.AccessToken;
    }

    IsExpired()
    {
        const currentEpoch = Math.round(new Date().getTime() / 1000);
        return this.ExpirationTime < currentEpoch;
    }

    async RefreshAccessTokenAsync()
    {
        let accessTokenResponse;

        if(!this.RefreshToken)
        {
            this.RefreshToken = await AsyncStorage.getItem(this.RefreshTokenStorageKey);
        }

        if(!this.RefreshToken)
        {
            accessTokenResponse = await this.GetAccessTokenWithAuthTokenManagerAsync(); 
        }
        else
        {
            const refreshRequestOptions = {
                clientId: SpotifyConfig.ClientId, 
                refreshToken: this.RefreshToken, 
                extraParams: {
                    grant_type: "refresh_token",
                }
            }
            
            const discovery = { tokenEndpoint: SpotifyConfig.TokenUrl };

            accessTokenResponse = await AuthSession.refreshAsync(refreshRequestOptions, discovery).catch(async () => await this.GetAccessTokenWithAuthTokenManagerAsync());
        }

        this.AccessToken = accessTokenResponse.accessToken;
        this.ExpirationTime = accessTokenResponse.issuedAt + accessTokenResponse.expiresIn;

        this.RefreshToken = accessTokenResponse.refreshToken; 
        await AsyncStorage.setItem(this.RefreshTokenStorageKey, this.RefreshToken);
    }

    async GetAccessTokenWithAuthTokenManagerAsync()
    {
        let authTokenManager = new SpotifyWebAuthTokenManager();
        await authTokenManager.InitSpotifyWebAuthTokenManagerAsync();

        const authToken = await authTokenManager.GetAuthTokenAsync();
        const accessRequestOptions = {
            clientId: SpotifyConfig.ClientId,
            code: authToken,
            redirectUri: AuthSession.makeRedirectUri(),
            extraParams: {
                grant_type: "authorization_code",
                code_verifier: await authTokenManager.GetCodeVerifierAsync(),
            },
        };
        
        const discovery = { tokenEndpoint: SpotifyConfig.TokenUrl };
        
        return await AuthSession.exchangeCodeAsync(accessRequestOptions, discovery);
    }

    AccessToken;
    ExpirationTime;
    RefreshToken;
    RefreshTokenStorageKey = "RefreshTokenStorageKey";
}