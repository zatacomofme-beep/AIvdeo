import React, { useState } from 'react';
import { 
  Upload, 
  Wand2, 
  Play, 
  Download,
  Share,
  Settings,
  Sparkles,
  Video as VideoIcon
} from 'lucide-react';
import { useStore } from '../../lib/store';
import { DirectorConsole } from './DirectorConsole';

export function MainWorkspace() {
  const { uploadedImage, setUploadedImage } = useStore();
  const [showDirector, setShowDirector] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = React.useState(false);

  // 模拟作品数据
  const creations = [
    {
      id: 1,
      type: 'video',
      thumbnail: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=200&fit=crop',
      title: 'Office Scene',
      duration: '15s'
    },
    {
      id: 2,
      type: 'video', 
      thumbnail: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=300&h=200&fit=crop',
      title: 'Car Commercial',
      duration: '10s'
    },
    {
      id: 3,
      type: 'video',
      thumbnail: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=300&h=200&fit=crop', 
      title: 'City Lights',
      duration: '8s'
    },
    {
      id: 4,
      type: 'video',
      thumbnail: 'https://images.unsplash.com/photo-1494790108755-2616c9c0b8d3?w=300&h=200&fit=crop',
      title: 'Portrait Video',
      duration: '12s'
    }
  ];

  const handleFileProcess = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    
    setIsUploading(true);
    try {
      // 这里保持原有的上传逻辑
      const { api } = await import('../../lib/api');
      const url = await api.uploadImage(file);
      setUploadedImage(url);
      
      // 将base64存储到store
      const base64 = await fileToBase64(file);
      useStore.setState({ imageBase64: base64 });
      useStore.getState().setPipelineStage('image_uploaded');
      
      // 自动打开AI导演面板
      setShowDirector(true);
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setIsUploading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileProcess(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  return (
    <div className="h-full flex">
      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        showDirector ? "mr-96" : ""
      }`}>
        {/* Hero Section */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">
              Transform your ideas into stunning visuals
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl">
              Upload your product images and let AI create professional videos with intelligent scripting and natural conversations.
            </p>
          </div>

          {/* Upload Area */}
          <div className="w-full max-w-2xl">
            {uploadedImage ? (
              <div className="p-6 bg-gray-800 border border-gray-700 rounded-lg">
                <div className="relative">
                  <img 
                    src={uploadedImage} 
                    alt="Uploaded product" 
                    className="w-full h-64 object-contain rounded-lg bg-gray-900"
                  />
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button
                      onClick={() => setUploadedImage('')}
                      className="px-3 py-1 bg-black/50 border border-gray-600 hover:bg-black/70 text-white text-sm rounded"
                    >
                      Remove
                    </button>
                    <button
                      onClick={() => setShowDirector(!showDirector)}
                      className="px-3 py-1 bg-yellow-400 hover:bg-yellow-500 text-black text-sm rounded flex items-center gap-1"
                    >
                      <Wand2 className="w-4 h-4" />
                      {showDirector ? 'Hide' : 'Start'} AI Director
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div 
                className="p-12 bg-gray-800 border border-gray-600 border-dashed cursor-pointer hover:border-yellow-400/50 transition-colors rounded-lg"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={handleUploadClick}
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-yellow-400/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    {isUploading ? (
                      <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Upload className="w-8 h-8 text-yellow-400" />
                    )}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    {isUploading ? 'Uploading...' : 'Upload Product Image'}
                  </h3>
                  <p className="text-gray-400 mb-4">
                    Drag and drop your image here, or click to browse
                  </p>
                  <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                    <span>Image to Video</span>
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <span>AI Powered</span>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            )}
          </div>

          {/* Quick Actions */}
          {uploadedImage && (
            <div className="flex items-center gap-4 mt-6">
              <button className="px-4 py-2 border border-gray-700 hover:border-gray-600 text-white rounded-lg flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Settings
              </button>
              <button className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-black font-medium rounded-lg flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Animate for Free
              </button>
            </div>
          )}
        </div>

        {/* Bottom Creations Section */}
        <div className="border-t border-gray-700 p-6 bg-gray-900">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-6">
              <button className="text-white font-medium border-b-2 border-yellow-400 pb-2">
                Explore
              </button>
              <button className="text-gray-400 hover:text-white pb-2">
                My Creations
              </button>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Sparkles className="w-4 h-4" />
              Generate free 2 images, 1 video
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {creations.map((creation) => (
              <div key={creation.id} className="bg-gray-800 border border-gray-700 overflow-hidden group cursor-pointer hover:border-gray-600 transition-colors rounded-lg">
                <div className="relative">
                  <img 
                    src={creation.thumbnail} 
                    alt={creation.title}
                    className="w-full h-32 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="flex items-center gap-2">
                      <button className="p-2 bg-black/50 border border-gray-600 rounded text-white">
                        <Play className="w-4 h-4" />
                      </button>
                      <button className="p-2 bg-black/50 border border-gray-600 rounded text-white">
                        <Download className="w-4 h-4" />
                      </button>
                      <button className="p-2 bg-black/50 border border-gray-600 rounded text-white">
                        <Share className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="absolute top-2 left-2">
                    <div className="bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                      <VideoIcon className="w-3 h-3" />
                      VIDEO
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  <h4 className="font-medium text-sm mb-1">{creation.title}</h4>
                  <p className="text-xs text-gray-400">{creation.duration}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Director Panel */}
      {showDirector && (
        <div className="fixed right-0 top-16 bottom-0 w-96 z-50">
          <DirectorConsole />
        </div>
      )}
    </div>
  );
}