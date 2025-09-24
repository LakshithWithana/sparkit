import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    serverTimestamp,
    Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { UserProfile } from "@/types/auth";

export const checkUsernameAvailability = async (username: string): Promise<boolean> => {
    try {
        console.log("Checking availability for username:", username);

        const usernameQuery = query(
            collection(db, "users"),
            where("username", "==", username.toLowerCase())
        );
        const snapshot = await getDocs(usernameQuery);

        console.log("Username check result - isEmpty:", snapshot.empty);
        return snapshot.empty;
    } catch (error) {
        console.error("Error checking username availability:", error);
        throw error;
    }
};

export const createUserProfile = async (
    uid: string,
    email: string,
    username: string
): Promise<void> => {
    try {
        console.log("Creating user profile with data:", { uid, email, username });

        const userProfile = {
            uid,
            username: username.toLowerCase(),
            email,
            displayName: username,
            createdAt: serverTimestamp(),
        };

        console.log("Adding document to users collection...");
        const docRef = await addDoc(collection(db, "users"), userProfile);
        console.log("User profile created with document ID:", docRef.id);
    } catch (error) {
        console.error("Error creating user profile:", error);
        throw error;
    }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    const userQuery = query(
        collection(db, "users"),
        where("uid", "==", uid)
    );
    const snapshot = await getDocs(userQuery);

    if (snapshot.empty) return null;

    const userData = snapshot.docs[0].data();
    return {
        uid: userData.uid,
        username: userData.displayName || userData.username,
        email: userData.email,
        createdAt: (userData.createdAt as Timestamp).toDate(),
    } as UserProfile;
};

export const getUserByUsername = async (username: string): Promise<UserProfile | null> => {
    const userQuery = query(
        collection(db, "users"),
        where("username", "==", username.toLowerCase())
    );
    const snapshot = await getDocs(userQuery);

    if (snapshot.empty) return null;

    const userData = snapshot.docs[0].data();
    return {
        uid: userData.uid,
        username: userData.displayName || userData.username,
        email: userData.email,
        createdAt: (userData.createdAt as Timestamp).toDate(),
    } as UserProfile;
};