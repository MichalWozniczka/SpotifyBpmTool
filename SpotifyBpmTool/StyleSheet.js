import { StyleSheet } from "react-native";

export const styles = StyleSheet.create ({
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
    },
    filterLibraryButton: {
        margin: 10,
        padding: 10,
        backgroundColor: "#1DB954",
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(158, 150, 150, 0)',
    },
    filterLibraryButtonText: {
        color: "white",
        fontSize: 10,
        textAlign: "center",
    },
    filterLibraryButtonOff: {
        margin: 10,
        padding: 10,
        backgroundColor: 'rgba(158, 150, 150, 0)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#1DB954",
    },
    filterLibraryButtonTextOff: {
        color: "#1DB954",
        fontSize: 10,
        textAlign: "center",
    },
});