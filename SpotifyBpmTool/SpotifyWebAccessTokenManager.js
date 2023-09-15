import { SpotifyConfig } from "./spotifyweb.config";
import * as AuthSession from "expo-auth-session";

export class SpotifyWebAccessTokenManager
{
    async InitSpotifyWebAccessTokenManagerAsync(spotifyWebAuthToken)
    {
        this.AuthTokenManager = spotifyWebAuthToken;
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
        console.log(this.ExpirationTime);
        console.log(currentEpoch);
        return this.ExpirationTime < currentEpoch;
    }

    async RefreshAccessTokenAsync()
    {
        const authToken = await this.AuthTokenManager.GetAuthTokenAsync();
        const accessRequestOptions = {
            clientId: SpotifyConfig.ClientId,
            code: authToken,
            redirectUri: AuthSession.makeRedirectUri(),
            extraParams: {
                grant_type: "authorization_code",
                code_verifier: await this.AuthTokenManager.GetCodeVerifierAsync(),
            },
        };
        
        const discovery = { tokenEndpoint: SpotifyConfig.TokenUrl };
        
        let accessTokenResponse = await AuthSession.exchangeCodeAsync(accessRequestOptions, discovery);

        this.AccessToken = accessTokenResponse.accessToken;
        this.ExpirationTime = accessTokenResponse.issuedAt + accessTokenResponse.expiresIn;
    }

    AuthTokenManager;
    AccessToken;
    ExpirationTime;
}