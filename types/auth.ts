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
    createdAt: Date;
}