import React from 'react';
import { X } from 'lucide-react';

interface PrivacyPolicyProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrivacyPolicy({ isOpen, onClose }: PrivacyPolicyProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">隐私政策</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* 内容 */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="prose prose-slate max-w-none">
            <p className="text-sm text-slate-500 mb-4">更新日期：2025年1月</p>

            <section className="mb-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">1. 信息收集</h3>
              <p className="text-slate-700 leading-relaxed mb-2">
                semopic-一站式内容平台（以下简称"我们"）重视用户的隐私保护。我们收集以下信息：
              </p>
              <ul className="list-disc pl-6 text-slate-700 space-y-1">
                <li>账户信息：邮箱、用户名等注册信息</li>
                <li>使用数据：创作内容、生成记录、积分使用情况</li>
                <li>设备信息：IP地址、浏览器类型、操作系统</li>
                <li>上传内容：产品图片、视频素材等创作资源</li>
              </ul>
            </section>

            <section className="mb-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">2. 信息使用</h3>
              <p className="text-slate-700 leading-relaxed mb-2">
                我们使用收集的信息用于：
              </p>
              <ul className="list-disc pl-6 text-slate-700 space-y-1">
                <li>提供AI视频生成服务</li>
                <li>改进产品功能和用户体验</li>
                <li>处理账户相关事务和积分管理</li>
                <li>发送服务通知和更新信息</li>
                <li>保障平台安全和防止滥用</li>
              </ul>
            </section>

            <section className="mb-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">3. 数据安全</h3>
              <p className="text-slate-700 leading-relaxed">
                我们采用行业标准的安全措施保护您的数据：
              </p>
              <ul className="list-disc pl-6 text-slate-700 space-y-1">
                <li>使用HTTPS加密传输</li>
                <li>数据库加密存储</li>
                <li>严格的访问控制机制</li>
                <li>定期安全审计和备份</li>
              </ul>
            </section>

            <section className="mb-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">4. Cookie使用</h3>
              <p className="text-slate-700 leading-relaxed">
                我们使用Cookie和类似技术来：
              </p>
              <ul className="list-disc pl-6 text-slate-700 space-y-1">
                <li>保持登录状态</li>
                <li>记住用户偏好设置</li>
                <li>分析网站使用情况</li>
                <li>提供个性化服务</li>
              </ul>
            </section>

            <section className="mb-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">5. 第三方服务</h3>
              <p className="text-slate-700 leading-relaxed">
                我们可能使用以下第三方服务：
              </p>
              <ul className="list-disc pl-6 text-slate-700 space-y-1">
                <li>火山云对象存储（TOS）- 用于存储图片和视频</li>
                <li>AI服务提供商 - 用于视频生成和内容分析</li>
                <li>支付服务商 - 用于处理充值和订阅</li>
              </ul>
              <p className="text-slate-700 leading-relaxed mt-2">
                这些第三方服务有各自的隐私政策，我们要求其遵守相关法律法规。
              </p>
            </section>

            <section className="mb-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">6. 用户权利</h3>
              <p className="text-slate-700 leading-relaxed">
                您拥有以下权利：
              </p>
              <ul className="list-disc pl-6 text-slate-700 space-y-1">
                <li>访问和下载您的个人数据</li>
                <li>更正不准确的信息</li>
                <li>删除账户和相关数据</li>
                <li>撤回同意或拒绝特定数据处理</li>
                <li>导出您创作的内容</li>
              </ul>
            </section>

            <section className="mb-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">7. 数据保留</h3>
              <p className="text-slate-700 leading-relaxed">
                我们将在提供服务所需期间保留您的数据。账户注销后，我们将在30天内删除您的个人信息，但法律要求保留的数据除外。
              </p>
            </section>

            <section className="mb-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">8. 未成年人保护</h3>
              <p className="text-slate-700 leading-relaxed">
                我们的服务面向18岁及以上用户。如果您未满18岁，请在监护人同意下使用本服务。
              </p>
            </section>

            <section className="mb-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">9. 政策更新</h3>
              <p className="text-slate-700 leading-relaxed">
                我们可能不时更新本隐私政策。重大变更时，我们会通过网站公告或邮件通知您。继续使用服务即表示您接受更新后的政策。
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">10. 联系方式</h3>
              <p className="text-slate-700 leading-relaxed">
                如对本隐私政策有任何疑问，请通过以下方式联系我们：
              </p>
              <ul className="list-none pl-0 text-slate-700 space-y-1 mt-2">
                <li>邮箱：semopic@163.com</li>
                <li>网站：https://semopic.com</li>
              </ul>
            </section>
          </div>
        </div>

        {/* 底部 */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            我已了解
          </button>
        </div>
      </div>
    </div>
  );
}
