'use client';

import { useState } from 'react';
import Link from 'next/link';

interface SwarmAsset {
  channel: string;
  headline: string;
  body: string;
  hashtags: string[];
  cta: string;
  qualifiedLeads: number;
  cpaUsd: number;
}

const CHANNEL_PRESETS: Record<string, SwarmAsset> = {
  zalo: {
    channel: 'Zalo OA & Doanh Nghiệp VN',
    headline: 'Giải Pháp Đột Phá: Tự Động Hóa Hóa Đơn TT78 & Vận Hành OPC 2027',
    body: 'Kính gửi Quý Doanh Nghiệp,\n\nMEKONG OPC 2027 giúp các công ty một thành viên cắt giảm 70% thời gian xử lý kế toán VAS, hóa đơn điện tử TT78 và chăm sóc khách hàng qua Zalo OA với cơ chế kiểm duyệt SHA-256 an toàn tuyệt đối.',
    hashtags: ['#MekongOPC', '#ChuyenDoiSo', '#TT78', '#ZaloOA'],
    cta: 'Kích hoạt MEKONG-RAAS-v1 tức thì qua VietQR Napas 247',
    qualifiedLeads: 12,
    cpaUsd: 15.5,
  },
  linkedin: {
    channel: 'LinkedIn B2B International',
    headline: 'Why High-Velocity Solo Founders Are Moving to Sovereign AI Harnesses in 2027',
    body: 'Modern software velocity is bottlenecked by fragmented SaaS subscriptions and opaque token markups.\n\nWith MEKONG OPC 2027, founders run 4-pillar autonomous swarms with payload-bound SHA-256 approvals and zero markup on inference.',
    hashtags: ['#OnePersonCompany', '#AgenticCockpit', '#SovereignOS', '#MekongCLI'],
    cta: 'Activate International License via NOWPayments USDT',
    qualifiedLeads: 9,
    cpaUsd: 22.0,
  },
  blog: {
    channel: 'Cornerstone Technical SEO Blog',
    headline: 'The Complete Architecture of a $1M MRR One-Person Company',
    body: '# Mastering Autonomous Operations with Deterministic Harnesses\n\n1. Declarative Business Packs (ke_toan, thue_dnvn, zalo_oa)\n2. Payload-Bound SHA-256 Action Approvals\n3. Dual-Rail RaaS Settlement (VietQR Napas 247 + NOWPayments Crypto)',
    hashtags: ['#Architecture', '#HarnessEngineering', '#OPC2027', '#SaaS'],
    cta: 'Run mekong marketing cmo-run to deploy your 30-day growth engine',
    qualifiedLeads: 15,
    cpaUsd: 13.8,
  },
  social: {
    channel: 'X / Social Viral Thread',
    headline: '🚀 Stop paying 5x token markups for black-box AI wrappers',
    body: 'Meet MEKONG OPC 2027:\n⚡ 4-Pillar CMO Swarm (Content, SEO, SDR Outreach, A/B Growth Lab)\n🛡️ Cryptographic SHA-256 approval gates\n💳 Instant VietQR & USDT settlement\n\nShip your entire marketing pipeline in one CLI command.',
    hashtags: ['#BuildInPublic', '#IndieHackers', '#AIAutomation', '#MekongCLI'],
    cta: 'Start in 60 seconds at mekongmind.com',
    qualifiedLeads: 10,
    cpaUsd: 17.5,
  },
};

const SDR_LEADS = [
  { id: 'lead_92a1', company: 'Alpha Studio Tech', score: 92, tier: 'PREMIUM', rail: 'VietQR Napas 247' },
  { id: 'lead_88b4', company: 'Fintech Global Hub', score: 95, tier: 'ENTERPRISE', rail: 'NOWPayments USDT' },
  { id: 'lead_85c9', company: 'Smart Invoicing VN', score: 90, tier: 'PREMIUM', rail: 'VietQR Napas 247' },
  { id: 'lead_79d2', company: 'Sovereign Solo Founder', score: 89, tier: 'MASTER', rail: 'NOWPayments USDT' },
];

