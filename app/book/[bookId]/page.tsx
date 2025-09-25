"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getBook, getPublishedChapters } from "@/lib/bookService";
import { Book, Chapter } from "@/types/book";
import FormattedTextDisplay from "../../../components/FormattedTextDisplay";

const BookReaderPage: React.FC = () => {
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const bookId = params.bookId as string;

    const [book, setBook] = useState<Book | null>(null);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!user) {
            router.push("/signin");
            return;
        }

        if (bookId) {
            loadBookData();
        }
    }, [user, bookId, router]);

    const loadBookData = async () => {
        try {
            setLoading(true);
            const [bookData, chaptersData] = await Promise.all([
                getBook(bookId),
                getPublishedChapters(bookId),
            ]);

            if (!bookData) {
                setError("Book not found");
                return;
            }

            setBook(bookData);
            setChapters(chaptersData);

            // Auto-select first chapter if available
            if (chaptersData.length > 0) {
                setSelectedChapter(chaptersData[0]);
            }
        } catch (error: any) {
            setError(error.message || "Failed to load book");
        } finally {
            setLoading(false);
        }
    };

    const handleChapterSelect = (chapter: Chapter) => {
        setSelectedChapter(chapter);
    };

    const handleNextChapter = () => {
        if (!selectedChapter) return;
        const currentIndex = chapters.findIndex(c => c.id === selectedChapter.id);
        if (currentIndex < chapters.length - 1) {
            setSelectedChapter(chapters[currentIndex + 1]);
        }
    };

    const handlePrevChapter = () => {
        if (!selectedChapter) return;
        const currentIndex = chapters.findIndex(c => c.id === selectedChapter.id);
        if (currentIndex > 0) {
            setSelectedChapter(chapters[currentIndex - 1]);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading book...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error}</p>
                    <Link
                        href="/"
                        className="text-indigo-600 hover:text-indigo-500"
                    >
                        Go back to home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center space-x-4">
                            <Link href="/" className="text-gray-600 hover:text-gray-900">
                                ← Back to Home
                            </Link>
                            <div>
                                <h1 className="text-xl font-semibold text-gray-900">{book?.title}</h1>
                                <p className="text-sm text-gray-500">by {book?.authorName}</p>
                            </div>
                        </div>
                        {book?.authorId === user?.uid && (
                            <Link
                                href={`/write/${bookId}`}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                            >
                                Edit Book
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                {chapters.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-gray-400">
                            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No published chapters</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            This book doesn't have any published chapters yet.
                        </p>
                        {book?.authorId === user?.uid && (
                            <div className="mt-6">
                                <Link
                                    href={`/write/${bookId}`}
                                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                                >
                                    Start Writing
                                </Link>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex gap-6">
                        {/* Chapter List Sidebar */}
                        <div className="w-80 bg-white shadow rounded-lg p-4">
                            <div className="mb-4">
                                <h2 className="text-lg font-medium text-gray-900">Chapters</h2>
                                <p className="text-sm text-gray-500">{chapters.length} published</p>
                            </div>

                            {/* Book Info */}
                            <div className="border-b border-gray-200 pb-4 mb-4">
                                <p className="text-sm text-gray-600 line-clamp-3">{book?.description}</p>
                                {book?.genres && book.genres.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {book.genres.slice(0, 3).map((genre) => (
                                            <span key={genre} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                        {genre}
                      </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Chapters List */}
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {chapters.map((chapter) => (
                                    <div
                                        key={chapter.id}
                                        className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                                            selectedChapter?.id === chapter.id
                                                ? "border-indigo-500 bg-indigo-50"
                                                : "border-gray-200 hover:border-gray-300"
                                        }`}
                                        onClick={() => handleChapterSelect(chapter)}
                                    >
                                        <p className="text-sm font-medium text-gray-900">
                                            Chapter {chapter.chapterNumber}
                                        </p>
                                        <p className="text-sm text-gray-600 truncate">
                                            {chapter.title}
                                        </p>
                                        <div className="flex justify-between items-center mt-1">
                                            <p className="text-xs text-gray-500">
                                                {chapter.wordCount} words
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {chapter.publishedAt?.toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Reading Area */}
                        <div className="flex-1 bg-white shadow rounded-lg">
                            {selectedChapter ? (
                                <div className="p-8">
                                    {/* Chapter Header */}
                                    <div className="border-b border-gray-200 pb-6 mb-8">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h1 className="text-2xl font-bold text-gray-900">
                                                    Chapter {selectedChapter.chapterNumber}: {selectedChapter.title}
                                                </h1>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {selectedChapter.wordCount} words • Published {selectedChapter.publishedAt?.toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Chapter Content with Formatting */}
                                    <FormattedTextDisplay
                                        content={selectedChapter.content}
                                        className="mb-12"
                                    />

                                    {/* Navigation */}
                                    <div className="flex justify-between items-center mt-12 pt-8 border-t border-gray-200">
                                        <button
                                            onClick={handlePrevChapter}
                                            disabled={chapters.findIndex(c => c.id === selectedChapter.id) === 0}
                                            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            ← Previous Chapter
                                        </button>

                                        <span className="text-sm text-gray-500">
                      {chapters.findIndex(c => c.id === selectedChapter.id) + 1} of {chapters.length}
                    </span>

                                        <button
                                            onClick={handleNextChapter}
                                            disabled={chapters.findIndex(c => c.id === selectedChapter.id) === chapters.length - 1}
                                            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Next Chapter →
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-8 text-center text-gray-500">
                                    <p>Select a chapter to start reading</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookReaderPage;