"use client";

import React, { useState, useRef, useEffect } from "react";
import { updateBook } from "@/lib/bookService";
import { validateImageFile } from "@/lib/storageService";
import { Book, BookFormData } from "@/types/book";

const POPULAR_GENRES = [
    "Fiction", "Non-fiction", "Mystery", "Romance", "Fantasy", "Science Fiction",
    "Thriller", "Biography", "History", "Self-help", "Adventure", "Drama",
    "Comedy", "Horror", "Young Adult", "Children's", "Poetry", "Memoir"
];

interface EditBookModalProps {
    book: Book;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
}

const EditBookModal: React.FC<EditBookModalProps> = ({
                                                         book,
                                                         isOpen,
                                                         onClose,
                                                         onUpdate,
                                                     }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [imagePreview, setImagePreview] = useState<string>("");

    const [formData, setFormData] = useState<BookFormData>({
        title: book.title,
        description: book.description,
        genres: book.genres,
        coverImage: undefined,
    });

    useEffect(() => {
        if (book) {
            setFormData({
                title: book.title,
                description: book.description,
                genres: book.genres,
                coverImage: undefined,
            });
            setImagePreview(book.coverImage || "");
        }
    }, [book]);

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate image
        const validationError = validateImageFile(file);
        if (validationError) {
            setError(validationError);
            return;
        }

        setFormData(prev => ({
            ...prev,
            coverImage: file,
        }));

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
        setError("");
    };

    const handleRemoveImage = () => {
        setFormData(prev => ({
            ...prev,
            coverImage: undefined,
        }));
        setImagePreview("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleGenreToggle = (genre: string) => {
        setFormData(prev => ({
            ...prev,
            genres: prev.genres.includes(genre)
                ? prev.genres.filter(g => g !== genre)
                : [...prev.genres, genre],
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            setError("Please enter a book title");
            return;
        }

        if (!formData.description.trim()) {
            setError("Please enter a book description");
            return;
        }

        try {
            setError("");
            setLoading(true);

            await updateBook(book.id, formData, book.authorId);
            onUpdate();
            onClose();
        } catch (error: any) {
            setError(error.message || "Failed to update book");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Edit Book</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                            {error}
                        </div>
                    )}

                    {/* Cover Image */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Book Cover
                        </label>
                        <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0">
                                {imagePreview ? (
                                    <div className="relative">
                                        <img
                                            src={imagePreview}
                                            alt="Cover preview"
                                            className="w-24 h-32 object-cover rounded-md border"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleRemoveImage}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ) : (
                                    <div className="w-24 h-32 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center">
                                        <div className="text-center">
                                            <svg className="mx-auto h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <p className="text-xs text-gray-500">Cover</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="w-full px-3 py-2 text-gray-400 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    Update cover image (optional). Max size: 5MB.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-2">
                            Book Title *
                        </label>
                        <input
                            type="text"
                            id="edit-title"
                            name="title"
                            required
                            value={formData.title}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-2">
                            Book Description *
                        </label>
                        <textarea
                            id="edit-description"
                            name="description"
                            required
                            rows={3}
                            value={formData.description}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Genres
                        </label>
                        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                            {POPULAR_GENRES.map((genre) => (
                                <button
                                    key={genre}
                                    type="button"
                                    onClick={() => handleGenreToggle(genre)}
                                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                                        formData.genres.includes(genre)
                                            ? "bg-green-500 text-white border-green-500"
                                            : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                                    }`}
                                >
                                    {genre}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Updating..." : "Update Book"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditBookModal;