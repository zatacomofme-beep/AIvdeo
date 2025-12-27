import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useStore } from '../lib/store';
import { PrivacyPolicy } from './PrivacyPolicy';
import { TermsOfService } from './TermsOfService';
import { ContactUs } from './ContactUs';

interface FeaturedVideo {
  id: string;
  title: string;
  subtitle: string;
  videoUrl: string;
  thumbnailUrl: string;
  category: string;
  tags: string[];
  displayOrder: number;
  viewCount: number;
  likeCount: number;
  productName: string;
  platform: string;
  description: string;
}

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useStore();
  const [videos, setVideos] = useState<FeaturedVideo[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('全部案例');
  const [categories, setCategories] = useState<string[]>(['全部案例', '美妆护肤', '3C数码', '服装鞋帽']);
  const [isLoading, setIsLoading] = useState(true);
  
  // 弹窗状�?
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showContact, setShowContact] = useState(false);

  // 加载精选视�?
  useEffect(() => {
    const loadFeaturedVideos = async () => {
      try {
        setIsLoading(true);
        const category = selectedCategory === '全部案例' ? undefined : selectedCategory;
        const data = await api.getFeaturedVideos(category);
        
        if (data.success && data.videos) {
          setVideos(data.videos);
        }
      } catch (error) {
        console.error('加载精选视频失�?', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFeaturedVideos();
  }, [selectedCategory]);

  // 加载分类列表
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await api.getFeaturedCategories();
        if (data.success && data.categories.length > 0) {
          setCategories(['全部案例', ...data.categories]);
        }
      } catch (error) {
        console.error('加载分类失败:', error);
      }
    };

    loadCategories();
  }, []);

  // 处理登录按钮点击
  const handleLogin = () => {
    // 如果已经登录，直接跳转工作台；否则带上登录参�?
    if (isLoggedIn) {
      navigate('/app');
    } else {
      navigate('/app?showLogin=true');
    }
  };

  // 处理开始创作按钮点�?
  const handleGetStarted = () => {
    // 如果已经登录，直接跳转工作台；否则带上登录参�?
    if (isLoggedIn) {
      navigate('/app');
    } else {
      navigate('/app?showLogin=true');
    }
  };

  return (
    <div className="antialiased font-sans bg-[#050505] text-white min-h-screen">
      {/* 导航�?*/}
      <nav className="fixed w-full z-50 transition-all duration-300 backdrop-blur-lg bg-black/60 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
            <div className="w-9 h-9 bg-[#FF6B00] rounded-lg flex items-center justify-center text-white shadow-lg shadow-[#FF6B00]/20 group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-wide text-white">SEMOPIC</span>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={handleLogin}
              className="bg-white text-black px-6 py-2.5 rounded-full text-sm font-bold hover:bg-gray-200 transition-all transform hover:scale-105"
            >
              登录
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col justify-center items-center pt-24 overflow-hidden">
        {/* 动态背�?*/}
        <div className="absolute inset-0 opacity-30 z-0 pointer-events-none" style={{
          backgroundSize: '50px 50px',
          backgroundImage: 'linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
          maskImage: 'radial-gradient(circle at center, black 40%, transparent 100%)'
        }}></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#FF6B00] opacity-10 blur-[120px] rounded-full z-0"></div>

        <div className="text-center max-w-5xl px-6 relative z-10 flex flex-col items-center">
          
          <h1 className="text-6xl md:text-8xl font-bold leading-[0.95] tracking-tight mb-8">
            From Image<br />
            To <span className="text-[#FF6B00]">Viral Video.</span>
          </h1>
          
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed font-light">
            SEMOPIC 专为跨境电商设计。
            <span className="text-white font-normal">上传一张商品图</span>，AI 自动生成爆款脚本与 25s 投放素材。
          </p>
          
          <div className="flex flex-col sm:flex-row gap-5 w-full justify-center">
            <button 
              onClick={handleGetStarted}
              className="bg-[#FF6B00] hover:bg-[#E65000] text-white px-10 py-5 rounded-full font-bold text-lg transition-all shadow-[0_0_20px_rgba(255,107,0,0.3)] hover:shadow-[0_0_40px_rgba(255,107,0,0.6)] flex items-center justify-center gap-3 group"
            >
              <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              免费生成视频
            </button>
          </div>

          {/* 数据展示 */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16 border-t border-white/10 pt-10 w-full max-w-4xl">
            <div>
              <h4 className="text-3xl font-bold text-white mb-1">30s</h4>
              <p className="text-xs text-gray-500 uppercase tracking-wider">生成时间</p>
            </div>
            <div>
              <h4 className="text-3xl font-bold text-white mb-1">10x</h4>
              <p className="text-xs text-gray-500 uppercase tracking-wider">ROI 提升</p>
            </div>
            <div>
              <h4 className="text-3xl font-bold text-white mb-1">4K</h4>
              <p className="text-xs text-gray-500 uppercase tracking-wider">输出画质</p>
            </div>
            <div>
              <h4 className="text-3xl font-bold text-white mb-1">20+</h4>
              <p className="text-xs text-gray-500 uppercase tracking-wider">多语言配音</p>
            </div>
          </div>
        </div>
      </section>

      {/* Video Gallery Section */}
      <section id="gallery" className="py-32 bg-[#050505] relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Made with SEMOPIC</h2>
              <p className="text-gray-400 text-lg max-w-xl">
                这些高转化率视频全部由 AI 生成。无需拍摄，无需剪辑，仅需一张图。
              </p>
            </div>
            {/* 过滤�?*/}
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-5 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'bg-white text-black'
                      : 'border border-white/10 hover:border-[#FF6B00] hover:text-[#FF6B00] text-gray-400'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 视频网格 */}
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-[9/16] bg-gray-800 rounded-xl animate-pulse"></div>
              ))}
            </div>
          ) : videos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className="relative group cursor-pointer bg-gray-900 rounded-xl overflow-hidden border border-white/10 hover:border-[#FF6B00] transition-all duration-400 hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(255,107,0,0.3)] aspect-[9/16]"
                >
                  <div className="absolute inset-0 bg-gray-800">
                    <img 
                      src={video.thumbnailUrl} 
                      alt={video.title}
                      className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent flex flex-col justify-end p-5">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full border border-white/30 flex items-center justify-center bg-white/10 backdrop-blur-sm transition-all group-hover:scale-110 group-hover:bg-[#FF6B00] group-hover:border-[#FF6B00]">
                      <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold mb-1">{video.title}</h3>
                    <p className="text-gray-400 text-xs">{video.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-gray-500">
              暂无该分类的精选视频
            </div>
          )}
        </div>
      </section>

      {/* CTA Footer */}
      <footer className="py-24 relative overflow-hidden flex flex-col items-center justify-center text-center">
        <div className="absolute inset-0 bg-gradient-to-t from-[#FF6B00]/10 to-transparent pointer-events-none"></div>
        <div className="max-w-3xl px-6 relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Stop wasting time on editing.</h2>
          <p className="text-xl text-gray-400 mb-10">加入 5,000+ 跨境卖家，开启自动化视频营销时代。</p>
          <button 
            onClick={handleGetStarted}
            className="bg-white text-black px-12 py-5 rounded-full font-bold text-xl hover:scale-105 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.2)]"
          >
            Start for Free
          </button>
        </div>
        <div className="mt-16 pt-8 border-t border-white/5 w-full max-w-7xl px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* 左侧：版权和备案信息 */}
            <div className="flex flex-col md:flex-row items-center gap-2 text-sm">
              <span className="text-gray-500">© 2025 semopic-一站式内容平台</span>
              <span className="hidden md:inline text-gray-700">|</span>
              <a
                href="https://beian.miit.gov.cn/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-white transition-colors"
              >
                蜀ICP备2025170225号
              </a>
            </div>

            {/* 右侧：链�?*/}
            <div className="flex items-center gap-6 text-sm">
              <button
                onClick={() => setShowPrivacy(true)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                隐私政策
              </button>
              <button
                onClick={() => setShowTerms(true)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                服务条款
              </button>
              <button
                onClick={() => setShowContact(true)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                联系我们
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Privacy Policy Modal */}
      <PrivacyPolicy
        isOpen={showPrivacy}
        onClose={() => setShowPrivacy(false)}
      />

      {/* Terms of Service Modal */}
      <TermsOfService
        isOpen={showTerms}
        onClose={() => setShowTerms(false)}
      />

      {/* Contact Us Modal */}
      <ContactUs
        isOpen={showContact}
        onClose={() => setShowContact(false)}
      />
    </div>
  );
};

export default LandingPage;
