import React from 'react';
import { Search, Settings, User, Home, Video, Crown, Bell } from 'lucide-react';

export function SimpleLayout() {
  return (
    <div className="h-screen bg-gray-900 text-white flex">
      {/* Left Sidebar */}
      <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-sm">S</span>
            </div>
            <span className="font-bold text-lg text-yellow-400">SoraDirector</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4">
          <div className="space-y-1 px-2">
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">
              <Home className="w-5 h-5" />
              <span>Home</span>
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-700">
              <Video className="w-5 h-5" />
              <span>AI Video</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-6">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                placeholder="Search"
                className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-600 text-white placeholder:text-gray-400 rounded-lg focus:border-yellow-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-black font-medium rounded-lg">
              Subscribe Now
            </button>
            <button className="p-2 text-gray-400 hover:text-white">
              <Bell className="w-4 h-4" />
            </button>
            <button className="p-2 text-gray-400 hover:text-white">
              <User className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-8 bg-gray-900">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4 text-white">
              Transform your ideas into stunning visuals
            </h1>
            <p className="text-gray-400 text-lg mb-8">
              Upload your product images and let AI create professional videos
            </p>
            
            <div className="max-w-2xl mx-auto p-12 bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg">
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-400/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Video className="w-8 h-8 text-yellow-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">Upload Product Image</h3>
                <p className="text-gray-400">Drag and drop your image here, or click to browse</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}