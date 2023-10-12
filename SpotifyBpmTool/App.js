import React, { useState, useEffect, useRef } from "react";
import { ActivityIndicator, FlatList, Image, Pressable, SectionList, Text, TextInput, View } from "react-native";
import { SpotifyWebManager } from "./SpotifyWebManager";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { styles } from "./StyleSheet";
import { LibraryItem } from "./LibraryItem";
import Dialog from "react-native-dialog";


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
        <View style={{flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#212020",}}>
            <Pressable style={{margin: 20, padding: 20, backgroundColor: "#1DB954", borderRadius: 40, borderWidth: 1, borderColor: 'rgba(158, 150, 150, 0)',}} onPress={() => loginSpotifyWebManager()}>
                <Text style={{color: "white", fontSize: 30, textAlign: "center",}}>Connect to Spotify</Text>
            </Pressable>
        </View>
    );
}

function PlaylistScreen({ navigation, route })
{
    const [tempoLowerLimit, setTempoLowerLimit] = useState(0);
    const [tempoUpperLimit, setTempoUpperLimit] = useState(0);
    const [tracks, setTracks] = useState([]);
    const [tracksFetched, setTracksFetched] = useState(false);
    const [savePlaylistDialogVisible, setSavePlaylistDialogVisible] = useState(false);
    const [savePlaylistName, setSavePlaylistName] = useState("New playlist filtered by tempo");
    let excludedTracks = useRef(new Set());
    const [excludedTracksCount, setExcludedTracksCount] = useState(0);
    const [playlistToSaveLength, setPlaylistToSaveLength] = useState(0);
    const [savePlaylistButton, setSavePlaylistButton] = useState(undefined);

    // Default is a loading spinner. Will update to scrollview once items are loaded from API
    const [libraryItemListOrLoad, setLibraryItemListOrLoad] = useState(<View style={{flex: 1, justifyContent: "center"}}><ActivityIndicator color="#1DB954" size="large" /></View>);

    function onTempoLowerLimitChanged(input)
    {
        let numericInput = input.replace(/[^0-9]/g, '');

        if(numericInput.length == 0)
        {
            numericInput = "0";
        }

        setTempoLowerLimit(Math.min(Math.floor(Number(numericInput)), 1000000));
    }

    function onTempoUpperLimitChanged(input)
    {
        let numericInput = input.replace(/[^0-9]/g, '');

        if(numericInput.length == 0)
        {
            numericInput = "0";
        }

        setTempoUpperLimit(Math.min(Math.floor(Number(numericInput)), 1000000));
    }

    function onSavePlaylistDialogCancel()
    {
        setSavePlaylistName("New playlist filtered by tempo");
        setSavePlaylistDialogVisible(false);
    }

    async function onSavePlaylistDialogSave()
    {
        console.log("Saving playlist with name " + savePlaylistName + " to Spotify");
        setSavePlaylistDialogVisible(false);
        let trackIds = getUnexcludedTracksSortedAndFilteredByTempo().map(track => track.id);
        await spotifyWebManager.CreateAndPopulatePlaylistFromTracksAsync(savePlaylistName, trackIds);
    }

    function onSavePlaylistDialogNameUpdated(name)
    {
        setSavePlaylistName(name);
    }

    function onSavePlaylistDialogShow()
    {
        if(playlistToSaveLength == 0)
        {
            console.log("Attempted to show name playlist dialog, but there are no selected tracks to save");
            return;
        }
        console.log("Showing name playlist dialog");
        setSavePlaylistDialogVisible(true);
    }

    function areTempoLimitsValid()
    {
        return tempoLowerLimit <= tempoUpperLimit;
    }

    function getTracksSortedAndFilteredByTempo()
    {
        let filteredTracks = tracks;
        if(areTempoLimitsValid() && !(tempoLowerLimit == 0 && tempoUpperLimit == 0))
        {
            filteredTracks = filteredTracks.filter(track => track.tempo >= tempoLowerLimit && track.tempo <= tempoUpperLimit);
        }

        return filteredTracks;
    }

    function getUnexcludedTracksSortedAndFilteredByTempo()
    {
        return getTracksSortedAndFilteredByTempo().filter(track => !excludedTracks.current.has(track.id));
    }

    async function GetTracksWithInfo()
    {
        console.log("Getting tracks and populating bpm from item list " + route.params.selectedItems);
        let trackItems = await spotifyWebManager.GetTracksFromUrisAsync(route.params.selectedItems);

        let trackIdArray = trackItems.map(track => track.id);
        let idToTempoMap = await spotifyWebManager.GetTrackTemposAsync(trackIdArray);

        console.log("Updating existing track items with fetched tempos");
        for(let i = 0; i < trackItems.length; ++i)
        {
            trackItems[i].tempo = idToTempoMap[trackItems[i].id];
        }

        // Filter out tracks that don't have a tempo associated with them (these are probably locally added songs, but we don't want them)
        trackItems = trackItems.filter(trackItem => !!trackItem.tempo);

        // Sort by tempo now so we don't have to worry about it in the future
        trackItems = trackItems.sort((a, b) => a.tempo - b.tempo);

        setTracks(trackItems);
        setTracksFetched(true);
        console.log("Got tracks with bpms.");
    }

    function ToggleExcludedTrackFunction(toggleState, id)
    {
        if(!toggleState)
        {
            console.log("Un-excluding item " + id + " due to user interaction");
            excludedTracks.current.delete(id);
        }
        else
        {
            console.log("Excluding item " + id + " due to user interaction");
            excludedTracks.current.add(id);
        }

        setExcludedTracksCount(excludedTracks.current.size);
    }

    // Run immediately to fetch tracks via web API
    useEffect(() => {
        if(!tracksFetched)
        {
            GetTracksWithInfo();
        }
    }, []);

    // Update scrollview based on whether we fetched the items and the tempo
    useEffect(() => {
        // Display a loading spinner until all items are fetched. 
        if (tracksFetched)
        {
            let tracks = getTracksSortedAndFilteredByTempo()

            if(tracks.length == 0)
            {
                setLibraryItemListOrLoad(<Text style={{padding: 5, color: "#bdbdbd", fontSize: 15, flex: 1}}>There's nothing here...</Text>)
            }
            else
            {
                setLibraryItemListOrLoad(<FlatList
                    data={tracks}
                    renderItem={({item}) => <LibraryPlaylistItem libraryItem={item} ToggleExcludedTrackFunction={ToggleExcludedTrackFunction} excluded={excludedTracks.current.has(item.id)} />}
                    keyExtractor={item => `libraryPlaylistItem-${item.id}`}
                />);
            }
        }
    }, [tracksFetched, tempoLowerLimit, tempoUpperLimit]);

    useEffect(() => {
        setPlaylistToSaveLength(getUnexcludedTracksSortedAndFilteredByTempo().length);
    }, [tracksFetched, tempoLowerLimit, tempoUpperLimit, excludedTracksCount]);
    
    const textStyle = {margin: 5, color: "white", fontSize: 20 };
    const textInputStyle = {margin: 5, color: "white", height: 25, width: 35, textAlign: "center", borderWidth: 1, backgroundColor: "#2e2e2e", borderRadius: 3, borderColor: (areTempoLimitsValid() ? "white" : "red")};
    const rightArrow = require("./assets/right-arrow.png");
    const leftArrow = require("./assets/left-arrow.png");

    return (
        <View style={{backgroundColor: "#212121", flex: 1, flexDirection: "column"}}>
            <View style={{height: 20}}/>
            <View style={{marginTop: 20, marginLeft: 10, marginRight: 10, padding: 10, flex: 1}}>
                <Text style={{color: "white", fontSize: 30}}>Filter By Tempo</Text>
                <View style={{flexDirection: "row", alignItems: "center", paddingBottom: 8}}>
                    <Text style={textStyle}>Lower:</Text><TextInput style={textInputStyle} inputMode="numeric" placeholder="0" placeholderTextColor="#bdbdbd" onChangeText={onTempoLowerLimitChanged}/>
                    <Text style={textStyle}>Upper:</Text><TextInput style={textInputStyle} inputMode="numeric" placeholder="0" placeholderTextColor="#bdbdbd" onChangeText={onTempoUpperLimitChanged}/>
                </View>
                {libraryItemListOrLoad}
                <View style={{height: 50, padding: 8, flexDirection: "row"}}>
                    <Pressable style={{flexDirection: "row", alignItems: "center"}} onPress={() => {
                            console.log("Navigating back to Library Select screen.");
                            navigation.goBack();
                        }}>
                        <View style={{flexDirection: "column"}}>
                            <View style={{flex: 1}}/>
                            <Image style={{width: 25, height: 25}} source={leftArrow}/>
                        </View>
                    </Pressable>
                    <View style={{flex: 1}}/>
                    {savePlaylistButton}
                    <Pressable style={{flexDirection: "row", alignItems: "center"}} onPress={() => onSavePlaylistDialogShow()}>
                        {playlistToSaveLength == 0 ? undefined : <Text style={{color: "white", fontSize: 15, textAlign: "right"}}>Save as{"\n"}Spotify playlist</Text>}
                        <View style={{flexDirection: "column", marginLeft: 5}}>
                            <View style={{flex: 1}}/>
                            {playlistToSaveLength == 0 ? undefined : <Image style={{width: 25, height: 25}} source={rightArrow}/>}
                        </View>
                    </Pressable>
                </View>
            </View>
            <Dialog.Container visible={savePlaylistDialogVisible} onBackdropPress={onSavePlaylistDialogCancel} onRequestClose={onSavePlaylistDialogCancel}>
                <Dialog.Title>Name Your Playlist</Dialog.Title>
                <Dialog.Input onChangeText={onSavePlaylistDialogNameUpdated}/>
                <Dialog.Button color="#1DB954" label="Cancel" onPress={onSavePlaylistDialogCancel}/>
                <Dialog.Button color="#1DB954" label="Save to Spotify" onPress={onSavePlaylistDialogSave}/>
            </Dialog.Container>
        </View>
    );
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

    function ToggleSectionFunction(name)
    {
        const newFilteredSections = new Set(filteredSections);
        if(newFilteredSections.has(name))
        {
            console.log("Toggling section  " + name + " on");
            newFilteredSections.delete(name);
        }
        else
        {
            console.log("Toggling section " + name + " off");
            newFilteredSections.add(name);
        }
        setFilteredSections(newFilteredSections);

        // Clear selected items of items from the section being toggled off
        for(let item of selectedItems.current)
        {
            if(name.includes(item.split(":")[0]))
            {
                console.log("De-selecting item " + item + " due to section " + name + " being toggled off");
                selectedItems.current.delete(item);
            }
        }

        setSelectedCount(selectedItems.current.size);
    }

    function ToggleLibraryItemFunction(toggleState, type, id)
    {
        let uri = type + ":" + id;

        if(!toggleState)
        {
            console.log("De-selecting item " + uri + " due to user interaction");
            selectedItems.current.delete(uri);
        }
        else
        {
            console.log("Selecting item " + uri + " due to user interaction");
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
                renderItem={({item}) => <LibrarySelectItem libraryItem={item} ToggleLibraryItemFunction={ToggleLibraryItemFunction}/>}
                renderSectionHeader={({section}) => (<Text style={{color: "white", fontSize: 20}}>{section.title}</Text>)}
                keyExtractor={item => `librarySelectItem-${item.id}`}
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

        setNextButton(<Pressable style={{flexDirection: "row", alignItems: "center"}} onPress={() => {
                    let selectedItemsArray = Array.from(selectedItems.current);
                    console.log("Navigating to Playlist screen. Sending over selected items: " + selectedItemsArray) ;
                    navigation.navigate("Playlist", { selectedItems: selectedItemsArray });
                }
            }>
            <Text style={{alignSelf: "center", color: "white", fontSize: 30}}>{selectedCount} item{(selectedCount > 1 ? "s" : "")}</Text>
            <View style={{flexDirection: "column", marginLeft: 5}}>
                <View style={{flex: 1}}/>
                <Image style={{width: 25, height: 25}} source={rightArrow}/>
            </View>
        </Pressable>)
    }, [selectedCount]);

    return (
        <View style={{backgroundColor: "#212121", flex: 1, flexDirection: "column"}}>
            <View style={{height: 20}}/>
            <View style={{marginTop: 20, marginLeft: 10, marginRight: 10, padding: 10, flex: 1}}>
                <Text style={{color: "white", fontSize: 30}}>Select Library</Text>
                <View style={{flexDirection: "row", paddingBottom: 5}}>
                    <FilterLibraryButton name={albumsName} ToggleSectionFunction={ToggleSectionFunction} isToggled={!filteredSections.has(albumsName)}/>
                    <FilterLibraryButton name={playlistsName} ToggleSectionFunction={ToggleSectionFunction} isToggled={!filteredSections.has(playlistsName)}/>
                    <FilterLibraryButton name={tracksName} ToggleSectionFunction={ToggleSectionFunction} isToggled={!filteredSections.has(tracksName)}/>
                </View>
                {librarySelectItemListOrLoad}
                <View style={{height: 45, padding: 8, flexDirection: "row"}}>
                    <View style={{flex: 1}}/>
                    {nextButton}
                </View>
            </View>
        </View>
    );
}

function FilterLibraryButton({ name, ToggleSectionFunction, isToggled })
{
    return (
        <Pressable style={{margin: 10, padding: 8, backgroundColor: (isToggled ? "#1DB954" : "rgba(158, 150, 150, 0)"), borderRadius: 20, borderWidth: 1, borderColor: "#1DB954",}} onPress={() => ToggleSectionFunction(name)}>
            <Text style={{color: (isToggled ? "white" : "#1DB954"), fontSize: 15, textAlign: "center",}}>{name}</Text>
        </Pressable>
    );
}

function LibraryPlaylistItem({ libraryItem, ToggleExcludedTrackFunction, excluded })
{
    const [isExcluded, setIsExcluded] = useState(excluded);
    const hiddenIcon = require("./assets/hidden.png");
    const visibleIcon = require("./assets/visible.png");
    const itemDetails = <View style={{flex: 1, flexDirection: "row",  alignItems: "center",}}>
        <LibraryItemInfo libraryItem={libraryItem}/>
        <View style={{padding: 10, flexDirection: "column", justifyContent: "center", alignItems: "center"}}>
            <Text style={{fontSize: 20, color: "white", justifyContent: "center"}} numberOfLines={1} ellipsizeMode="tail">{libraryItem.tempo}</Text>
            <Text style={{fontSize: 10, color: "white", justifyContent: "center"}} numberOfLines={1} ellipsizeMode="tail">BPM</Text>
        </View>
    </View>;

    return (
        <View style={styles.libraryItem}>
            {isExcluded ? <Text style={{padding: 5, color: "#bdbdbd", fontSize: 10, flex: 1, fontStyle: "italic"}}>Excluded</Text> : itemDetails}
            <Pressable style={{marginLeft: "auto"}} onPress={() => {ToggleExcludedTrackFunction(!isExcluded, libraryItem.id); setIsExcluded(!isExcluded)}}>
                <Image style={{width: 25, height: 25}} source={(isExcluded ? hiddenIcon : visibleIcon)}/>
            </Pressable>
        </View>
    );
}

function LibrarySelectItem({ libraryItem, ToggleLibraryItemFunction })
{
    const [isSelected, setIsSelected] = useState(false);

    const radioSelected = require("./assets/radioSelected.png");
    const radioUnselected = require("./assets/radioUnselected.png");

    return (
        <Pressable onPress={() => { ToggleLibraryItemFunction(!isSelected, libraryItem.type, libraryItem.id); setIsSelected(!isSelected); }}>
            <View style={[styles.libraryItem, {backgroundColor: (isSelected ? "#1DB954" : styles.libraryItem.backgroundColor)}]}>
                <LibraryItemInfo libraryItem={libraryItem}/>
                <Image style={{width: 25, height: 25}} source={(isSelected ? radioSelected : radioUnselected)}/>
            </View>
        </Pressable>
    );
}

function LibraryItemInfo({ libraryItem })
{
    const detailString = libraryItem.type + " • " +  (libraryItem.type == "Playlist" ? libraryItem.owner : libraryItem.artists.join(", "));

    return (
        <View style={{flex: 1, flexDirection: "row",  alignItems: "center",}}>
            <Image style={{width: 70, height: 70, borderRadius: 5}} source={{uri: libraryItem.imageUrl}}/>
            <View style={{padding: 10, flexDirection: "column", flex: 1}}>
                <Text style={{padding: 5, color: "white", fontSize: 15, flex: 1}} numberOfLines={1} ellipsizeMode="tail">{libraryItem.name}</Text>
                <Text style={{padding: 5, color: "white", fontSize: 10, flex: 1}} numberOfLines={1} ellipsizeMode="tail">{detailString}</Text>
            </View>
        </View>
    );
}