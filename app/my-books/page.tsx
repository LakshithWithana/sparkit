"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getUserBooks, deleteBook, publishBook, unpublishBook } from "../../lib/bookService";
import { Book } from "@/types/book";
import EditBookModal from "../../components/EditBookModal";

const MyBooksPage: React.FC = () => {
    const { user } = useAuth();
    const router = useRouter();
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [editingBook, setEditingBook] = useState<Book | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [publishingBooks, setPublishingBooks] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!user) {
            router.push("/signin");
            return;
        }

        loadMyBooks();
    }, [user, router]);

    const loadMyBooks = async () => {
        if (!user) return;

        try {
            setLoading(true);
            const userBooks = await getUserBooks(user.uid);
            setBooks(userBooks);
        } catch (error: any) {
            setError(error.message || "Failed to load books");
        } finally {
            setLoading(false);
        }
    };

    const handleEditBook = (book: Book) => {
        setEditingBook(book);
        setIsEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setEditingBook(null);
        setIsEditModalOpen(false);
    };

    const handleBookUpdated = () => {
        loadMyBooks(); // Reload books after update
    };

    const handleTogglePublish = async (bookId: string, currentStatus: string) => {
        setPublishingBooks(prev => new Set([...prev, bookId]));

        try {
            if (currentStatus === 'draft') {
                await publishBook(bookId);
            } else {
                await unpublishBook(bookId);
            }
            await loadMyBooks();
        } catch (error: any) {
            setError(error.message || "Failed to update book status");
        } finally {
            setPublishingBooks(prev => {
                const newSet = new Set(prev);
                newSet.delete(bookId);
                return newSet;
            });
        }
    };

    const handleDeleteBook = async (bookId: string, bookTitle: string) => {
        if (!window.confirm(`Are you sure you want to delete "${bookTitle}"? This will also delete all chapters and cannot be undone.`)) {
            return;
        }

        try {
            await deleteBook(bookId);
            await loadMyBooks();
        } catch (error: any) {
            setError(error.message || "Failed to delete book");
        }
    };

    const getBookStatusInfo = (book: Book) => {
        const isPublished = book.status === 'publishing' || book.status === 'completed';
        return {
            isPublished,
            statusText: isPublished ? 'Published' : 'Draft',
            statusColor: isPublished ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        };
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading your books...</p>
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
                            <h1 className="text-2xl font-bold text-gray-900">My Books</h1>
                        </div>
                        <Link
                            href="/write"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                        >
                            Write New Book
                        </Link>
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

                    {books.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-gray-400">
                                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No books yet</h3>
                            <p className="mt-1 text-sm text-gray-500">Get started by creating your first book.</p>
                            <div className="mt-6">
                                <Link
                                    href="/write"
                                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                                >
                                    Create Your First Book
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {books.map((book) => {
                                const statusInfo = getBookStatusInfo(book);
                                const isToggling = publishingBooks.has(book.id);

                                return (
                                    <div key={book.id} className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow relative">
                                        {/* Publish/Unpublish Toggle Button */}
                                        <div className="absolute top-3 right-3 z-10">
                                            <button
                                                onClick={() => handleTogglePublish(book.id, book.status)}
                                                disabled={isToggling}
                                                className={`
                                                    relative inline-flex items-center h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                                                    transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2
                                                    ${statusInfo.isPublished
                                                    ? 'bg-indigo-600'
                                                    : 'bg-gray-200'
                                                }
                                                    ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}
                                                `}
                                                title={statusInfo.isPublished ? 'Click to unpublish' : 'Click to publish'}
                                            >
                                                <span
                                                    className={`
                                                        inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                                                        ${statusInfo.isPublished ? 'translate-x-5' : 'translate-x-0'}
                                                    `}
                                                />
                                            </button>
                                        </div>

                                        <div className="p-6 pr-16">
                                            <div className="flex gap-4">
                                                {/* Book Cover */}
                                                <div className="flex-shrink-0">
                                                    {book.coverImage ? (
                                                        <img
                                                            src={book.coverImage}
                                                            alt={`${book.title} cover`}
                                                            className="w-20 h-28 object-cover rounded-md border"
                                                        />
                                                    ) : (
                                                        <div className="w-20 h-28 bg-gray-200 rounded-md border flex items-center justify-center">
                                                            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Book Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <h3 className="text-lg font-medium text-gray-900 line-clamp-2 pr-2">
                                                            {book.title}
                                                        </h3>
                                                    </div>

                                                    {/* Status Badge */}
                                                    <div className="mb-2">
                                                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${statusInfo.statusColor}`}>
                                                            {statusInfo.statusText}
                                                        </span>
                                                        {statusInfo.isPublished && (
                                                            <span className="ml-2 text-xs text-green-600">
                                                                • Visible to readers
                                                            </span>
                                                        )}
                                                    </div>

                                                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                                        {book.description}
                                                    </p>

                                                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                                                        <span>{book.publishedChapters} published</span>
                                                        <span>{book.totalChapters} total chapters</span>
                                                    </div>

                                                    {book.genres.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mb-3">
                                                            {book.genres.slice(0, 2).map((genre) => (
                                                                <span key={genre} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
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

                                                    <div className="text-xs text-gray-500 mb-4">
                                                        Last updated: {book.updatedAt.toLocaleDateString()}
                                                    </div>

                                                    <div className="flex flex-col space-y-2">
                                                        <div className="flex space-x-2">
                                                            <Link
                                                                href={`/write/${book.id}`}
                                                                className="flex-1 text-center bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                                                            >
                                                                Write
                                                            </Link>
                                                            <Link
                                                                href={`/book/${book.id}`}
                                                                className="flex-1 text-center bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                                                            >
                                                                Read
                                                            </Link>
                                                        </div>
                                                        <div className="flex space-x-2">
                                                            <button
                                                                onClick={() => handleEditBook(book)}
                                                                className="flex-1 text-center bg-green-100 hover:bg-green-200 text-green-700 px-3 py-2 rounded-md text-sm font-medium"
                                                            >
                                                                Edit Info
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteBook(book.id, book.title)}
                                                                className="flex-1 text-center bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded-md text-sm font-medium"
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
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

            {/* Edit Book Modal */}
            {editingBook && (
                <EditBookModal
                    book={editingBook}
                    isOpen={isEditModalOpen}
                    onClose={handleCloseEditModal}
                    onUpdate={handleBookUpdated}
                />
            )}
        </div>
    );
};

export default MyBooksPage;