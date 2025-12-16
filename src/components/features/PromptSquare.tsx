import React from 'react';
import { Search, Heart, Copy, Sparkles, Tag } from 'lucide-react';
import { Button } from '../ui/button';

export function PromptSquare() {
  const prompts = [
    { id: 1, title: '赛博朋克都市夜景', prompt: 'Neon lights reflecting on wet pavement in a futuristic Tokyo street, 8k resolution, cinematic lighting, ray tracing, unreal engine 5.', image: 'https://images.unsplash.com/photo-1555685812-4b943f3db9f0', tags: ['Sci-Fi', 'City'] },
    { id: 2, title: '迷雾森林', prompt: 'Mystical forest with glowing mushrooms and soft fog, fantasy art style, dreamlike atmosphere, ethereal lighting.', image: 'https://images.unsplash.com/photo-1511497584788-876760111969', tags: ['Nature', 'Fantasy'] },
    { id: 3, title: '深空探索', prompt: 'Astronaut floating in deep space with a nebula in the background, highly detailed, photorealistic, IMAX quality.', image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa', tags: ['Space', 'Realistic'] },
    { id: 4, title: '流体艺术', prompt: 'Colorful liquid metal swirling in abstract patterns, 3D render, glossy texture, macro shot, vibrant colors.', image: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab', tags: ['Abstract', '3D'] },
    { id: 5, title: '复古爵士', prompt: '1920s style portrait of a jazz musician, black and white, grainy film texture, vintage vibe, moody lighting.', image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4', tags: ['Vintage', 'Portrait'] },
    { id: 6, title: '未来跑车', prompt: 'Futuristic sports car speeding through a neon tunnel, motion blur, synthwave aesthetic, low angle shot.', image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7', tags: ['Cars', 'Cyberpunk'] },
  ];

  return (
    <div className="flex-1 h-full overflow-y-auto bg-[#09090b] text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10 text-center space-y-4">
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#8A2BE2] to-[#00FFFF]">提示词广场</h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">探索社区精选的高质量提示词，为您的下一个 AI 视频创作寻找灵感。</p>
          
          <div className="max-w-xl mx-auto mt-6 relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#8A2BE2] to-[#00FFFF] rounded-full opacity-30 group-hover:opacity-70 blur transition duration-500"></div>
            <div className="relative flex items-center bg-[#121214] rounded-full p-1">
                <Search className="ml-4 text-zinc-500" size={20} />
                <input 
                  type="text" 
                  placeholder="搜索提示词、风格或艺术家..."
                  className="w-full bg-transparent border-none py-3 px-4 text-sm text-white focus:outline-none focus:ring-0 placeholder:text-zinc-600"
                />
                <Button size="sm" className="rounded-full bg-[#2A2A2E] hover:bg-[#8A2BE2] text-white transition-colors px-6">
                    搜索
                </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {prompts.map((item) => (
            <div key={item.id} className="bg-[#18181b] rounded-2xl overflow-hidden border border-[#2A2A2E] hover:border-[#8A2BE2]/50 transition-all duration-300 group hover:-translate-y-1 hover:shadow-xl hover:shadow-[#8A2BE2]/10">
               <div className="aspect-video relative overflow-hidden">
                 <img src={item.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={item.title} />
                 
                 <div className="absolute top-3 right-3 flex gap-2">
                     <div className="bg-black/50 backdrop-blur-md rounded-full p-2 hover:bg-[#FF1493] transition-colors cursor-pointer">
                        <Heart size={16} className="text-white" />
                     </div>
                 </div>

                 <div className="absolute bottom-3 left-3 flex gap-2">
                    {item.tags.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-black/60 backdrop-blur-md rounded-md text-[10px] text-white flex items-center gap-1 border border-white/10">
                            <Tag size={10} /> {tag}
                        </span>
                    ))}
                 </div>
               </div>
               
               <div className="p-5 space-y-4">
                 <div className="flex items-center justify-between">
                     <h3 className="font-bold text-lg text-white group-hover:text-[#8A2BE2] transition-colors">{item.title}</h3>
                     <Sparkles size={16} className="text-[#00FFFF] opacity-0 group-hover:opacity-100 transition-opacity" />
                 </div>
                 
                 <div className="bg-[#09090b] p-3 rounded-lg border border-[#2A2A2E] group-hover:border-zinc-700 transition-colors">
                     <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed font-mono">
                       {item.prompt}
                     </p>
                 </div>

                 <Button 
                    variant="outline" 
                    className="w-full bg-[#2A2A2E] border-none hover:bg-[#8A2BE2] hover:text-white text-zinc-300 transition-all"
                 >
                   <Copy size={14} className="mr-2" /> 复制提示词
                 </Button>
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