export default function CmoPage() {
  const [selectedChannel, setSelectedChannel] = useState<string>('zalo');
  const [topic, setTopic] = useState<string>('Tăng trưởng One-Person Company & RaaS Dual-Rail');
  const [copied, setCopied] = useState<boolean>(false);

  const current = CHANNEL_PRESETS[selectedChannel] || CHANNEL_PRESETS.zalo;

  const handleCopy = () => {
    navigator.clipboard.writeText(`mekong marketing cmo-run "${topic}" --channel ${selectedChannel}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-[#0b0f17] to-cyan-500/10 p-6 sm:p-8 backdrop-blur-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-xs uppercase tracking-wider mb-4 border border-emerald-500/40">
          ● CMO Swarm 4 Mũi Giáp Công · Full Business Operations
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Bộ Chỉ Huy Tiếp Thị &amp; Tăng Trưởng Toàn Diện
        </h1>
        <p className="mt-2 text-slate-300 text-sm sm:text-base max-w-3xl leading-relaxed">
          Tự động hóa hoàn toàn nghiệp vụ CMO: Chấp bút nội dung song ngữ VN/EN, Phân tích lỗ hổng SEO,
          Săn lead B2B SDR chấm điểm ICP và đóng cổng bằng chứng SOP{' '}
          <code className="text-emerald-400 font-mono">repeatable-channel.json</code>.
        </p>
      </div>

      {/* Channel Switcher */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { key: 'zalo', label: 'Zalo OA (VN)', sub: 'CPA $15.50 · Lead 92%' },
          { key: 'linkedin', label: 'LinkedIn B2B', sub: 'CPA $22.00 · Global' },
          { key: 'blog', label: 'SEO Blog', sub: 'CPA $13.80 · Organic' },
          { key: 'social', label: 'Social / X', sub: 'CPA $17.50 · Viral' },
        ].map((item) => {
          const active = selectedChannel === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setSelectedChannel(item.key)}
              className={`rounded-xl border p-4 text-left transition-all ${
                active
                  ? 'border-emerald-500 bg-emerald-500/15 text-white shadow-lg'
                  : 'border-white/10 bg-[#0b0f17] text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="text-xs font-mono uppercase text-emerald-400">Pillar #1 &amp; #2</div>
              <div className="text-base font-bold text-white mt-1">{item.label}</div>
              <div className="text-xs text-slate-400 font-mono mt-1">{item.sub}</div>
            </button>
          );
        })}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Content & SEO Engine */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-white/10 bg-[#0b0f17] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">
                  Mũi 1 &amp; 2: Nội dung &amp; SEO
                </span>
                <h2 className="text-xl font-bold text-white mt-1">{current.channel}</h2>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
                Live Synthesized
              </span>
            </div>

            <div>
              <label htmlFor="topic-input" className="block text-xs font-mono uppercase text-slate-400 mb-1.5">
                Chủ đề chiến dịch (Strategic Brief)
              </label>
              <input
                id="topic-input"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#06080d] px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="rounded-xl bg-[#06080d] border border-white/10 p-4 space-y-3">
              <div>
                <div className="text-[11px] font-mono text-slate-500 uppercase">Tiêu đề bài viết</div>
                <div className="text-base font-bold text-emerald-400">{current.headline}</div>
              </div>
              <div>
                <div className="text-[11px] font-mono text-slate-500 uppercase">Nội dung tiếp thị sẵn sàng xuất bản</div>
                <pre className="text-xs text-slate-200 whitespace-pre-wrap font-sans leading-relaxed mt-1">
                  {current.body}
                </pre>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {current.hashtags.map((h) => (
                  <span
                    key={h}
                    className="text-xs font-mono text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20"
                  >
                    {h}
                  </span>
                ))}
              </div>
              <div className="pt-2 border-t border-white/10 text-xs flex items-center justify-between">
                <span className="text-slate-400">
                  <strong className="text-white">Kêu gọi hành động (CTA):</strong> {current.cta}
                </span>
                <span className="text-emerald-400 font-mono">SEO Score: 95/100</span>
              </div>
            </div>
          </div>

          {/* SDR Qualified Leads */}
          <div className="rounded-2xl border border-white/10 bg-[#0b0f17] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">
                  Mũi 3: B2B SDR Outreach
                </span>
                <h2 className="text-xl font-bold text-white mt-1">Khách hàng mục tiêu đủ điều kiện (ICP &gt;= 70%)</h2>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {current.qualifiedLeads} Leads đủ chuẩn · CPA ${current.cpaUsd.toFixed(2)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 font-mono uppercase">
                    <th className="py-2.5 px-3">Lead ID</th>
                    <th className="py-2.5 px-3">Doanh nghiệp</th>
                    <th className="py-2.5 px-3">Điểm ICP</th>
                    <th className="py-2.5 px-3">Gói đề xuất</th>
                    <th className="py-2.5 px-3">Cổng thanh toán</th>
                    <th className="py-2.5 px-3">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {SDR_LEADS.map((lead) => (
                    <tr key={lead.id} className="hover:bg-white/5">
                      <td className="py-2.5 px-3 font-mono text-slate-500">{lead.id}</td>
                      <td className="py-2.5 px-3 font-semibold text-white">{lead.company}</td>
                      <td className="py-2.5 px-3 font-mono text-emerald-400 font-bold">{lead.score}%</td>
                      <td className="py-2.5 px-3 font-mono text-cyan-300">{lead.tier}</td>
                      <td className="py-2.5 px-3 font-mono text-amber-300">{lead.rail}</td>
                      <td className="py-2.5 px-3">
                        <Link
                          href={`/checkout/${lead.tier.toLowerCase()}`}
                          className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300"
                        >
                          Checkout →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: SOP Contract & CLI Command */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-emerald-500/30 bg-[#0b0f17] p-6 space-y-4">
            <div className="text-xs font-mono uppercase text-emerald-400 tracking-wider">
              Mũi 4: SOP Evidence Gate
            </div>
            <h3 className="text-lg font-bold text-white">repeatable-channel.json</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Hợp đồng bằng chứng 14 trường dữ liệu chuẩn phòng Growth Marketing, tự động bàn giao sang bộ phận Sales &amp; Revenue.
            </p>
            <div className="rounded-xl bg-[#06080d] border border-white/10 p-3.5 font-mono text-[11px] text-emerald-300 space-y-1.5">
              <div>✓ audience &amp; positioning</div>
              <div>✓ campaign &amp; campaign_asset</div>
              <div>✓ email_sequence (3 bước)</div>
              <div>✓ outreach_log &amp; qualification_rule</div>
              <div>✓ opt_out_compliance (NĐ 91/2020)</div>
              <div>✓ leads, conversion &amp; sales_handoff</div>
            </div>
            <div className="pt-2">
              <Link
                href="/checkout/basic"
                className="block text-center rounded-xl bg-emerald-500 px-4 py-3 text-xs font-bold text-slate-950 transition-colors hover:bg-emerald-400"
              >
                Kích hoạt Dual-Rail RaaS Checkout
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0b0f17] p-6 space-y-4">
            <div className="text-xs font-mono uppercase text-cyan-400 tracking-wider">
              Lệnh Điều Hành Mekong CLI
            </div>
            <h3 className="text-base font-bold text-white">Thực thi tức thì trên Terminal</h3>
            <div className="rounded-xl bg-[#06080d] border border-white/10 p-3.5 font-mono text-xs text-slate-300 space-y-2">
              <div>
                <div className="text-slate-500"># Chạy toàn bộ CMO Swarm 4 mũi:</div>
                <div className="text-emerald-400 break-all">
                  mekong marketing cmo-run &quot;{topic.slice(0, 25)}&quot;
                </div>
              </div>
              <div>
                <div className="text-slate-500"># Săn lead B2B SDR:</div>
                <div className="text-cyan-400">mekong marketing outreach -c {selectedChannel}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="w-full rounded-xl border border-white/20 bg-white/5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-white/10"
            >
              {copied ? '✓ Đã sao chép lệnh' : 'Sao chép lệnh CLI'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
