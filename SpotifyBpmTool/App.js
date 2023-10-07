import React, { useState, useEffect, useRef } from "react";
import { ActivityIndicator, Image, Pressable, SectionList, Text, View } from "react-native";
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

    const playlistsName = "Playlists";
    const [playlists, setPlaylists] = useState([]);
    const [playlistsFetched, setPlaylistsFetched] = useState(false);

    const tracksName = "Tracks";
    const [tracks, setTracks] = useState([]);
    const [tracksFetched, setTracksFetched] = useState(false);
    
    let selectedItems = useRef(new Set());
    const [selectedCount, setSelectedCount] = useState(0);
    const [filteredSections, setFilteredSections] = useState(new Set());

    // Default is a loading spinner. Will update to scrollview once items are loaded from API
    const [librarySelectItemListOrLoad, setLibrarySelectItemListOrLoad] = useState(<View style={{flex: 1, justifyContent: "center"}}><ActivityIndicator color="#1DB954" size="large" /></View>);

    // Nothing by default. This button will show once we have selected items
    const [nextButton, setNextButton] = useState(undefined);

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

    function ToggleFilter(name)
    {
        const newFilteredSections = new Set(filteredSections);
        if(newFilteredSections.has(name))
        {
            newFilteredSections.delete(name);
        }
        else
        {
            newFilteredSections.add(name);
        }
        setFilteredSections(newFilteredSections);

        // Clear selected items of items from the section being toggled off
        for(item of selectedItems.current)
        {
            if(name.includes(item.split(":")[0]))
            {
                selectedItems.current.delete(item);
            }
        }

        setSelectedCount(selectedItems.current.size);
    }

    function ToggleLibraryItem(toggleState, type, id)
    {
        let uri = type + ":" + id;

        if(!toggleState)
        {
            selectedItems.current.delete(uri);
        }
        else
        {
            selectedItems.current.add(uri);
        }

        setSelectedCount(selectedItems.current.size);
    }

    // Run immediately to fetch items via web API
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

    // Update scrollview based on what items are fetched via web API and which sections are filtered
    useEffect(() => {
        // Display a loading spinner until all items are fetched. 
        if (albumsFetched && playlistsFetched && tracksFetched)
        {
            // Filter out the sections from view
            const sections = [
                { title: "Albums", data: albums},
                { title: "Playlists", data: playlists},
                { title: "Tracks", data: tracks},
            ].filter(section => !filteredSections.has(section.title));

            setLibrarySelectItemListOrLoad(<SectionList 
                sections={sections}
                extraData={filteredSections}
                renderItem={({ section: { title }, item }) => <LibrarySelectItem libraryItem={item} toggleSelectionFunction={ToggleLibraryItem}/>}
                renderSectionHeader={({section}) => (
                <Text style={{color: "white", fontSize: 20}}>{section.title}</Text>
                )}
                keyExtractor={item => `libraryItem-${item.id}`}
            />);
        }
    }, [albumsFetched, playlistsFetched, tracksFetched, filteredSections]);
    
    const rightArrow = require("./assets/right-arrow.png");

    // Update "next" button with number of items currently selected
    useEffect(() => {
        if(selectedCount == 0)
        {
            setNextButton(undefined);
            return;
        }

        setNextButton(<Pressable style={{flexDirection: "row", alignItems: "center"}} onPress={() => _}>
            <Text style={{height: 30, color: "white", fontSize: 30}}>{selectedCount} item{(selectedCount > 1 ? "s" : "")}</Text>
            <View style={{flexDirection: "column", marginLeft: 5}}>
                <View style={{flex: 1}}/>
                <Image style={{width: 25, height: 25}} source={rightArrow}/>
            </View>
        </Pressable>)
    }, [selectedCount]);

    return (
        <View style={{backgroundColor: "#212121", flex: 1, flexDirection: "column"}}>
            <View style={{height: 20}}/>
            <View style={{margin: 20, padding: 10, flex: 1}}>
                <Text style={{color: "white", fontSize: 30}}>Select Library</Text>
                <View style={{flexDirection: "row"}}>
                    <FilterLibraryButton name={albumsName} toggleFunction={ToggleFilter} isToggled={!filteredSections.has(albumsName)}/>
                    <FilterLibraryButton name={playlistsName} toggleFunction={ToggleFilter} isToggled={!filteredSections.has(playlistsName)}/>
                    <FilterLibraryButton name={tracksName} toggleFunction={ToggleFilter} isToggled={!filteredSections.has(tracksName)}/>
                </View>
                {librarySelectItemListOrLoad}
                <View style={{flexDirection: "row"}}>
                    <View style={{flex: 1}}/>
                    {nextButton}
                </View>
            </View>
        </View>
    );
}

function FilterLibraryButton({ name, toggleFunction, isToggled })
{
    return (
        <Pressable style={(isToggled ? styles.filterLibraryButton : styles.filterLibraryButtonOff)} onPress={() => toggleFunction(name)}>
            <Text style={(isToggled ? styles.filterLibraryButtonText : styles.filterLibraryButtonTextOff)}>{name}</Text>
        </Pressable>
    );
}

function LibrarySelectItem({ libraryItem, toggleSelectionFunction })
{
    const [isSelected, setIsSelected] = useState(false);

    const detailString = libraryItem.type + " • " +  (libraryItem.type == "Playlist" ? libraryItem.owner : libraryItem.artists.join(", "));
    const radioSelected = require("./assets/radioSelected.png");
    const radioUnselected = require("./assets/radioUnselected.png");

    return (
        <Pressable onPress={() => { toggleSelectionFunction(!isSelected, libraryItem.type, libraryItem.id); setIsSelected(!isSelected); }}>
            <View style={{borderRadius: 10, padding: 10, margin: 3, backgroundColor: (isSelected ? "#1DB954" : "rgba(158, 150, 150, 0)"), flexDirection: "row", alignItems: "center"}}>
                <Image style={{width: 70, height: 70, borderRadius: 5}} source={{uri: libraryItem.imageUrl}}/>
                <View style={{padding: 10, flexDirection: "column", flex: 1}}>
                    <Text style={{padding: 5, color: "white", fontSize: 15, flex: 1}} numberOfLines={1} ellipsizeMode="tail">{libraryItem.name}</Text>
                    <Text style={{padding: 5, color: "white", fontSize: 10, flex: 1}} numberOfLines={1} ellipsizeMode="tail">{detailString}</Text>
                </View>
                <Image style={{width: 25, height: 25}} source={(isSelected ? radioSelected : radioUnselected)}/>
            </View>
        </Pressable>
    )
}