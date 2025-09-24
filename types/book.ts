export interface Book {
    id: string;
    title: string;
    description: string;
    authorId: string;
    authorName: string;
    coverImage?: string;
    genres: string[];
    createdAt: Date;
    updatedAt: Date;
    publishedChapters: number;
    totalChapters: number;
    status: 'draft' | 'publishing' | 'completed';
}

export interface Chapter {
    id: string;
    bookId: string;
    chapterNumber: number;
    title: string;
    content: string;
    wordCount: number;
    isPublished: boolean;
    publishedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface BookFormData {
    title: string;
    description: string;
    genres: string[];
    coverImage?: File;
}

export interface ChapterFormData {
    title: string;
    content: string;
}