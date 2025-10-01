"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getUserFavoriteBooks, removeFavoriteBook, FavoriteBook } from "@/lib/favoriteService";
import { getBook } from "@/lib/bookService";
import { Book } from "@/types/book";

interface FavoriteBookWithDetails extends FavoriteBook {
    bookDetails: Book | null;
}

const FavoriteBooksPage: React.FC = () => {
    const { user } = useAuth();
    const router = useRouter();
    const [favoriteBooks, setFavoriteBooks] = useState<FavoriteBookWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [removingBooks, setRemovingBooks] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!user) {
            router.push("/signin");
            return;
        }

        loadFavoriteBooks();
    }, [user, router]);

    const loadFavoriteBooks = async () => {
        if (!user) return;

        try {
            setLoading(true);
            const favorites = await getUserFavoriteBooks(user.uid);

            // Fetch full book details for each favorite
            const favoritesWithDetails = await Promise.all(
                favorites.map(async (favorite) => {
                    const bookDetails = await getBook(favorite.bookId);
                    return {
                        ...favorite,
                        bookDetails,
                    };
                })
            );

            // Filter out favorites where book was deleted
            const validFavorites = favoritesWithDetails.filter(
                (fav) => fav.bookDetails !== null
            );

            setFavoriteBooks(validFavorites);
        } catch (error: any) {
            setError(error.message || "Failed to load favorite books");
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveFavorite = async (bookId: string) => {
        if (!user) return;

        // Prevent multiple clicks
        if (removingBooks.has(bookId)) return;

        if (!window.confirm("Remove this book from your favorites?")) {
            return;
        }

        setRemovingBooks((prev) => new Set([...prev, bookId]));

        try {
            await removeFavoriteBook(user.uid, bookId);
            // Remove from local state
            setFavoriteBooks((prev) =>
                prev.filter((fav) => fav.bookId !== bookId)
            );
        } catch (error: any) {
            setError(error.message || "Failed to remove favorite");
        } finally {
            setRemovingBooks((prev) => {
                const newSet = new Set(prev);
                newSet.delete(bookId);
                return newSet;
            });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading favorite books...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation */}
            <div className="bg-green-400 shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center space-x-4">
                            <Link href="/" className="text-gray-600 hover:text-gray-900">
                                ← Back to Home
                            </Link>
                            <h1 className="text-2xl font-bold text-gray-900">Favorite Books</h1>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                            {error}
                        </div>
                    )}

                    {favoriteBooks.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-gray-400">
                                <svg
                                    className="mx-auto h-12 w-12"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                    />
                                </svg>
                            </div>
                            <h3 className="mt-2 text-sm font-medium text-gray-900">
                                No favorite books yet
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Start exploring and add books to your favorites!
                            </p>
                            <div className="mt-6">
                                <Link
                                    href="/"
                                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                                >
                                    Discover Books
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                            {favoriteBooks.map((favorite) => {
                                const book = favorite.bookDetails;
                                if (!book) return null;

                                const isRemoving = removingBooks.has(book.id);

                                return (
                                    <div
                                        key={favorite.id}
                                        className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
                                    >
                                        <div className="p-6">
                                            <div className="flex gap-4">
                                                {/* Book Cover */}
                                                <div className="flex-shrink-0">
                                                    {book.coverImage ? (
                                                        <img
                                                            src={book.coverImage}
                                                            alt={`${book.title} cover`}
                                                            className="w-24 h-32 object-cover rounded-md border"
                                                        />
                                                    ) : (
                                                        <div className="w-24 h-32 bg-gray-200 rounded-md border flex items-center justify-center">
                                                            <svg
                                                                className="w-8 h-8 text-gray-400"
                                                                fill="none"
                                                                viewBox="0 0 24 24"
                                                                stroke="currentColor"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={2}
                                                                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                                                                />
                                                            </svg>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Book Info */}
                                                <div className="flex-1 min-w-0 flex flex-col">
                                                    <div className="flex items-start justify-between">
                                                        <h3 className="text-lg font-medium text-gray-900 mb-2 line-clamp-2 min-h-[3.5rem]">
                                                            {book.title}
                                                        </h3>
                                                        <span className="capitalize bg-green-100 px-2 py-1 rounded text-xs text-green-800 ml-2 flex-shrink-0">
                                                            Published
                                                        </span>
                                                    </div>

                                                    <p className="text-sm text-gray-600 mb-3 line-clamp-2 min-h-[2.5rem]">
                                                        {book.description}
                                                    </p>

                                                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                                                        <span>by {book.authorName}</span>
                                                    </div>

                                                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                                                        <span>{book.publishedChapters} published chapters</span>
                                                        <span>
                                                            Added: {favorite.createdAt.toLocaleDateString()}
                                                        </span>
                                                    </div>

                                                    {book.genres.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mb-4">
                                                            {book.genres.slice(0, 2).map((genre) => (
                                                                <span
                                                                    key={genre}
                                                                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-indigo-800"
                                                                >
                                                                    {genre}
                                                                </span>
                                                            ))}
                                                            {book.genres.length > 2 && (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                                    +{book.genres.length - 2}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}

                                                    <div className="flex space-x-2">
                                                        <Link
                                                            href={`/book/${book.id}`}
                                                            className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-green-400 hover:bg-green-500"
                                                        >
                                                            Read Book
                                                        </Link>
                                                        <button
                                                            onClick={() => handleRemoveFavorite(book.id)}
                                                            disabled={isRemoving}
                                                            className={`px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md transition-colors duration-200 text-white bg-red-500 hover:bg-red-600 ${
                                                                isRemoving
                                                                    ? "opacity-50 cursor-not-allowed"
                                                                    : ""
                                                            }`}
                                                            title="Remove from favorites"
                                                        >
                                                            {isRemoving ? "Removing..." : "Remove"}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FavoriteBooksPage;