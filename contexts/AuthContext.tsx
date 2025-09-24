"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
    User,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { AuthContextType } from "@/types/auth";
import {
    checkUsernameAvailability,
    createUserProfile,
    getUserProfile
} from "@/lib/userService";

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    signUp: async () => {},
    signIn: async () => {},
    signInWithGoogle: async () => {},
    signOut: async () => {},
});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

interface AuthProviderProps {
    children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Check if user has profile, if not create one (for Google sign-ins)
                const profile = await getUserProfile(user.uid);
                if (!profile && user.email) {
                    // Create profile with email as username for Google users
                    const username = user.displayName || user.email.split('@')[0];
                    await createUserProfile(user.uid, user.email, username);
                }
            }
            setUser(user);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signUp = async (email: string, password: string, username: string): Promise<void> => {
        try {
            console.log("Starting signup process for username:", username);

            // Create user account first
            console.log("Creating Firebase Auth user...");
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            console.log("Firebase Auth user created:", userCredential.user.uid);

            try {
                // Check if username is available now that user is authenticated
                console.log("Checking username availability...");
                const isAvailable = await checkUsernameAvailability(username);
                console.log("Username availability:", isAvailable);

                if (!isAvailable) {
                    // Delete the created user if username is taken
                    await userCredential.user.delete();
                    throw new Error("Username is already taken");
                }

                // Update user profile with display name
                console.log("Updating user profile...");
                await updateProfile(userCredential.user, {
                    displayName: username,
                });
                console.log("User profile updated with displayName:", username);

                // Create user profile in Firestore
                console.log("Creating Firestore user profile...");
                await createUserProfile(userCredential.user.uid, userCredential.user.email!, username);
                console.log("Firestore user profile created successfully");

            } catch (error) {
                // If anything fails after user creation, delete the auth user
                try {
                    await userCredential.user.delete();
                } catch (deleteError) {
                    console.error("Error deleting user after failure:", deleteError);
                }
                throw error;
            }

        } catch (error) {
            console.error("Signup error:", error);
            throw error;
        }
    };

    const signIn = async (email: string, password: string): Promise<void> => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            throw error;
        }
    };

    const signInWithGoogle = async (): Promise<void> => {
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);

            // Check if user profile exists
            const profile = await getUserProfile(result.user.uid);
            if (!profile) {
                // Create profile for new Google user
                const username = result.user.displayName || result.user.email?.split('@')[0] || 'user';
                await createUserProfile(result.user.uid, result.user.email!, username);
            }
        } catch (error) {
            throw error;
        }
    };

    const signOut = async (): Promise<void> => {
        try {
            await firebaseSignOut(auth);
        } catch (error) {
            throw error;
        }
    };

    const value: AuthContextType = {
        user,
        loading,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};