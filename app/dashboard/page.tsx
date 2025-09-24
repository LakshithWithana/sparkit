"use client";

import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

const DashboardPage: React.FC = () => {
    const { user, signOut } = useAuth();
    const router = useRouter();

    React.useEffect(() => {
        if (!user) {
            router.push("/signin");
        }
    }, [user, router]);

    const handleSignOut = async () => {
        try {
            await signOut();
            router.push("/signin");
        } catch (error) {
            console.error("Failed to sign out", error);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                        <button
                            onClick={handleSignOut}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <h2 className="text-lg font-medium text-gray-900 mb-4">Welcome!</h2>
                            <div className="space-y-4">
                                <div>
                                    <span className="text-sm font-medium text-gray-500">Email:</span>
                                    <p className="text-sm text-gray-900">{user.email}</p>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-500">User ID:</span>
                                    <p className="text-sm text-gray-900 font-mono">{user.uid}</p>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-500">Account created:</span>
                                    <p className="text-sm text-gray-900">
                                        {user.metadata.creationTime
                                            ? new Date(user.metadata.creationTime).toLocaleDateString()
                                            : "Unknown"
                                        }
                                    </p>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-500">Email verified:</span>
                                    <p className="text-sm text-gray-900">
                                        {user.emailVerified ? "Yes" : "No"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;