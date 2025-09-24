"use client";

import React, {useState, useRef, useEffect} from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { createBook } from "@/lib/bookService";
import { validateImageFile } from "@/lib/storageService";
import { BookFormData } from "@/types/book";
import { getUserProfile} from "@/lib/userService";

const POPULAR_GENRES = [
    "Fiction", "Non-fiction", "Mystery", "Romance", "Fantasy", "Science Fiction",
    "Thriller", "Biography", "History", "Self-help", "Adventure", "Drama",
    "Comedy", "Horror", "Young Adult", "Children's", "Poetry", "Memoir"
];

const WritePage: React.FC = () => {
    const { user } = useAuth();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [imagePreview, setImagePreview] = useState<string>("");
    const [username, setUsername] = useState<string>("");

    const [formData, setFormData] = useState<BookFormData>({
        title: "",
        description: "",
        genres: [],
        coverImage: undefined,
    });

    React.useEffect(() => {
        if (!user) {
            router.push("/signin");
        }
    }, [user, router]);

    useEffect(() => {
        const fetchUsername = async () => {
            if (!user) return;

            try {
                // Method 1: From Firebase Auth displayName (if set)
                if (user.displayName) {
                    setUsername(user.displayName);
                } else {
                    // Method 2: From Firestore user profile
                    const userProfile = await getUserProfile(user.uid);
                    if (userProfile) {
                        setUsername(userProfile.username);
                    }
                }
            } catch (error) {
                console.error("Error fetching username:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsername().then();
    }, [user]);

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

        if (!user) return;

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

            const bookId = await createBook(
                formData,
                user.uid,
                username || user.displayName || user.email || "Anonymous"
            );

            router.push(`/write/${bookId}`);
        } catch (error: any) {
            setError(error.message || "Failed to create book");
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation */}
            <div className="bg-green-400 shadow">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <button
                            onClick={() => router.back()}
                            className="text-gray-600 hover:text-gray-900"
                        >
                            ← Back
                        </button>
                        <h1 className="text-xl font-semibold text-gray-900">Create New Book</h1>
                        <div></div>
                    </div>
                </div>
            </div>

            {/* Form */}
            <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="bg-white shadow rounded-lg">
                    <form onSubmit={handleSubmit} className="space-y-6 p-6">
                        {error && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                                {error}
                            </div>
                        )}

                        {/* Cover Image */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Book Cover (Optional)
                            </label>
                            <div className="flex items-start space-x-4">
                                <div className="flex-shrink-0">
                                    {imagePreview ? (
                                        <div className="relative">
                                            <img
                                                src={imagePreview}
                                                alt="Cover preview"
                                                className="w-32 h-40 object-cover rounded-md border"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleRemoveImage}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="w-32 h-40 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center">
                                            <div className="text-center">
                                                <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                                        className="w-full px-3 py-2 text-gray-300 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                    <p className="mt-1 text-sm text-gray-500">
                                        Upload a cover image for your book. Recommended size: 400x600px. Max size: 5MB.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                                Book Title *
                            </label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                required
                                value={formData.title}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Enter your book title"
                            />
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                                Book Description *
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                required
                                rows={4}
                                value={formData.description}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Describe your book. What's it about? Who would enjoy reading it?"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Genres (Optional)
                            </label>
                            <p className="text-sm text-gray-500 mb-3">
                                Select genres that best describe your book
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {POPULAR_GENRES.map((genre) => (
                                    <button
                                        key={genre}
                                        type="button"
                                        onClick={() => handleGenreToggle(genre)}
                                        className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                                            formData.genres.includes(genre)
                                                ? "bg-indigo-600 text-white border-indigo-600"
                                                : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                                        }`}
                                    >
                                        {genre}
                                    </button>
                                ))}
                            </div>
                            {formData.genres.length > 0 && (
                                <p className="mt-2 text-sm text-gray-600">
                                    Selected: {formData.genres.join(", ")}
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end space-x-3 pt-6">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? "Creating..." : "Create Book & Start Writing"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default WritePage;