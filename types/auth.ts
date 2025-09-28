import { User } from "firebase/auth";

export interface AuthContextType {
    user: User | null;
    loading: boolean;
    signUp: (email: string, password: string, username: string) => Promise<void>;
    signIn: (email: string, password: string) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
}

export interface SignUpFormData {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
}

export interface SignInFormData {
    email: string;
    password: string;
}

export interface UserProfile {
    uid: string;
    username: string;
    email: string;
    displayName: string;
    profilePic?: string;
    bio?: string;
    location?: string;
    socialLinks?: SocialLinks;
    createdAt: Date;
    updatedAt?: Date;
}

export interface SocialLinks {
    twitter?: string;
    instagram?: string;
    facebook?: string;
    website?: string;
    linkedin?: string;
}

export interface ProfileFormData {
    displayName: string;
    bio: string;
    location: string;
    socialLinks: SocialLinks;
    profilePic?: File;
}