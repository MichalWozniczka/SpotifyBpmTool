import { SpotifyConfig } from "./spotifyweb.config";
import * as AuthSession from "expo-auth-session";
import AsyncStorage from "@react-native-async-storage/async-storage";

export class SpotifyWebAuthTokenManager
{
    async InitSpotifyWebAuthTokenManagerAsync()
    {
        console.log("Initializing auth token manager");
        return await this.RequestAuthTokenAsync();
    }

    async GetAuthTokenAsync()
    {
        return this.AuthToken;
    }

    async GetCodeVerifierAsync()
    {
        return this.CodeVerifier;
    }

    async RequestAuthTokenAsync()
    {
        console.log("Attempting auth token request");
        const request = await this.GenerateAuthTokenRequestAsync().catch(() => null);

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
    
    async GenerateAuthTokenRequestAsync()
    {
        const scopes = [ "user-library-read", 
            "user-modify-playback-state",
            "user-read-playback-state",
            "user-read-private" ]; 

        const authRequestOptions = {
            usePKCE: true,
            responseType: AuthSession.ResponseType.Code,
            clientId: SpotifyConfig.ClientId,
            scopes: scopes,
            prompt: AuthSession.Prompt.None,
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