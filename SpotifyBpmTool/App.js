import React, { useState, useEffect } from "react";
import { Text, View, Image, Pressable, SectionList } from "react-native";
import { SpotifyWebManager } from "./SpotifyWebManager";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { styles } from "./StyleSheet";
import { LibraryItem } from "./LibraryItem";

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
    const albumsName = "Albums";
    const [albums, setAlbums] = useState([]);
    const [albumsFetched, setAlbumsFetched] = useState(false);
    const [albumsToggled, setAlbumsToggled] = useState(true);

    const playlistsName = "Playlists";
    const [playlists, setPlaylists] = useState([]);
    const [playlistsFetched, setPlaylistsFetched] = useState(false);
    const [playlistsToggled, setPlaylistsToggled] = useState(true);

    const tracksName = "Tracks";
    const [tracks, setTracks] = useState([]);
    const [tracksFetched, setTracksFetched] = useState(false);
    const [tracksToggled, setTracksToggled] = useState(true);

    async function GetAlbums()
    {
        setAlbums(await spotifyWebManager.GetUsersSavedAlbumsAsync());
        setAlbumsFetched(true);
    }
    
    async function GetPlaylists()
    {
        setPlaylists(await spotifyWebManager.GetUsersSavedPlaylistsAsync());
        setPlaylistsFetched(true);
    }
    
    async function GetTracks()
    {
        setTracks(await spotifyWebManager.GetUsersSavedTracksAsync());
        setTracksFetched(true);
    }

    function Toggle(name)
    {
        switch(name)
        {
            case albumsName:
                setAlbumsToggled(!albumsToggled);
                break;
            case playlistsName:
                setPlaylistsToggled(!playlistsToggled);
                break;
            case tracksName:
                setTracksToggled(!tracksToggled);
                break;
        }
    }

    useEffect(() => {
        if(!albumsFetched)
        {
            GetAlbums();
        }
        if(!playlistsFetched)
        {
            GetPlaylists();
        }
        if(!tracksFetched)
        {
            GetTracks();
        }
    }, []);

    return (
        <View style={{backgroundColor: "#212121", flex: 1, flexDirection: "column"}}>
            <View style={{height: 20}}/>
            <View style={{margin: 20, padding: 10}}>
                <Text style={{color: "white", fontSize: 30}}>Select Library</Text>
                <View style={{flexDirection: "row"}}>
                    <FilterLibraryButton name={albumsName} toggleFunction={Toggle} isToggled={albumsToggled}/>
                    <FilterLibraryButton name={playlistsName} toggleFunction={Toggle} isToggled={playlistsToggled}/>
                    <FilterLibraryButton name={tracksName} toggleFunction={Toggle} isToggled={tracksToggled}/>
                </View>
                <SectionList 
                    sections={[
                        { title: "Albums", data: albumsToggled ? albums : []},
                        { title: "Playlists", data: playlistsToggled ? playlists : []},
                        { title: "Tracks", data: tracksToggled ? tracks : []},
                    ]}
                    renderItem={({ item }) => <LibrarySelectItem libraryItem={item}/>}
                    renderSectionHeader={({section}) => (
                    <Text style={{color: "white", fontSize: 20}}>{section.title}</Text>
                    )}
                    keyExtractor={item => `libraryItem-${item.id}`}
                />
            </View>
        </View>
    );
}

function FilterLibraryButton({ name, toggleFunction, isToggled })
{
    return (
        <Pressable style={styles.filterLibraryButton} onPress={() => toggleFunction(name)}>
            <Text style={styles.filterLibraryText}>{name}</Text>
        </Pressable>
    );
}

function LibrarySelectItem({ libraryItem })
{
    const [isSelected, setIsSelected] = useState(false);
    const detailString = libraryItem.type + " • " +  (libraryItem.type == "Playlist" ? libraryItem.owner : libraryItem.artists.join(", "));
    return (
        <Pressable onPress={() => setIsSelected(!isSelected)}>
            <View style={{margin: 5, flexDirection: "row"}}>
                <Image style={{width: 70, height: 70, borderRadius: 5}} source={{uri: libraryItem.imageUrl}}/>
                <View style={{padding: 10, flexDirection: "column"}}>
                    <Text style={{padding: 5, color: "white", fontSize: 15, flex: 1}} numberOfLines={1} ellipsizeMode="tail">{libraryItem.name}</Text>
                    <Text style={{padding: 5, color: "white", fontSize: 10, flex: 1}} numberOfLines={1} ellipsizeMode="tail">{detailString}</Text>
                </View>
            </View>
        </Pressable>
    )
}