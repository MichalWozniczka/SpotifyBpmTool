import { SpotifyConfig } from "./spotifyweb.config";
import * as AuthSession from "expo-auth-session";
import AsyncStorage from "@react-native-async-storage/async-storage";

export class SpotifyWebAuthTokenManager
{
    async InitSpotifyWebAuthTokenManagerAsync(scopes)
    {
        console.log("Initializing auth token manager");
        return await this.RequestAuthTokenAsync(scopes);
    }

    async GetAuthTokenAsync()
    {
        return this.AuthToken;
    }

    async GetCodeVerifierAsync()
    {
        return this.CodeVerifier;
    }

    async RequestAuthTokenAsync(scopes)
    {
        console.log("Attempting auth token request");
        const request = await this.GenerateAuthTokenRequestAsync(scopes).catch(() => null);

        console.log("Prompting user");
        const result = await request?.promptAsync({ useProxy: true });

        if(!result || !!result.error || result.type == "dismiss")
        {
            console.log("Failed to init auth token");
            await AsyncStorage.removeItem(this.AuthTokenStorageKey);
            await AsyncStorage.removeItem(this.CodeVerifierStorageKey);
            return false;
        }

        console.log("Prompt succeeded. Initialized auth token");
        this.AuthToken = result.params.code;
        await AsyncStorage.setItem(this.AuthTokenStorageKey, this.AuthToken);

        this.CodeVerifier = request.codeVerifier;
        await AsyncStorage.setItem(this.CodeVerifierStorageKey, this.CodeVerifier);

        return true;
    }
    
    async GenerateAuthTokenRequestAsync(scopes)
    {
        const authRequestOptions = {
            usePKCE: true,
            responseType: AuthSession.ResponseType.Code,
            clientId: SpotifyConfig.ClientId,
            scopes: scopes,
            prompt: AuthSession.Prompt.None,
            redirectUri: SpotifyConfig.RedirectUri,
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