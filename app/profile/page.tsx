"use client";

import React, {useState, useRef, useEffect, useCallback} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getUserProfileByUid, updateUserProfile, validateProfileImage } from "@/lib/profileService";
import { UserProfile, ProfileFormData, SocialLinks } from "@/types/auth";
import Image from "next/image";

const ProfilePage: React.FC = () => {
    const { user } = useAuth();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [imagePreview, setImagePreview] = useState<string>("");

    const [formData, setFormData] = useState<ProfileFormData>({
        displayName: "",
        bio: "",
        location: "",
        socialLinks: {
            twitter: "",
            instagram: "",
            facebook: "",
            website: "",
            linkedin: "",
        },
        profilePic: undefined,
    });

    const loadProfile = useCallback(async () => {
        if (!user) return;

        try {
            setLoading(true);
            const userProfile = await getUserProfileByUid(user.uid);

            if (userProfile) {
                setProfile(userProfile);
                setFormData({
                    displayName: userProfile.displayName || "",
                    bio: userProfile.bio || "",
                    location: userProfile.location || "",
                    socialLinks: userProfile.socialLinks || {
                        twitter: "",
                        instagram: "",
                        facebook: "",
                        website: "",
                        linkedin: "",
                    },
                    profilePic: undefined,
                });
                setImagePreview(userProfile.profilePic || "");
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : "Failed to load profile");
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (!user) {
            router.push("/signin");
            return;
        }

        loadProfile();
    }, [user, router, loadProfile]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        if (name.startsWith('social_')) {
            const socialPlatform = name.replace('social_', '') as keyof SocialLinks;
            setFormData(prev => ({
                ...prev,
                socialLinks: {
                    ...prev.socialLinks,
                    [socialPlatform]: value,
                },
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate image
        const validationError = validateProfileImage(file);
        if (validationError) {
            setError(validationError);
            return;
        }

        setFormData(prev => ({
            ...prev,
            profilePic: file,
        }));

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
        setError("");
    };

    const handleRemoveImage = () => {
        setFormData(prev => ({
            ...prev,
            profilePic: undefined,
        }));
        setImagePreview(profile?.profilePic || "");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) return;

        if (!formData.displayName.trim()) {
            setError("Display name is required");
            return;
        }

        try {
            setError("");
            setSuccess("");
            setSaving(true);

            await updateUserProfile(user.uid, formData);
            setSuccess("Profile updated successfully!");

            // Reload profile to get updated data
            await loadProfile();
        } catch (error) {
            setError(error instanceof Error ? error.message : "Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation */}
            <div className="bg-green-400 shadow">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center space-x-4">
                            <Link href="/" className="text-gray-600 hover:text-gray-900">
                                ← Back to Home
                            </Link>
                            <h1 className="text-xl font-semibold text-gray-900">My Profile</h1>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="bg-white shadow rounded-lg">
                    <form onSubmit={handleSubmit} className="space-y-6 p-6">
                        {error && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                                {success}
                            </div>
                        )}

                        {/* Profile Picture */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Profile Picture
                            </label>
                            <div className="flex items-center space-x-4">
                                <div className="flex-shrink-0">
                                    {imagePreview ? (
                                        <div className="relative">
                                            <Image
                                                src={imagePreview}
                                                alt="Profile preview"
                                                width={96}
                                                height={96}
                                                className="w-24 h-24 object-cover rounded-full border"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleRemoveImage}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center">
                                            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="w-full px-3 py-2 text-gray-400 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Upload a profile picture. Max size: 5MB.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Basic Information */}
                        <div className="grid grid-cols-1 gap-6">
                            <div>
                                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
                                    Display Name *
                                </label>
                                <input
                                    type="text"
                                    id="displayName"
                                    name="displayName"
                                    required
                                    value={formData.displayName}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>

                            <div>
                                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                                    Bio
                                </label>
                                <textarea
                                    id="bio"
                                    name="bio"
                                    rows={4}
                                    value={formData.bio}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="Tell us about yourself..."
                                />
                            </div>

                            <div>
                                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                                    Location
                                </label>
                                <input
                                    type="text"
                                    id="location"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="City, Country"
                                />
                            </div>
                        </div>

                        {/* Social Media Links */}
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Social Media Links</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="social_website" className="block text-sm font-medium text-gray-700 mb-2">
                                        Website
                                    </label>
                                    <input
                                        type="url"
                                        id="social_website"
                                        name="social_website"
                                        value={formData.socialLinks.website || ""}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="https://yourwebsite.com"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="social_twitter" className="block text-sm font-medium text-gray-700 mb-2">
                                        Twitter
                                    </label>
                                    <input
                                        type="text"
                                        id="social_twitter"
                                        name="social_twitter"
                                        value={formData.socialLinks.twitter || ""}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="@username"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="social_instagram" className="block text-sm font-medium text-gray-700 mb-2">
                                        Instagram
                                    </label>
                                    <input
                                        type="text"
                                        id="social_instagram"
                                        name="social_instagram"
                                        value={formData.socialLinks.instagram || ""}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="@username"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="social_linkedin" className="block text-sm font-medium text-gray-700 mb-2">
                                        LinkedIn
                                    </label>
                                    <input
                                        type="url"
                                        id="social_linkedin"
                                        name="social_linkedin"
                                        value={formData.socialLinks.linkedin || ""}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="https://linkedin.com/in/username"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end space-x-3 pt-6">
                            <Link
                                href="/"
                                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? "Saving..." : "Save Profile"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;