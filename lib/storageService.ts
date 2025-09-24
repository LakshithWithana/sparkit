import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "./firebase";

export const uploadBookCover = async (
    file: File,
    bookId: string,
    userId: string
): Promise<string> => {
    try {
        // Create a reference to the file location
        const fileName = `book-covers/${userId}/${bookId}/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, fileName);

        // Upload the file
        const snapshot = await uploadBytes(storageRef, file);

        // Get the download URL
        const downloadURL = await getDownloadURL(snapshot.ref);

        return downloadURL;
    } catch (error) {
        console.error("Error uploading book cover:", error);
        throw error;
    }
};

export const deleteBookCover = async (coverImageUrl: string): Promise<void> => {
    try {
        // Create a reference from the URL
        const storageRef = ref(storage, coverImageUrl);

        // Delete the file
        await deleteObject(storageRef);
    } catch (error) {
        console.error("Error deleting book cover:", error);
        // Don't throw error for delete operations to avoid blocking other operations
    }
};

export const validateImageFile = (file: File): string | null => {
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