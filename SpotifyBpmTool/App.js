import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { SpotifyWebManager } from "./SpotifyWebManager";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

const Stack = createNativeStackNavigator();
const spotifyWebManager = new SpotifyWebManager();

export default function App() 
{
    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen
                    name="Login"
                    component={LoginScreen}
                />
                <Stack.Screen 
                    name="Playlist" 
                    component={PlaylistScreen} 
                />
                <Stack.Screen 
                    name="LibrarySelect" 
                    component={LibrarySelectScreen} 
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}

function LoginScreen()  
{
    return (
        <View style={styles.loginScreen}>
            <Pressable style={styles.connectButton} onPress={() => spotifyWebManager.LoginAsync()}>
                <Text style={styles.connectTextColor}>Connect to Spotify</Text>
            </Pressable>
        </View>
    );
}

function PlaylistScreen()
{

}

function LibrarySelectScreen()
{

}

const styles = StyleSheet.create ({
    loginScreen: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#212020",
    },
    connectButton: {
        margin: 20,
        padding: 20,
        backgroundColor: "#1DB954",
        borderRadius: 40,
        borderWidth: 1,
        borderColor: 'rgba(158, 150, 150, 0)',
    },
    connectTextColor: {
        color: "white",
        fontSize: 30,
        textAlign: "center",
        backgroundColor: "#1DB954",
    }
});