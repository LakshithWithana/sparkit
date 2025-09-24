"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {getPublishedBooks} from "@/lib/bookService";
import { Book } from "@/types/book";
import Image from "next/image";
import { getUserProfile } from "@/lib/userService";

export default function HomePage() {
  const { user, loading, signOut } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [booksLoading, setBooksLoading] = useState(true);
  const router = useRouter();
  const [username, setUsername] = useState<string>("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/signin");
      return;
    }

    if (user) {
      loadBooks().then();
    }
  }, [user, loading, router]);

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
      }
    };

    fetchUsername().then();
  }, [user]);

  const loadBooks = async () => {
    try {
      setBooksLoading(true);
      const allBooks = await getPublishedBooks();
      setBooks(allBooks);
    } catch (error) {
      console.error("Error loading books:", error);
    } finally {
      setBooksLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/signin");
    } catch (error) {
      console.error("Failed to sign out", error);
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
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
      <div className="min-h-screen bg-gray-50">
        {/* Top Navigation Bar */}
        <div className="bg-green-400 shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <Image
                  src="/assets/spark.png"
                  alt="Spark It Logo"
                  width={315}
                  height={100}
                  className="h-8 w-auto mr-2"
              />
              <div className="flex items-center space-x-4">
                <Link
                    href="/write"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Write
                </Link>
                <Link
                    href="/my-books"
                    className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  My Books
                </Link>
                <div className="text-sm text-gray-600">
                  {username || user.displayName || user.email}
                </div>
                <button
                    onClick={handleSignOut}
                    className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-gray-900">Discover Books</h2>
              <p className="mt-2 text-gray-600">Explore amazing stories from our community of writers</p>
            </div>

            {booksLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading books...</p>
                </div>
            ) : books.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No books yet</h3>
                  <p className="mt-1 text-sm text-gray-500">Be the first to share your story with the community!</p>
                  <div className="mt-6">
                    <Link
                        href="/write"
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      Start Writing
                    </Link>
                  </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                  {books.map((book) => (
                      <div key={book.id} className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
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
                                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                  </div>
                              )}
                            </div>

                            {/* Book Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <h3 className="text-lg font-medium text-gray-900 mb-2 line-clamp-2">
                                  {book.title}
                                </h3>
                                <span className="capitalize bg-green-100 px-2 py-1 rounded text-xs text-green-800 ml-2">
                                  {getBookStatusInfo(book).statusText}
                                </span>
                              </div>

                              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                {book.description}
                              </p>

                              <div className="text-xs text-gray-500 mb-3">
                                by {book.authorName}
                              </div>

                              <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                                <span>{book.publishedChapters} published chapters</span>
                                <span>updated: {book.updatedAt.toLocaleDateString()}</span>
                              </div>

                              {book.genres.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mb-4">
                                    {book.genres.slice(0, 2).map((genre) => (
                                        <span key={genre} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-indigo-800">
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

                              <Link
                                  href={`/book/${book.id}`}
                                  className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-green-400 hover:bg-green-500 w-full"
                              >
                                Read Book
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                  ))}
                </div>
            )}
          </div>
        </div>
      </div>
  );
}