export interface Favorite {
    id: string;
    userId: string;
    bookId: string;
    createdAt: Date;
}

export interface FavoriteWithBook {
    id: string;
    userId: string;
    bookId: string;
    createdAt: Date;
    book: {
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
    };
}