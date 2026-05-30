import type { Variant } from './variant';

export interface HeroContent {
  eyebrow: string;
  headline: string;
  sub: string;
  cta1: string;
  cta2: string;
}

export const heroContent: Record<Variant, HeroContent> = {
  generic: {
    eyebrow: 'AI Agent Orchestration Platform',
    headline: 'Build & deploy AI agents — zero infra — in minutes.',
    sub: '25+ MCP tools, multi-provider LLM gateway, usage-based billing via Polar. For startups & indie devs in SEA who need production AI infrastructure without the ops headache.',
    cta1: 'Start Free — $0',
    cta2: 'Xem tính năng',
  },
  ocop: {
    eyebrow: 'Giải pháp OCOP',
    headline: 'Chuyển đổi số cho sản phẩm OCOP — trong vài phút.',
    sub: 'Nền tảng AI Agent dành cho hợp tác xã, tổ hợp tác và doanh nghiệp OCOP tại Việt Nam.',
    cta1: 'Dùng thử miễn phí',
    cta2: 'Xem giải pháp',
  },
  htx: {
    eyebrow: 'Giải pháp Hợp tác xã',
    headline: 'AI Agent cho hợp tác xã — tự động hóa vận hành.',
    sub: '22 mô-đun nghiệp vụ, 385 quy trình tự động. Dành cho HTX muốn chuyển đổi số toàn diện.',
    cta1: 'Dùng thử miễn phí',
    cta2: 'Xem giải pháp',
  },
  tourism: {
    eyebrow: 'Giải pháp Du lịch',
    headline: 'AI Agent cho ngành du lịch — từ đặt tour đến CSKH.',
    sub: 'Tự động hóa đặt phòng, CSKH đa kênh, tối ưu vận hành cho doanh nghiệp du lịch.',
    cta1: 'Dùng thử miễn phí',
    cta2: 'Xem giải pháp',
  },
};

export interface PageMeta {
  title: string;
  description: string;
  ogImage?: string;
}

export const pageMeta: Record<Variant, PageMeta> = {
  generic: {
    title: 'MekongMind — AI Agent Orchestration Platform',
    description: 'Build & deploy AI agents with 25+ MCP tools, multi-provider LLM gateway, and usage-based billing. For SEA startups & indie devs.',
  },
  ocop: {
    title: 'MekongMind OCOP — Chuyển đổi số cho sản phẩm OCOP',
    description: 'Nền tảng AI Agent cho hợp tác xã, tổ hợp tác và doanh nghiệp OCOP. Tự động hóa vận hành, tiếp thị, bán hàng đa kênh.',
  },
  htx: {
    title: 'MekongMind HTX — AI Agent cho hợp tác xã',
    description: '22 mô-đun nghiệp vụ, 385 quy trình tự động cho hợp tác xã. Nền tảng AI Agent chuyển đổi số toàn diện.',
  },
  tourism: {
    title: 'MekongMind Du lịch — AI Agent cho ngành du lịch',
    description: 'Tự động hóa đặt phòng, CSKH đa kênh, tối ưu vận hành cho doanh nghiệp du lịch với nền tảng AI Agent.',
  },
};
