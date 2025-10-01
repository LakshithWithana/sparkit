import {
    collection,
    addDoc,
    deleteDoc,
    getDocs,
    query,
    where,
    serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export interface FavoriteBook {
    id: string;
    userId: string;
    bookId: string;
    bookTitle: string;
    createdAt: Date;
}

export interface FavoriteAuthor {
    id: string;
    userId: string;
    authorId: string;
    authorName: string;
    createdAt: Date;
}

export const addFavoriteBook = async (
    userId: string,
    bookId: string,
    bookTitle: string
): Promise<void> => {
    try {
        // Check if already favorited
        const existingQuery = query(
            collection(db, "favoriteBooks"),
            where("userId", "==", userId),
            where("bookId", "==", bookId)
        );
        const existingSnapshot = await getDocs(existingQuery);

        if (!existingSnapshot.empty) {
            console.log("Book already in favorites");
            return;
        }

        const favoriteData = {
            userId,
            bookId,
            bookTitle,
            createdAt: serverTimestamp(),
        };

        await addDoc(collection(db, "favoriteBooks"), favoriteData);
        console.log("Book added to favorites");
    } catch (error) {
        console.error("Error adding favorite book:", error);
        throw error;
    }
};

export const removeFavoriteBook = async (
    userId: string,
    bookId: string
): Promise<void> => {
    try {
        const favoriteQuery = query(
            collection(db, "favoriteBooks"),
            where("userId", "==", userId),
            where("bookId", "==", bookId)
        );
        const snapshot = await getDocs(favoriteQuery);

        if (snapshot.empty) {
            console.log("Book not in favorites");
            return;
        }

        const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
        console.log("Book removed from favorites");
    } catch (error) {
        console.error("Error removing favorite book:", error);
        throw error;
    }
};

export const getUserFavoriteBooks = async (userId: string): Promise<FavoriteBook[]> => {
    try {
        const favoritesQuery = query(
            collection(db, "favoriteBooks"),
            where("userId", "==", userId)
        );
        const snapshot = await getDocs(favoritesQuery);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
        })) as FavoriteBook[];
    } catch (error) {
        console.error("Error fetching favorite books:", error);
        throw error;
    }
};

export const addFavoriteAuthor = async (
    userId: string,
    authorId: string,
    authorName: string
): Promise<void> => {
    try {
        // Check if already favorited
        const existingQuery = query(
            collection(db, "favoriteAuthors"),
            where("userId", "==", userId),
            where("authorId", "==", authorId)
        );
        const existingSnapshot = await getDocs(existingQuery);

        if (!existingSnapshot.empty) {
            console.log("Author already in favorites");
            return;
        }

        const favoriteData = {
            userId,
            authorId,
            authorName,
            createdAt: serverTimestamp(),
        };

        await addDoc(collection(db, "favoriteAuthors"), favoriteData);
        console.log("Author added to favorites");
    } catch (error) {
        console.error("Error adding favorite author:", error);
        throw error;
    }
};

export const removeFavoriteAuthor = async (
    userId: string,
    authorId: string
): Promise<void> => {
    try {
        const favoriteQuery = query(
            collection(db, "favoriteAuthors"),
            where("userId", "==", userId),
            where("authorId", "==", authorId)
        );
        const snapshot = await getDocs(favoriteQuery);

        if (snapshot.empty) {
            console.log("Author not in favorites");
            return;
        }

        const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
        console.log("Author removed from favorites");
    } catch (error) {
        console.error("Error removing favorite author:", error);
        throw error;
    }
};

export const getUserFavoriteAuthors = async (userId: string): Promise<FavoriteAuthor[]> => {
    try {
        const favoritesQuery = query(
            collection(db, "favoriteAuthors"),
            where("userId", "==", userId)
        );
        const snapshot = await getDocs(favoritesQuery);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
        })) as FavoriteAuthor[];
    } catch (error) {
        console.error("Error fetching favorite authors:", error);
        throw error;
    }
};

export const isAuthorFavorited = async (
    userId: string,
    authorId: string
): Promise<boolean> => {
    try {
        const favoriteQuery = query(
            collection(db, "favoriteAuthors"),
            where("userId", "==", userId),
            where("authorId", "==", authorId)
        );
        const snapshot = await getDocs(favoriteQuery);

        return !snapshot.empty;
    } catch (error) {
        console.error("Error checking favorite author:", error);
        return false;
    }
};