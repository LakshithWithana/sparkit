"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
    getBook,
    getBookChapters,
    createChapter,
    updateChapter,
    publishChapter,
    unpublishChapter,
    deleteChapter,
} from "@/lib/bookService";
import { Book, Chapter, ChapterFormData } from "@/types/book";
import RichTextEditor from "../../../components/RichTextEditor";

const WriteBookPage: React.FC = () => {
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const bookId = params.bookId as string;

    const [book, setBook] = useState<Book | null>(null);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
    const [isCreatingChapter, setIsCreatingChapter] = useState(false);

    const [chapterForm, setChapterForm] = useState<ChapterFormData>({
        title: "",
        content: "",
    });

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
                getBookChapters(bookId),
            ]);

            if (!bookData) {
                setError("Book not found");
                return;
            }

            if (bookData.authorId !== user?.uid) {
                setError("You don't have permission to edit this book");
                return;
            }

            setBook(bookData);
            setChapters(chaptersData);
        } catch (error: any) {
            setError(error.message || "Failed to load book data");
        } finally {
            setLoading(false);
        }
    };

    const handleChapterSelect = (chapter: Chapter) => {
        setSelectedChapter(chapter);
        setChapterForm({
            title: chapter.title,
            content: chapter.content,
        });
        setIsCreatingChapter(false);
    };

    const handleNewChapter = () => {
        setSelectedChapter(null);
        setChapterForm({
            title: "",
            content: "",
        });
        setIsCreatingChapter(true);
    };

    const handleFormChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const { name, value } = e.target;
        setChapterForm(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleContentChange = (content: string) => {
        setChapterForm(prev => ({
            ...prev,
            content: content,
        }));
    };

    const handleSaveChapter = async () => {
        if (!chapterForm.title.trim()) {
            setError("Please enter a chapter title");
            return;
        }

        if (!chapterForm.content.trim()) {
            setError("Please enter chapter content");
            return;
        }

        try {
            setSaving(true);
            setError("");

            if (isCreatingChapter) {
                const chapterId = await createChapter(
                    bookId,
                    chapterForm,
                    chapters.length + 1
                );
                await loadBookData();

                // Select the newly created chapter
                const updatedChapters = await getBookChapters(bookId);
                const newChapter = updatedChapters.find(c => c.id === chapterId);
                if (newChapter) {
                    setSelectedChapter(newChapter);
                    setIsCreatingChapter(false);
                }
            } else if (selectedChapter) {
                await updateChapter(selectedChapter.id, chapterForm);
                await loadBookData();
            }
        } catch (error: any) {
            setError(error.message || "Failed to save chapter");
        } finally {
            setSaving(false);
        }
    };

    const handlePublishChapter = async (chapterId: string) => {
        try {
            await publishChapter(chapterId);
            await loadBookData();
        } catch (error: any) {
            setError(error.message || "Failed to publish chapter");
        }
    };

    const handleUnpublishChapter = async (chapterId: string) => {
        try {
            await unpublishChapter(chapterId);
            await loadBookData();
        } catch (error: any) {
            setError(error.message || "Failed to unpublish chapter");
        }
    };

    const handleDeleteChapter = async (chapterId: string) => {
        if (!window.confirm("Are you sure you want to delete this chapter? This action cannot be undone.")) {
            return;
        }

        try {
            await deleteChapter(chapterId);
            await loadBookData();

            if (selectedChapter?.id === chapterId) {
                setSelectedChapter(null);
                setChapterForm({ title: "", content: "" });
                setIsCreatingChapter(false);
            }
        } catch (error: any) {
            setError(error.message || "Failed to delete chapter");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (error && !book) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={() => router.push("/")}
                        className="text-indigo-600 hover:text-indigo-500"
                    >
                        Go back to home
                    </button>
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
                            <button
                                onClick={() => router.push("/")}
                                className="text-gray-600 hover:text-gray-900"
                            >
                                ← Back to Home
                            </button>
                            <div>
                                <h1 className="text-xl font-semibold text-gray-900">{book?.title}</h1>
                                <p className="text-sm text-gray-500">
                                    {chapters.length} chapters • {book?.publishedChapters} published
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleNewChapter}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                        >
                            New Chapter
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <div className="flex gap-6">
                    {/* Chapters Sidebar */}
                    <div className="w-80 bg-white shadow rounded-lg p-4">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Chapters</h2>

                        {chapters.length === 0 ? (
                            <div className="text-center text-gray-500 py-8">
                                <p>No chapters yet</p>
                                <p className="text-sm">Click "New Chapter" to get started</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
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
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-900">
                                                    Chapter {chapter.chapterNumber}
                                                </p>
                                                <p className="text-sm text-gray-600 truncate">
                                                    {chapter.title}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {chapter.wordCount} words
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-end space-y-1">
                                                <span
                                                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                                        chapter.isPublished
                                                            ? "bg-green-100 text-green-800"
                                                            : "bg-gray-100 text-gray-800"
                                                    }`}
                                                >
                                                    {chapter.isPublished ? "Published" : "Draft"}
                                                </span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (chapter.isPublished) {
                                                            handleUnpublishChapter(chapter.id);
                                                        } else {
                                                            handlePublishChapter(chapter.id);
                                                        }
                                                    }}
                                                    className="text-xs text-indigo-600 hover:text-indigo-500"
                                                >
                                                    {chapter.isPublished ? "Unpublish" : "Publish"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Editor */}
                    <div className="flex-1 bg-white shadow rounded-lg">
                        {(selectedChapter || isCreatingChapter) ? (
                            <div className="p-6">
                                {error && (
                                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                                        {error}
                                    </div>
                                )}

                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h2 className="text-xl font-semibold text-gray-900">
                                            {isCreatingChapter
                                                ? `Chapter ${chapters.length + 1}`
                                                : `Chapter ${selectedChapter?.chapterNumber}`
                                            }
                                        </h2>
                                        {selectedChapter && (
                                            <p className="text-sm text-gray-500">
                                                {selectedChapter.wordCount} words •
                                                {selectedChapter.isPublished ? " Published" : " Draft"}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex space-x-2">
                                        {selectedChapter && (
                                            <button
                                                onClick={() => handleDeleteChapter(selectedChapter.id)}
                                                className="px-3 py-1 text-sm text-red-600 hover:text-red-500"
                                            >
                                                Delete
                                            </button>
                                        )}
                                        <button
                                            onClick={handleSaveChapter}
                                            disabled={saving}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                                        >
                                            {saving ? "Saving..." : "Save Chapter"}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Chapter Title
                                        </label>
                                        <input
                                            type="text"
                                            name="title"
                                            value={chapterForm.title}
                                            onChange={handleFormChange}
                                            className="w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder="Enter chapter title"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Content
                                        </label>
                                        <RichTextEditor
                                            value={chapterForm.content}
                                            onChange={handleContentChange}
                                            placeholder="Start writing your chapter..."
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-6 text-center text-gray-500">
                                <div className="text-gray-400 mb-4">
                                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                </div>
                                <p className="text-lg">Ready to write?</p>
                                <p className="text-sm">Select a chapter to edit or create a new one</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WriteBookPage;