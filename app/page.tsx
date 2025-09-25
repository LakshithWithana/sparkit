"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {getPublishedBooks} from "@/lib/bookService";
import { Book } from "@/types/book";
import Image from "next/image";
import { getUserProfile } from "@/lib/userService";
import {
  addFavoriteAuthor,
  removeFavoriteAuthor,
  getUserFavoriteAuthors,
  FavoriteAuthor,
  addFavoriteBook,
  removeFavoriteBook,
  getUserFavoriteBooks
} from "@/lib/favoriteService";

export default function HomePage() {
  const { user, loading, signOut } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [booksLoading, setBooksLoading] = useState(true);
  const router = useRouter();
  const [username, setUsername] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [favoriteAuthors, setFavoriteAuthors] = useState<Set<string>>(new Set());
  const [favoriteBooks, setFavoriteBooks] = useState<Set<string>>(new Set());
  const [favoriteLoading, setFavoriteLoading] = useState<Set<string>>(new Set());
  const [bookmarkLoading, setBookmarkLoading] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/signin");
      return;
    }

    if (user) {
      loadBooks().then();
      loadFavoriteAuthors().then();
      loadFavoriteBooks().then();
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  const loadFavoriteAuthors = async () => {
    if (!user) {
      console.log("No user found, skipping favorite authors load");
      return;
    }

    console.log("Loading favorites for user:", user.uid);

    try {
      const favorites = await getUserFavoriteAuthors(user.uid);
      console.log("Successfully loaded favorites:", favorites);
      const favoriteAuthorIds = new Set(favorites.map(fav => fav.authorId));
      setFavoriteAuthors(favoriteAuthorIds);
    } catch (error) {
      console.error("Error loading favorite authors:", error);
    }
  };

  const loadFavoriteBooks = async () => {
    if (!user) {
      console.log("No user found, skipping favorite books load");
      return;
    }

    console.log("Loading favorite books for user:", user.uid);

    try {
      const favorites = await getUserFavoriteBooks(user.uid);
      console.log("Successfully loaded favorite books:", favorites);
      const favoriteBookIds = new Set(favorites.map(fav => fav.bookId));
      setFavoriteBooks(favoriteBookIds);
    } catch (error) {
      console.error("Error loading favorite books:", error);
    }
  };

  const handleFavoriteAuthor = async (authorId: string, authorName: string, isFavorited: boolean) => {
    if (!user) return;

    // Prevent multiple clicks while processing
    if (favoriteLoading.has(authorId)) return;

    // Add to loading set
    setFavoriteLoading(prev => new Set([...prev, authorId]));

    try {
      if (isFavorited) {
        await removeFavoriteAuthor(user.uid, authorId);
        setFavoriteAuthors(prev => {
          const newSet = new Set(prev);
          newSet.delete(authorId);
          return newSet;
        });
      } else {
        await addFavoriteAuthor(user.uid, authorId, authorName);
        setFavoriteAuthors(prev => new Set([...prev, authorId]));
      }
    } catch (error) {
      console.error("Error updating favorite author:", error);
    } finally {
      // Remove from loading set
      setFavoriteLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(authorId);
        return newSet;
      });
    }
  };

  const handleFavoriteBook = async (bookId: string, bookTitle: string, isFavorited: boolean) => {
    if (!user) return;

    // Prevent multiple clicks while processing
    if (bookmarkLoading.has(bookId)) return;

    // Add to loading set
    setBookmarkLoading(prev => new Set([...prev, bookId]));

    try {
      if (isFavorited) {
        await removeFavoriteBook(user.uid, bookId);
        setFavoriteBooks(prev => {
          const newSet = new Set(prev);
          newSet.delete(bookId);
          return newSet;
        });
      } else {
        await addFavoriteBook(user.uid, bookId, bookTitle);
        setFavoriteBooks(prev => new Set([...prev, bookId]));
      }
    } catch (error) {
      console.error("Error updating favorite book:", error);
    } finally {
      // Remove from loading set
      setBookmarkLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(bookId);
        return newSet;
      });
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

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const closeDropdown = () => {
    setIsDropdownOpen(false);
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

                {/* Username Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                      onClick={toggleDropdown}
                      className="flex items-center text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    <span>{username || user.displayName || user.email}</span>
                    <svg
                        className={`ml-1 h-4 w-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                        <div className="py-1">
                          {/* User Info Header */}
                          <div className="px-4 py-2 border-b border-gray-100">
                            <p className="text-sm font-medium text-gray-900">
                              {username || user.displayName || 'User'}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {user.email}
                            </p>
                          </div>

                          {/* Menu Items */}
                          <Link
                              href="/favorite-books"
                              onClick={closeDropdown}
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                          >
                            <svg className="mr-3 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            Favorite Books
                          </Link>

                          <Link
                              href="/favorite-authors"
                              onClick={closeDropdown}
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                          >
                            <svg className="mr-3 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Favorite Authors
                          </Link>

                          <Link
                              href="/profile"
                              onClick={closeDropdown}
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                          >
                            <svg className="mr-3 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            My Profile
                          </Link>

                          {/* Separator */}
                          <div className="border-t border-gray-100 my-1"></div>

                          <button
                              onClick={() => {
                                closeDropdown();
                                handleSignOut();
                              }}
                              className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
                          >
                            <svg className="mr-3 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Sign Out
                          </button>
                        </div>
                      </div>
                  )}
                </div>
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
                  {books.map((book) => {
                    const isFavoriteAuthor = favoriteAuthors.has(book.authorId);
                    const isLoadingFavorite = favoriteLoading.has(book.authorId);
                    const isFavoriteBook = favoriteBooks.has(book.id);
                    const isLoadingBookmark = bookmarkLoading.has(book.id);

                    return (
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
                              <div className="flex-1 min-w-0 flex flex-col">
                                <div className="flex items-start justify-between">
                                  <h3 className="text-lg font-medium text-gray-900 mb-2 line-clamp-2 min-h-[3.5rem]">
                                    {book.title}
                                  </h3>
                                  <span className="capitalize bg-green-100 px-2 py-1 rounded text-xs text-green-800 ml-2 flex-shrink-0">
                                  {getBookStatusInfo(book).statusText}
                                </span>
                                </div>

                                <p className="text-sm text-gray-600 mb-3 line-clamp-2 min-h-[2.5rem]">
                                  {book.description}
                                </p>

                                {/* Author section with favorite button */}
                                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                                  <div className="flex items-center space-x-2">
                                    <span>by {book.authorName}</span>
                                    {/* Don't show favorite button for own books */}
                                    {book.authorId !== user?.uid && (
                                        <button
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              handleFavoriteAuthor(book.authorId, book.authorName, isFavoriteAuthor);
                                            }}
                                            disabled={isLoadingFavorite}
                                            className={`p-1 rounded-full transition-colors duration-200 ${
                                                isLoadingFavorite
                                                    ? 'opacity-50 cursor-not-allowed'
                                                    : 'hover:bg-gray-100'
                                            }`}
                                            title={isFavoriteAuthor ? 'Remove from favorite authors' : 'Add to favorite authors'}
                                        >
                                          <svg
                                              className={`w-4 h-4 transition-colors duration-200 ${
                                                  isFavoriteAuthor
                                                      ? 'text-red-500 fill-current'
                                                      : 'text-gray-400 hover:text-red-400'
                                              }`}
                                              fill={isFavoriteAuthor ? 'currentColor' : 'none'}
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
                                        </button>
                                    )}
                                  </div>
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

                                <div className="flex space-x-2">
                                  <Link
                                      href={`/book/${book.id}`}
                                      className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-green-400 hover:bg-green-500"
                                  >
                                    Read Book
                                  </Link>
                                  <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleFavoriteBook(book.id, book.title, isFavoriteBook);
                                      }}
                                      disabled={isLoadingBookmark}
                                      className={`px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md transition-colors duration-200 ${
                                          isFavoriteBook
                                              ? 'text-red-500 bg-yellow-100 hover:bg-yellow-200'
                                              : 'text-red-500 bg-red-100 hover:bg-red-200'
                                      } ${
                                          isLoadingBookmark
                                              ? 'opacity-50 cursor-not-allowed'
                                              : ''
                                      }`}
                                      title={isFavoriteBook ? 'Remove from favorites' : 'Add to favorites'}
                                      style={{ height: '38px', width: '38px' }}
                                  >
                                    <svg
                                        className={`w-4 h-4 ${
                                            isFavoriteBook
                                                ? 'fill-current'
                                                : 'fill-none'
                                        }`}
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                    >
                                      <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
                                      />
                                    </svg>
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
}