import React from 'react';
import { X } from 'lucide-react';

interface TermsOfServiceProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TermsOfService({ isOpen, onClose }: TermsOfServiceProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">服务条款</h2>
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
            <p className="text-sm text-slate-500 mb-4">生效日期：2025年1月</p>

            <section className="mb-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">1. 服务说明</h3>
              <p className="text-slate-700 leading-relaxed">
                欢迎使用semopic-一站式内容平台！本服务条款构成您与我们之间具有法律约束力的协议。使用本服务即表示您同意遵守以下条款：
              </p>
              <ul className="list-disc pl-6 text-slate-700 space-y-1 mt-2">
                <li>提供AI视频生成和内容创作工具</li>
                <li>基于积分制的使用模式</li>
                <li>支持商品视频、营销内容等多场景创作</li>
                <li>提供云端存储和作品管理服务</li>
              </ul>
            </section>

            <section className="mb-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">2. 账户注册</h3>
              <p className="text-slate-700 leading-relaxed mb-2">
                注册和使用账户时，您需要：
              </p>
              <ul className="list-disc pl-6 text-slate-700 space-y-1">
                <li>提供真实、准确的注册信息</li>
                <li>年满18周岁或在监护人同意下使用</li>
                <li>妥善保管账户密码，不得转让或共享</li>
                <li>对账户下的所有活动负责</li>
                <li>发现未经授权使用时立即通知我们</li>
              </ul>
            </section>

            <section className="mb-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">3. 积分系统</h3>
              <p className="text-slate-700 leading-relaxed mb-2">
                关于积分的使用规则：
              </p>
              <ul className="list-disc pl-6 text-slate-700 space-y-1">
                <li>新注册用户赠送50积分体验额度</li>
                <li>积分可用于AI生成脚本、视频等服务</li>
                <li>积分一经消耗不可退还</li>
                <li>积分永久有效，无过期时间</li>
                <li>充值积分仅可用于本平台服务，不可提现</li>
                <li>我们保留调整积分价格和赠送规则的权利</li>
              </ul>
            </section>

            <section className="mb-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">4. 使用规范</h3>
              <p className="text-slate-700 leading-relaxed mb-2">
                使用本服务时，您不得：
              </p>
              <ul className="list-disc pl-6 text-slate-700 space-y-1">
                <li>上传违法、色情、暴力、诽谤等违规内容</li>
                <li>侵犯他人知识产权、肖像权或隐私权</li>
                <li>传播虚假信息或进行欺诈活动</li>
                <li>使用技术手段破坏或干扰平台运行</li>
                <li>批量注册账号或恶意消耗资源</li>
                <li>将生成内容用于非法或不当用途</li>
                <li>逆向工程、反编译或破解本服务</li>
              </ul>
            </section>

            <section className="mb-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">5. 知识产权</h3>
              <p className="text-slate-700 leading-relaxed mb-2">
                <strong>5.1 平台知识产权</strong>
              </p>
              <p className="text-slate-700 leading-relaxed mb-2">
                semopic平台的所有技术、软件、界面设计等知识产权归我们所有。
              </p>
              <p className="text-slate-700 leading-relaxed mb-2 mt-3">
                <strong>5.2 用户内容</strong>
              </p>
              <ul className="list-disc pl-6 text-slate-700 space-y-1">
                <li>您上传的原始素材（图片、文本等）的知识产权归您所有</li>
                <li>AI生成的内容归您使用，但需遵守本条款和相关法律</li>
                <li>您授予我们使用您内容进行服务改进的权利</li>
                <li>您对上传内容的合法性承担全部责任</li>
              </ul>
            </section>

            <section className="mb-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">6. 付费服务</h3>
              <p className="text-slate-700 leading-relaxed mb-2">
                关于充值和付费：
              </p>
              <ul className="list-disc pl-6 text-slate-700 space-y-1">
                <li>所有价格以页面展示为准，可能不时调整</li>
                <li>支付成功后积分实时到账</li>
                <li>因用户原因导致的错误充值，我们不承担退款责任</li>
                <li>如遇支付问题，请及时联系客服处理</li>
                <li>我们保留推出促销活动和优惠套餐的权利</li>
              </ul>
            </section>

            <section className="mb-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">7. 服务变更与终止</h3>
              <p className="text-slate-700 leading-relaxed mb-2">
                我们有权：
              </p>
              <ul className="list-disc pl-6 text-slate-700 space-y-1">
                <li>随时修改、暂停或终止部分或全部服务</li>
                <li>更新和优化服务功能</li>
                <li>对违规账户进行警告、限制或封禁</li>
                <li>在必要时进行系统维护（将提前通知）</li>
              </ul>
              <p className="text-slate-700 leading-relaxed mt-2">
                重大变更时，我们会提前30天通知用户。
              </p>
            </section>

            <section className="mb-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">8. 免责声明</h3>
              <ul className="list-disc pl-6 text-slate-700 space-y-1">
                <li>AI生成内容仅供参考，使用效果因素材和参数而异</li>
                <li>我们不对生成内容的准确性、完整性或适用性做保证</li>
                <li>因不可抗力（自然灾害、网络故障等）导致的服务中断，我们不承担责任</li>
                <li>用户使用生成内容的商业行为由其自行承担法律责任</li>
                <li>第三方服务（如支付、存储）的问题由相应服务商负责</li>
              </ul>
            </section>

            <section className="mb-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">9. 责任限制</h3>
              <p className="text-slate-700 leading-relaxed">
                在法律允许的最大范围内，我们对以下情况不承担责任：
              </p>
              <ul className="list-disc pl-6 text-slate-700 space-y-1 mt-2">
                <li>因用户违规使用导致的任何损失</li>
                <li>因网络、设备等技术问题造成的服务中断</li>
                <li>用户间的纠纷或第三方侵权</li>
                <li>任何间接、偶然、特殊或惩罚性损害</li>
              </ul>
            </section>

            <section className="mb-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">10. 争议解决</h3>
              <p className="text-slate-700 leading-relaxed">
                本条款受中华人民共和国法律管辖。如发生争议，双方应友好协商解决；协商不成的，任何一方可向我们所在地人民法院提起诉讼。
              </p>
            </section>

            <section className="mb-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">11. 条款更新</h3>
              <p className="text-slate-700 leading-relaxed">
                我们保留随时修改本服务条款的权利。更新后的条款将在网站公布，继续使用服务即视为接受新条款。重大变更会通过邮件或站内通知告知。
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">12. 联系我们</h3>
              <p className="text-slate-700 leading-relaxed">
                如对本服务条款有任何疑问，请联系：
              </p>
              <ul className="list-none pl-0 text-slate-700 space-y-1 mt-2">
                <li>客服邮箱：semopic@163.com</li>
                <li>官方网站：https://semopic.com</li>
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
            我已阅读并同意
          </button>
        </div>
      </div>
    </div>
  );
}
