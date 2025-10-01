import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
    serverTimestamp,
    Timestamp,
    updateDoc,
    where,
} from "firebase/firestore";
import {db} from "./firebase";
import {Book, BookFormData, Chapter, ChapterFormData} from "@/types/book";
import {deleteBookCover, uploadBookCover} from "./storageService";

// Book operations
export const createBook = async (
    bookData: BookFormData,
    authorId: string,
    authorName: string
): Promise<string> => {
    const book = {
        title: bookData.title,
        description: bookData.description,
        genres: bookData.genres,
        authorId,
        authorName,
        publishedChapters: 0,
        totalChapters: 0,
        status: 'draft' as const,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "books"), book);

    // Upload cover image if provided
    if (bookData.coverImage) {
        try {
            const coverImageUrl = await uploadBookCover(bookData.coverImage, docRef.id, authorId);
            await updateDoc(docRef, {
                coverImage: coverImageUrl,
                updatedAt: serverTimestamp(),
            });
        } catch (error) {
            console.error("Error uploading cover image:", error);
            // Continue without cover image
        }
    }

    return docRef.id;
};

export const updateBook = async (
    bookId: string,
    updates: Partial<BookFormData>,
    authorId?: string
): Promise<void> => {
    const bookRef = doc(db, "books", bookId);
    const updateData: Record<string, unknown> = {
        updatedAt: serverTimestamp(),
    };

    // Handle text updates
    if (updates.title) updateData.title = updates.title;
    if (updates.description) updateData.description = updates.description;
    if (updates.genres) updateData.genres = updates.genres;

    // Handle cover image upload
    if (updates.coverImage && authorId) {
        try {
            // Get current book data to delete old image
            const bookSnap = await getDoc(bookRef);
            if (bookSnap.exists() && bookSnap.data().coverImage) {
                await deleteBookCover(bookSnap.data().coverImage);
            }

            // Upload new image
            updateData.coverImage = await uploadBookCover(updates.coverImage, bookId, authorId);
        } catch (error) {
            console.error("Error updating cover image:", error);
            throw new Error("Failed to update cover image");
        }
    }

    await updateDoc(bookRef, updateData);
};

export const deleteBook = async (bookId: string): Promise<void> => {
    // Get book data to delete cover image
    const bookRef = doc(db, "books", bookId);
    const bookSnap = await getDoc(bookRef);

    if (bookSnap.exists() && bookSnap.data().coverImage) {
        await deleteBookCover(bookSnap.data().coverImage);
    }

    // Delete all chapters first
    const chaptersQuery = query(
        collection(db, "chapters"),
        where("bookId", "==", bookId)
    );
    const chaptersSnapshot = await getDocs(chaptersQuery);

    const deletePromises = chaptersSnapshot.docs.map(doc =>
        deleteDoc(doc.ref)
    );
    await Promise.all(deletePromises);

    // Delete the book
    await deleteDoc(bookRef);
};

export const getUserBooks = async (authorId: string): Promise<Book[]> => {
    const booksQuery = query(
        collection(db, "books"),
        where("authorId", "==", authorId),
        orderBy("updatedAt", "desc")
    );
    const snapshot = await getDocs(booksQuery);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp).toDate(),
        updatedAt: (doc.data().updatedAt as Timestamp).toDate(),
    })) as Book[];
};

export const getBook = async (bookId: string): Promise<Book | null> => {
    const bookRef = doc(db, "books", bookId);
    const bookSnap = await getDoc(bookRef);

    if (!bookSnap.exists()) return null;

    return {
        id: bookSnap.id,
        ...bookSnap.data(),
        createdAt: (bookSnap.data().createdAt as Timestamp).toDate(),
        updatedAt: (bookSnap.data().updatedAt as Timestamp).toDate(),
    } as Book;
};

// Chapter operations remain the same...
export const createChapter = async (
    bookId: string,
    chapterData: ChapterFormData,
    chapterNumber: number
): Promise<string> => {
    const chapter = {
        ...chapterData,
        bookId,
        chapterNumber,
        wordCount: chapterData.content.split(' ').length,
        isPublished: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "chapters"), chapter);

    // Update book's total chapters count
    const bookRef = doc(db, "books", bookId);
    const bookSnap = await getDoc(bookRef);
    if (bookSnap.exists()) {
        await updateDoc(bookRef, {
            totalChapters: (bookSnap.data().totalChapters || 0) + 1,
            updatedAt: serverTimestamp(),
        });
    }

    return docRef.id;
};

