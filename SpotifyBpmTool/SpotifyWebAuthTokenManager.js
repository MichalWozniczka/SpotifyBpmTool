import { SpotifyConfig } from "./spotifyweb.config";
import * as AuthSession from "expo-auth-session";
import AsyncStorage from "@react-native-async-storage/async-storage";

export class SpotifyWebAuthTokenManager
{
    async InitSpotifyWebAuthTokenManagerAsync(loadFromStorage)
    {
        if (loadFromStorage)
        {
            this.AuthToken = await AsyncStorage.getItem(this.AuthTokenStorageKey);
            this.CodeVerifier = await AsyncStorage.getItem(this.CodeVerifierStorageKey);
        }

        if(!this.AuthToken || !this.CodeVerifier)
        {
            await this.RefreshAuthTokenAsync();
        }
    }

    async GetAuthTokenAsync()
    {
        return this.AuthToken;
    }

    async GetCodeVerifierAsync()
    {
        return this.CodeVerifier;
    }

    async RefreshAuthTokenAsync()
    {
        const request = await this.GenerateAuthTokenRequestAsync();

        const result = await request.promptAsync({ useProxy: true });

        this.AuthToken = result.params.code;
        await AsyncStorage.setItem(this.AuthTokenStorageKey, this.AuthToken);

        this.CodeVerifier = request.codeVerifier;
        await AsyncStorage.setItem(this.CodeVerifierStorageKey, this.CodeVerifier);
    }
    
    async GenerateAuthTokenRequestAsync()
    {
        const authRequestOptions = {
            usePKCE: true,
            responseType: AuthSession.ResponseType.Code,
            clientId: SpotifyConfig.ClientId,
            redirectUri: AuthSession.makeRedirectUri(),
        };
        
        const discovery = { authorizationEndpoint: SpotifyConfig.AuthUrl };

        const request = await AuthSession.loadAsync(authRequestOptions, discovery);

        return request;
    }

    AuthToken;
    AuthTokenStorageKey = "SpotifyAuthToken";
    CodeVerifier;
    CodeVerifierStorageKey = "CodeVerifierStorageKey";
}