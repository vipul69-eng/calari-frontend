"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, ArrowLeft, User } from "lucide-react";

export default function ProfileCreationPage() {
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateProfile = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);
    // Handle profile creation logic here
  };

  const bioCharCount = bio.length;
  const maxBioLength = 150;

  return (
    <div className="min-h-screen bg-background text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4  border-gray-800">
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-400 hover:text-white hover:bg-gray-900"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {/* App Logo/Title */}

        {/* Profile Form - No Card Background */}
        <div className="w-full max-w-md space-y-6">
          {/* Profile Image Upload */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="h-24 w-24 border-2 border-gray-700">
                <AvatarImage src={profileImage || undefined} alt="Profile" />
                <AvatarFallback className="bg-gray-900 text-gray-400">
                  <User className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="profile-image"
                className="absolute -bottom-2 -right-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full p-2 cursor-pointer transition-colors"
              >
                <Camera className="h-4 w-4" />
              </label>
              <input
                id="profile-image"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
            <p className="text-sm text-gray-400 text-center">
              Tap the camera icon to add a profile photo
            </p>
          </div>

          {/* Username Input */}
          <div className="space-y-2">
            <label
              htmlFor="username"
              className="text-sm font-medium text-white"
            >
              Username
            </label>
            <Input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:ring-purple-600 focus:border-purple-600"
            />
          </div>

          {/* Bio Input */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="bio" className="text-sm font-medium text-white">
                Bio
              </label>
              <span
                className={`text-xs ${bioCharCount > maxBioLength ? "text-red-400" : "text-gray-400"}`}
              >
                {bioCharCount}/{maxBioLength}
              </span>
            </div>
            <Textarea
              id="bio"
              placeholder="Tell us a bit about your nutrition goals..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={maxBioLength}
              rows={3}
              className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:ring-purple-600 focus:border-purple-600 resize-none"
            />
          </div>

          {/* Create Profile Button */}
          <Button
            onClick={handleCreateProfile}
            disabled={!username.trim() || isLoading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 transition-colors disabled:bg-gray-800 disabled:text-gray-500"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                <span>Creating Profile...</span>
              </div>
            ) : (
              "Create Profile"
            )}
          </Button>
        </div>

        {/* Footer Text */}
        <p className="text-xs text-gray-500 text-center text-pretty max-w-sm">
          By creating a profile, you agree to our Terms of Service and Privacy
          Policy
        </p>
      </div>
    </div>
  );
}
