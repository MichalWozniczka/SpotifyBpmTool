import { useState, useEffect, useCallback } from "react";
import { Text } from "react-native";
import { SpotifyWebManager } from "./SpotifyWebManager";
import { applyGlobalPolyfills } from "./Polyfills";

export default function App() {
  const [authToken, setAuthToken] = useState("");

  const setAuthRequestCallback = useCallback(async () => {
    applyGlobalPolyfills();
    let spotifyWebManager = new SpotifyWebManager();
    await spotifyWebManager.Login();
    let generatedAuthToken = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

    if (generatedAuthToken) {
      setAuthToken(generatedAuthToken);
    }
  }, []);

  useEffect(() => {
    setAuthRequestCallback();
  }, [setAuthRequestCallback]);

  return <Text>{authToken}</Text>;
}