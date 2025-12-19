import React, { useState } from 'react';
import { 
  Search, 
  Settings, 
  User, 
  Home, 
  Video, 
  Image, 
  Music, 
  Palette, 
  Heart, 
  Download,
  Plus,
  Bell,
  Crown
} from 'lucide-react';

interface ModernLayoutProps {
  children: React.ReactNode;
}

export function ModernLayout({ children }: ModernLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

  const sidebarItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'video', icon: Video, label: 'AI Video' },
    { id: 'image', icon: Image, label: 'AI Image' },
    { id: 'voiceover', icon: Music, label: 'AI Voiceover' },
    { id: 'creative', icon: Palette, label: 'Creative Assets' },
    { id: 'favorites', icon: Heart, label: 'Favorites' },
    { id: 'downloads', icon: Download, label: 'Downloads' },
  ];

  return (
    <div className="h-screen bg-gray-900 text-white flex overflow-hidden">
      {/* Left Sidebar */}
      <div className={`bg-gray-800 border-r border-gray-700 flex flex-col transition-all duration-300 ${
        sidebarCollapsed ? "w-16" : "w-64"
      }`}>
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-sm">S</span>
            </div>
            {!sidebarCollapsed && (
              <span className="font-bold text-lg bg-gradient-to-r from-yellow-400 to-yellow-500 bg-clip-text text-transparent">
                SoraDirector
              </span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4">
          <div className="space-y-1 px-2">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === item.id
                    ? "bg-yellow-400/10 text-yellow-400 border border-yellow-400/20"
                    : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                }`}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            ))}
          </div>
        </nav>

        {/* Artboards Section */}
        {!sidebarCollapsed && (
          <div className="border-t border-gray-700 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-400">Artboards</span>
              <button className="w-6 h-6 p-0 text-gray-400 hover:text-white">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs text-gray-500">
              Create custom artboards for your projects
            </div>
          </div>
        )}

        {/* Collapse Toggle */}
        <div className="border-t border-gray-700 p-2">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-start gap-2 px-3 py-2 text-gray-400 hover:text-white text-sm rounded-lg hover:bg-gray-800/50"
          >
            <Settings className="w-4 h-4" />
            {!sidebarCollapsed && <span>Collapse</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-6">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                placeholder="Search"
                className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-600 text-white placeholder:text-gray-400 rounded-lg focus:border-yellow-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <button className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-black font-medium rounded-lg flex items-center gap-2">
              <Crown className="w-4 h-4" />
              Subscribe Now
            </button>
            <button className="px-3 py-2 text-gray-400 hover:text-white text-sm">
              Business
            </button>
            <button className="px-3 py-2 text-gray-400 hover:text-white text-sm">
              Pricing
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
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}