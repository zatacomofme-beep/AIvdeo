import React, { useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Studio } from './components/features/Studio';
import { Assets } from './components/features/Assets';
import { PromptSquare } from './components/features/PromptSquare';
import { Profile } from './components/features/Profile';
import { useStore } from './lib/store';

export default function App() {
  const { activeTab, uploadedImage, setUploadedImage } = useStore();

  // Load a default image for demo purposes if none exists
  useEffect(() => {
    if (!uploadedImage) {
      setUploadedImage("https://images.unsplash.com/photo-1765053534710-2409e33e65b4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3NtZXRpYyUyMGJvdHRsZSUyMHN0dWRpbyUyMHNob3QlMjBkYXJrJTIwYmFja2dyb3VuZHxlbnwxfHx8fDE3NjU4NTIwMDV8MA&ixlib=rb-4.1.0&q=80&w=1080");
    }
  }, [uploadedImage, setUploadedImage]);

  const renderContent = () => {
    switch (activeTab) {
      case 'studio':
        return <Studio />;
      case 'assets':
        return <Assets />;
      case 'prompt-square':
        return <PromptSquare />;
      case 'profile':
        return <Profile />;
      default:
        return <Studio />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#09090b] text-white overflow-hidden font-sans">
      <Sidebar />
      <main className="flex-1 h-full overflow-hidden relative">
        {renderContent()}
      </main>
    </div>
  );
}
