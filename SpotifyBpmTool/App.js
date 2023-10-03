import React, { useState, useEffect } from "react";
import { Text, View, Pressable, SectionList } from "react-native";
import { SpotifyWebManager } from "./SpotifyWebManager";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { styles } from "./StyleSheet";

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

function LoginScreen({ navigation, route })  
{
    const [acceptedConnectWithoutLogin, setAcceptedConnectWithoutLogin] = useState(false);
    const [loginComplete, setLoginComplete] = useState(false);

    async function acceptConnectSpotifyWebManagerWithoutLogin()
    {
        setAcceptedConnectWithoutLogin(true);
        const loginSuccessful = await spotifyWebManager.AttemptConnectWithoutLoginAsync();
        setLoginComplete(loginSuccessful);
    }

    async function loginSpotifyWebManager()
    {
        const loginSuccessful = await spotifyWebManager.LoginAsync();
        setLoginComplete(loginSuccessful);
        if(loginComplete)
        {
            navigation.navigate("LibrarySelect");
        }
    }

    useEffect(() => {
        if(!acceptedConnectWithoutLogin)
        {
            acceptConnectSpotifyWebManagerWithoutLogin();
        }
    }, []);

    useEffect(() => {
        if(loginComplete)
        {
            navigation.navigate("LibrarySelect");
        }
    }, [loginComplete]);

    return (
        <View style={styles.loginScreen}>
            <Pressable style={styles.connectButton} onPress={() => loginSpotifyWebManager()}>
                <Text style={styles.connectTextColor}>Connect to Spotify</Text>
            </Pressable>
        </View>
    );
}

function PlaylistScreen({ navigation, route })
{
}

function LibrarySelectScreen({ navigation, route })
{
    const [albums, setAlbums] = useState([]);
    const [albumsFetched, setAlbumsFetched] = useState(false);

    const [playlists, setplaylists] = useState([]);
    const [playlistsFetched, setPlaylistsFetched] = useState(false);

    const [tracks, settracks] = useState([]);
    const [tracksFetched, setTracksFetched] = useState(false);

    async function GetAlbums()
    {
        setAlbums(await spotifyWebManager.GetUsersSavedAlbumsAsync());
        setAlbumsFetched(true);
    }
    
    async function GetPlaylists()
    {
        
    }
    
    async function GetTracks()
    {
        
    }

    useEffect(() => {
        if(!albumsFetched)
        {
            GetAlbums();
        }
    }, []);

    return (
        <View>
            <Text>Select Library</Text>
            <View style={{flexDirection: "row"}}>
                <FilterLibraryButton name="Albums" filterFunction={GetAlbums}/>
                <FilterLibraryButton name="Playlists" filterFunction={GetPlaylists}/>
                <FilterLibraryButton name="Tracks" filterFunction={GetTracks}/>
            </View>
            <SectionList 
                sections={[
                    { title: "Albums", data: albums},
                    { title: "Playlists", data: playlists},
                    { title: "Tracks", data: tracks},
                ]}
                renderItem={({ item }) => <LibrarySelectItem libraryItem={item}/>}
                renderSectionHeader={({section}) => (
                  <Text style={styles.sectionHeader}>{section.title}</Text>
                )}
                keyExtractor={item => `basicListEntry-${item.id}`}

            />
        </View>
    );
}

function FilterLibraryButton({ name, filterFunction })
{
    const [isSelected, setIsSelected] = useState(false);
    return (
        <Pressable style={styles.filterLibraryButton} onPress={() => filterFunction()}>
            <Text style={styles.filterLibraryTextColor}>{name}</Text>
        </Pressable>
    );
}

function LibrarySelectItem({ libraryItem })
{
    const [isSelected, setIsSelected] = useState(false);
    return (
        <Pressable style={styles.listItem} onPress={() => setIsSelected(!isSelected)}>
            <Text>{libraryItem.name}</Text>
        </Pressable>
    )
}