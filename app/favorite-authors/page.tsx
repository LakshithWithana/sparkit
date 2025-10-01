"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getUserFavoriteAuthors, removeFavoriteAuthor, FavoriteAuthor } from "@/lib/favoriteService";
import { getUserBooks } from "@/lib/bookService";
import { getUserProfileByUid } from "@/lib/profileService";
import { Book } from "@/types/book";
import { UserProfile } from "@/types/auth";

interface FavoriteAuthorWithDetails extends FavoriteAuthor {
    profile: UserProfile | null;
    books: Book[];
}

const FavoriteAuthorsPage: React.FC = () => {
    const { user } = useAuth();
    const router = useRouter();
    const [favoriteAuthors, setFavoriteAuthors] = useState<FavoriteAuthorWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [removingAuthors, setRemovingAuthors] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!user) {
            router.push("/signin");
            return;
        }

        loadFavoriteAuthors();
    }, [user, router]);

    const loadFavoriteAuthors = async () => {
        if (!user) return;

        try {
            setLoading(true);
            const favorites = await getUserFavoriteAuthors(user.uid);

            // Fetch author profile and books for each favorite
            const favoritesWithDetails = await Promise.all(
                favorites.map(async (favorite) => {
                    const [profile, books] = await Promise.all([
                        getUserProfileByUid(favorite.authorId),
                        getUserBooks(favorite.authorId)
                    ]);

                    // Filter to only show published books
                    const publishedBooks = books.filter(
                        book => book.status === 'publishing' || book.status === 'completed'
                    );

                    return {
                        ...favorite,
                        profile,
                        books: publishedBooks,
                    };
                })
            );

            setFavoriteAuthors(favoritesWithDetails);
        } catch (error: any) {
            setError(error.message || "Failed to load favorite authors");
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveFavorite = async (authorId: string, authorName: string) => {
        if (!user) return;

        // Prevent multiple clicks
        if (removingAuthors.has(authorId)) return;

        if (!window.confirm(`Remove ${authorName} from your favorite authors?`)) {
            return;
        }

        setRemovingAuthors((prev) => new Set([...prev, authorId]));

        try {
            await removeFavoriteAuthor(user.uid, authorId);
            // Remove from local state
            setFavoriteAuthors((prev) =>
                prev.filter((fav) => fav.authorId !== authorId)
            );
        } catch (error: any) {
            setError(error.message || "Failed to remove favorite author");
        } finally {
            setRemovingAuthors((prev) => {
                const newSet = new Set(prev);
                newSet.delete(authorId);
                return newSet;
            });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading favorite authors...</p>
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
                            <h1 className="text-2xl font-bold text-gray-900">Favorite Authors</h1>
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

                    {favoriteAuthors.length === 0 ? (
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
                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                    />
                                </svg>
                            </div>
                            <h3 className="mt-2 text-sm font-medium text-gray-900">
                                No favorite authors yet
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Discover amazing writers and add them to your favorites!
                            </p>
                            <div className="mt-6">
                                <Link
                                    href="/"
                                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                                >
                                    Discover Authors
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {favoriteAuthors.map((favorite) => {
                                const isRemoving = removingAuthors.has(favorite.authorId);
                                const profile = favorite.profile;

                                return (
                                    <div
                                        key={favorite.id}
                                        className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
                                    >
                                        <div className="p-6">
                                            {/* Author Header */}
                                            <div className="flex items-start justify-between mb-6">
                                                <div className="flex items-center space-x-4">
                                                    {/* Profile Picture */}
                                                    <div className="flex-shrink-0">
                                                        {profile?.profilePic ? (
                                                            <img
                                                                src={profile.profilePic}
                                                                alt={`${favorite.authorName} profile`}
                                                                className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                                                            />
                                                        ) : (
                                                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                                                                <span className="text-2xl font-bold text-white">
                                                                    {favorite.authorName.charAt(0).toUpperCase()}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Author Info */}
                                                    <div>
                                                        <h2 className="text-2xl font-bold text-gray-900">
                                                            {profile?.displayName || favorite.authorName}
                                                        </h2>
                                                        <p className="text-sm text-gray-500">
                                                            @{favorite.authorName}
                                                        </p>
                                                        {profile?.bio && (
                                                            <p className="text-sm text-gray-600 mt-2 max-w-2xl">
                                                                {profile.bio}
                                                            </p>
                                                        )}
                                                        {profile?.location && (
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                📍 {profile.location}
                                                            </p>
                                                        )}
                                                        <p className="text-xs text-gray-400 mt-2">
                                                            Added to favorites: {favorite.createdAt.toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Remove Button */}
                                                <button
                                                    onClick={() => handleRemoveFavorite(favorite.authorId, favorite.authorName)}
                                                    disabled={isRemoving}
                                                    className={`px-4 py-2 border border-transparent text-sm font-medium rounded-md transition-colors duration-200 text-white bg-red-500 hover:bg-red-600 ${
                                                        isRemoving
                                                            ? "opacity-50 cursor-not-allowed"
                                                            : ""
                                                    }`}
                                                    title="Remove from favorites"
                                                >
                                                    {isRemoving ? "Removing..." : "Remove"}
                                                </button>
                                            </div>

                                            {/* Author's Books */}
                                            <div>
                                                <div className="flex items-center justify-between mb-4">
                                                    <h3 className="text-lg font-medium text-gray-900">
                                                        Published Books ({favorite.books.length})
                                                    </h3>
                                                </div>

                                                {favorite.books.length === 0 ? (
                                                    <p className="text-sm text-gray-500 italic">
                                                        No published books yet
                                                    </p>
                                                ) : (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                        {favorite.books.map((book) => (
                                                            <Link
                                                                key={book.id}
                                                                href={`/book/${book.id}`}
                                                                className="border rounded-lg p-4 hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
                                                            >
                                                                <div className="flex gap-3">
                                                                    {/* Book Cover */}
                                                                    <div className="flex-shrink-0">
                                                                        {book.coverImage ? (
                                                                            <img
                                                                                src={book.coverImage}
                                                                                alt={`${book.title} cover`}
                                                                                className="w-16 h-20 object-cover rounded border"
                                                                            />
                                                                        ) : (
                                                                            <div className="w-16 h-20 bg-gray-200 rounded border flex items-center justify-center">
                                                                                <svg
                                                                                    className="w-6 h-6 text-gray-400"
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
                                                                    <div className="flex-1 min-w-0">
                                                                        <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                                                                            {book.title}
                                                                        </h4>
                                                                        <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                                                                            {book.description}
                                                                        </p>
                                                                        <div className="flex items-center justify-between text-xs text-gray-500">
                                                                            <span>{book.publishedChapters} chapters</span>
                                                                            {book.genres.length > 0 && (
                                                                                <span className="px-2 py-0.5 bg-green-100 text-indigo-800 rounded text-xs">
                                                                                    {book.genres[0]}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </Link>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Social Links */}
                                            {profile?.socialLinks && (
                                                Object.values(profile.socialLinks).some(link => link) && (
                                                    <div className="mt-6 pt-6 border-t border-gray-200">
                                                        <h4 className="text-sm font-medium text-gray-700 mb-3">
                                                            Connect with {profile?.displayName || favorite.authorName}
                                                        </h4>
                                                        <div className="flex flex-wrap gap-3">
                                                            {profile.socialLinks.website && (
                                                                <a
                                                                    href={profile.socialLinks.website}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                                                                >
                                                                    🌐 Website
                                                                </a>
                                                            )}
                                                            {profile.socialLinks.twitter && (
                                                                <a
                                                                    href={`https://twitter.com/${profile.socialLinks.twitter.replace('@', '')}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                                                                >
                                                                    🐦 Twitter
                                                                </a>
                                                            )}
                                                            {profile.socialLinks.instagram && (
                                                                <a
                                                                    href={`https://instagram.com/${profile.socialLinks.instagram.replace('@', '')}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                                                                >
                                                                    📷 Instagram
                                                                </a>
                                                            )}
                                                            {profile.socialLinks.linkedin && (
                                                                <a
                                                                    href={profile.socialLinks.linkedin}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                                                                >
                                                                    💼 LinkedIn
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            )}
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

export default FavoriteAuthorsPage;