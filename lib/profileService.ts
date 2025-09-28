import {
    collection,
    doc,
    getDoc,
    getDocs,
    updateDoc,
    query,
    where,
    serverTimestamp,
    Timestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "./firebase";
import { UserProfile, ProfileFormData } from "@/types/auth";

export const uploadProfilePicture = async (
    file: File,
    userId: string
): Promise<string> => {
    try {
        // Create a reference to the file location
        const fileName = `profile-pictures/${userId}/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, fileName);

        // Upload the file
        const snapshot = await uploadBytes(storageRef, file);

        // Get the download URL
        const downloadURL = await getDownloadURL(snapshot.ref);

        return downloadURL;
    } catch (error) {
        console.error("Error uploading profile picture:", error);
        throw error;
    }
};

export const deleteProfilePicture = async (profilePicUrl: string): Promise<void> => {
    try {
        // Create a reference from the URL
        const storageRef = ref(storage, profilePicUrl);

        // Delete the file
        await deleteObject(storageRef);
    } catch (error) {
        console.error("Error deleting profile picture:", error);
        // Don't throw error for delete operations to avoid blocking other operations
    }
};

export const validateProfileImage = (file: File): string | null => {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        return 'Please select a valid image file (JPEG, PNG, or WebP)';
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
        return 'Image size should be less than 5MB';
    }

    return null; // No error
};

export const updateUserProfile = async (
    userId: string,
    profileData: ProfileFormData
): Promise<void> => {
    try {
        // Find the user document
        const usersQuery = query(
            collection(db, "users"),
            where("uid", "==", userId)
        );
        const usersSnapshot = await getDocs(usersQuery);

        if (usersSnapshot.empty) {
            throw new Error("User profile not found");
        }

        const userDocRef = usersSnapshot.docs[0].ref;
        const currentData = usersSnapshot.docs[0].data();

        const updateData: any = {
            displayName: profileData.displayName,
            bio: profileData.bio || "",
            location: profileData.location || "",
            socialLinks: profileData.socialLinks || {},
            updatedAt: serverTimestamp(),
        };

        // Handle profile picture upload
        if (profileData.profilePic) {
            try {
                // Delete old profile picture if exists
                if (currentData.profilePic) {
                    await deleteProfilePicture(currentData.profilePic);
                }

                // Upload new profile picture
                const profilePicUrl = await uploadProfilePicture(profileData.profilePic, userId);
                updateData.profilePic = profilePicUrl;
            } catch (error) {
                console.error("Error updating profile picture:", error);
                throw new Error("Failed to update profile picture");
            }
        }

        await updateDoc(userDocRef, updateData);
    } catch (error) {
        console.error("Error updating user profile:", error);
        throw error;
    }
};

export const getUserProfileByUid = async (uid: string): Promise<UserProfile | null> => {
    try {
        const userQuery = query(
            collection(db, "users"),
            where("uid", "==", uid)
        );
        const snapshot = await getDocs(userQuery);

        if (snapshot.empty) return null;

        const userData = snapshot.docs[0].data();
        return {
            uid: userData.uid,
            username: userData.username,
            email: userData.email,
            displayName: userData.displayName || userData.username,
            profilePic: userData.profilePic,
            bio: userData.bio || "",
            location: userData.location || "",
            socialLinks: userData.socialLinks || {},
            createdAt: (userData.createdAt as Timestamp).toDate(),
            updatedAt: userData.updatedAt ? (userData.updatedAt as Timestamp).toDate() : undefined,
        } as UserProfile;
    } catch (error) {
        console.error("Error fetching user profile:", error);
        throw error;
    }
};

export const getUserProfileByUsername = async (username: string): Promise<UserProfile | null> => {
    try {
        const userQuery = query(
            collection(db, "users"),
            where("username", "==", username.toLowerCase())
        );
        const snapshot = await getDocs(userQuery);

        if (snapshot.empty) return null;

        const userData = snapshot.docs[0].data();
        return {
            uid: userData.uid,
            username: userData.username,
            email: userData.email,
            displayName: userData.displayName || userData.username,
            profilePic: userData.profilePic,
            bio: userData.bio || "",
            location: userData.location || "",
            socialLinks: userData.socialLinks || {},
            createdAt: (userData.createdAt as Timestamp).toDate(),
            updatedAt: userData.updatedAt ? (userData.updatedAt as Timestamp).toDate() : undefined,
        } as UserProfile;
    } catch (error) {
        console.error("Error fetching user profile by username:", error);
        throw error;
    }
};