export const updateChapter = async (
    chapterId: string,
    updates: Partial<ChapterFormData>
): Promise<void> => {
    const updateData: Record<string, unknown> = {
        ...updates,
        updatedAt: serverTimestamp(),
    };

    if (updates.content) {
        updateData.wordCount = updates.content.split(' ').length;
    }

    const chapterRef = doc(db, "chapters", chapterId);
    await updateDoc(chapterRef, updateData);
};

export const publishChapter = async (chapterId: string): Promise<void> => {
    const chapterRef = doc(db, "chapters", chapterId);
    const chapterSnap = await getDoc(chapterRef);

    if (!chapterSnap.exists()) throw new Error("Chapter not found");

    await updateDoc(chapterRef, {
        isPublished: true,
        publishedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });

    // Update book's published chapters count
    const bookId = chapterSnap.data().bookId;
    const bookRef = doc(db, "books", bookId);
    const bookSnap = await getDoc(bookRef);

    if (bookSnap.exists()) {
        await updateDoc(bookRef, {
            publishedChapters: (bookSnap.data().publishedChapters || 0) + 1,
            updatedAt: serverTimestamp(),
        });
    }
};

export const unpublishChapter = async (chapterId: string): Promise<void> => {
    const chapterRef = doc(db, "chapters", chapterId);
    const chapterSnap = await getDoc(chapterRef);

    if (!chapterSnap.exists()) throw new Error("Chapter not found");

    await updateDoc(chapterRef, {
        isPublished: false,
        publishedAt: null,
        updatedAt: serverTimestamp(),
    });

    // Update book's published chapters count
    const bookId = chapterSnap.data().bookId;
    const bookRef = doc(db, "books", bookId);
    const bookSnap = await getDoc(bookRef);

    if (bookSnap.exists()) {
        const currentPublished = bookSnap.data().publishedChapters || 0;
        await updateDoc(bookRef, {
            publishedChapters: Math.max(0, currentPublished - 1),
            updatedAt: serverTimestamp(),
        });
    }
};

export const getBookChapters = async (bookId: string): Promise<Chapter[]> => {
    const chaptersQuery = query(
        collection(db, "chapters"),
        where("bookId", "==", bookId),
        orderBy("chapterNumber", "asc")
    );
    const snapshot = await getDocs(chaptersQuery);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp).toDate(),
        updatedAt: (doc.data().updatedAt as Timestamp).toDate(),
        publishedAt: doc.data().publishedAt
            ? (doc.data().publishedAt as Timestamp).toDate()
            : undefined,
    })) as Chapter[];
};

export const getPublishedChapters = async (bookId: string): Promise<Chapter[]> => {
    const chaptersQuery = query(
        collection(db, "chapters"),
        where("bookId", "==", bookId),
        where("isPublished", "==", true),
        orderBy("chapterNumber", "asc")
    );
    const snapshot = await getDocs(chaptersQuery);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp).toDate(),
        updatedAt: (doc.data().updatedAt as Timestamp).toDate(),
        publishedAt: (doc.data().publishedAt as Timestamp).toDate(),
    })) as Chapter[];
};

export const deleteChapter = async (chapterId: string): Promise<void> => {
    const chapterRef = doc(db, "chapters", chapterId);
    const chapterSnap = await getDoc(chapterRef);

    if (!chapterSnap.exists()) throw new Error("Chapter not found");

    const bookId = chapterSnap.data().bookId;
    const wasPublished = chapterSnap.data().isPublished;

    await deleteDoc(chapterRef);

    // Update book's chapter counts
    const bookRef = doc(db, "books", bookId);
    const bookSnap = await getDoc(bookRef);

    if (bookSnap.exists()) {
        const updates: Record<string, unknown> = {
            totalChapters: Math.max(0, (bookSnap.data().totalChapters || 0) - 1),
            updatedAt: serverTimestamp(),
        };

        if (wasPublished) {
            updates.publishedChapters = Math.max(0, (bookSnap.data().publishedChapters || 0) - 1);
        }

        await updateDoc(bookRef, updates);
    }
};

export const publishBook = async (bookId: string): Promise<void> => {
    const bookRef = doc(db, "books", bookId);
    await updateDoc(bookRef, {
        status: 'publishing',
        updatedAt: serverTimestamp(),
    });
};

export const unpublishBook = async (bookId: string): Promise<void> => {
    const bookRef = doc(db, "books", bookId);
    await updateDoc(bookRef, {
        status: 'draft',
        updatedAt: serverTimestamp(),
    });
};

export const getPublishedBooks = async (): Promise<Book[]> => {
    const booksQuery = query(
        collection(db, "books"),
        where("status", "in", ["publishing", "completed"]),
        orderBy("updatedAt", "desc")
    );
    const snapshot = await getDocs(booksQuery);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp).toDate(),
        updatedAt: (doc.data().updatedAt as Timestamp).toDate(),
    })) as Book[];
};