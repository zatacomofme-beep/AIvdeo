import React from 'react';
import { User, Mail, CreditCard, Settings, LogOut, Shield, Crown, Bell, Globe } from 'lucide-react';
import { Button } from '../ui/button';
import { useStore } from '../../lib/store';
import { Separator } from '../ui/separator';

export function Profile() {
  const { credits } = useStore();

  return (
    <div className="flex-1 h-full overflow-y-auto bg-[#09090b] text-white p-8">
      <div className="max-w-4xl mx-auto space-y-8">
         <h2 className="text-2xl font-bold text-white">个人中心</h2>
         
         {/* User Info Card */}
         <div className="bg-[#18181b] rounded-2xl border border-[#2A2A2E] p-8 flex items-center gap-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#8A2BE2] opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:opacity-10 transition-opacity duration-1000" />
            
            <div className="w-24 h-24 rounded-full p-[2px] bg-gradient-to-tr from-[#8A2BE2] to-[#00FFFF]">
                <div className="w-full h-full rounded-full bg-[#18181b] flex items-center justify-center relative overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white">
                    SD
                    </div>
                </div>
            </div>
            
            <div className="flex-1 z-10">
               <div className="flex items-center gap-3 mb-1">
                 <h3 className="text-2xl font-bold text-white">Studio Admin</h3>
                 <span className="px-2 py-0.5 rounded bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                    <Crown size={10} fill="black" /> Pro
                 </span>
               </div>
               <p className="text-zinc-400 text-sm mb-4">admin@soradirector.com</p>
               <div className="flex gap-3">
                  <Button variant="outline" className="bg-transparent border-[#2A2A2E] hover:bg-[#2A2A2E] text-white h-8 text-xs rounded-full px-4">
                    编辑资料
                  </Button>
               </div>
            </div>
         </div>

         {/* Stats Grid */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#18181b] rounded-2xl border border-[#2A2A2E] p-6 hover:border-[#8A2BE2]/50 transition-colors">
               <div className="flex items-center gap-2 mb-3 text-zinc-400 text-sm font-medium uppercase tracking-wider">
                  <Shield size={16} className="text-[#8A2BE2]" /> 当前套餐
               </div>
               <div className="text-2xl font-bold text-white mb-1">Professional</div>
               <p className="text-xs text-zinc-500">2026年1月1日 到期</p>
            </div>
            
            <div className="bg-[#18181b] rounded-2xl border border-[#2A2A2E] p-6 hover:border-[#00FFFF]/50 transition-colors">
               <div className="flex items-center gap-2 mb-3 text-zinc-400 text-sm font-medium uppercase tracking-wider">
                  <CreditCard size={16} className="text-[#00FFFF]" /> 剩余点数
               </div>
               <div className="flex items-end justify-between">
                   <div className="text-3xl font-bold text-white mb-1">{credits}</div>
                   <Button variant="link" className="p-0 h-auto text-xs text-[#00FFFF] hover:text-[#00FFFF]/80 mb-2">
                      充值 &rarr;
                   </Button>
               </div>
            </div>

             <div className="bg-[#18181b] rounded-2xl border border-[#2A2A2E] p-6 hover:border-pink-500/50 transition-colors">
               <div className="flex items-center gap-2 mb-3 text-zinc-400 text-sm font-medium uppercase tracking-wider">
                  <Settings size={16} className="text-pink-500" /> 存储空间
               </div>
               <div className="text-2xl font-bold text-white mb-1">45.2 GB</div>
               <div className="w-full bg-[#2A2A2E] h-1.5 rounded-full mt-2 overflow-hidden">
                   <div className="bg-pink-500 h-full w-[45%]" />
               </div>
               <p className="text-xs text-zinc-500 mt-2">已使用 45% (总计 100GB)</p>
            </div>
         </div>

         {/* Settings Sections */}
         <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">系统设置</h3>
            <div className="bg-[#18181b] rounded-2xl border border-[#2A2A2E] overflow-hidden divide-y divide-[#2A2A2E]">
                {[
                    { icon: User, label: "账户安全", desc: "密码、双重验证" },
                    { icon: Bell, label: "通知设置", desc: "邮件、推送通知" },
                    { icon: Globe, label: "语言与地区", desc: "简体中文 (中国)" },
                    { icon: Shield, label: "隐私设置", desc: "数据共享、可见性" },
                ].map((item, i) => (
                    <div key={i} className="p-4 hover:bg-[#2A2A2E]/50 cursor-pointer flex items-center justify-between group transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-[#2A2A2E] flex items-center justify-center group-hover:bg-[#8A2BE2] group-hover:text-white text-zinc-400 transition-colors">
                                <item.icon size={20} />
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-white">{item.label}</h4>
                                <p className="text-xs text-zinc-500">{item.desc}</p>
                            </div>
                        </div>
                        <div className="text-zinc-500 group-hover:text-white transition-colors">
                            &rarr;
                        </div>
                    </div>
                ))}
            </div>

             <Button variant="ghost" className="w-full border border-[#2A2A2E] text-red-500 hover:bg-red-950/30 hover:text-red-400 h-12 rounded-xl mt-4">
                <LogOut size={16} className="mr-2" /> 退出登录
             </Button>
         </div>
      </div>
    </div>
  );
}
