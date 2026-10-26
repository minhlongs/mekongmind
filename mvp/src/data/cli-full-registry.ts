import rawRegistryJson from './cli-full-registry.json';

export type OperatingLayerId = 'L0' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5';

export type DepartmentId =
  | 'ceo-command'
  | 'market-intelligence'
  | 'product-strategy'
  | 'engineering-factory'
  | 'quality-compliance'
  | 'platform-operations'
  | 'growth-marketing'
  | 'sales-revenue'
  | 'customer-success'
  | 'knowledge-memory';

export type ClusterId = 'csuite' | 'sdlc' | 'bizops' | 'vn_statutory';

export interface OperatingLayerMeta {
  id: OperatingLayerId;
  name: string;
  vnTitle: string;
  summary: string;
  gateId: string;
  revenueStage: string;
  departments: DepartmentId[];
}

export interface DepartmentMeta {
  id: DepartmentId;
  name: string;
  vnName: string;
  layerId: OperatingLayerId;
  ownerAgent: string;
  supportAgents: string[];
  sopChain: string[];
  gateId: string;
  gateArtifact: string;
  mission: string;
}

export interface ClusterMeta {
  id: ClusterId;
  label: string;
  shortLabel: string;
  badgeColor: string;
  description: string;
}

export interface CliCommandEntry {
  id: string;
  name: string;
  command: string;
  aliases: string[];
  cluster: ClusterId;
  departmentId: DepartmentId;
  departmentName: string;
  layerId: OperatingLayerId;
  ownerAgent: string;
  supportAgents: string[];
  sopChain: string[];
  gateArtifact: string;
  gateId: string;
  desc: string;
  deliverable: string;
  sampleOutput: string;
}

export const OPERATING_LAYERS: OperatingLayerMeta[] = [
  {
    id: 'L0',
    name: 'Founder Intent Intake',
    vnTitle: 'Tầng L0 · Ý Chí Sáng Lập & Điều Phối',
    summary: 'Chuyển hóa ý tưởng thô của Founder thành bản thiết kế công ty, mục tiêu chiến lược và lệnh điều phối phòng ban.',
    gateId: 'company-blueprint',
    revenueStage: 'Stage 0 · Blueprint ($0 -> Validated Thesis)',
    departments: ['ceo-command'],
  },
  {
    id: 'L1',
    name: 'Market Terrain & Offer',
    vnTitle: 'Tầng L1 · Thẩm Định Thị Trường & Đóng Gói Offer',
    summary: 'Phân tích đối thủ, pháp lý chuyên ngành, định giá gói dịch vụ và xác thực chân dung khách hàng mục tiêu (ICP).',
    gateId: 'offer-validated',
    revenueStage: 'Stage 1 · Offer Validation ($1K–$5K MRR)',
    departments: ['market-intelligence', 'product-strategy'],
  },
  {
    id: 'L2',
    name: 'Product Engineering Factory',
    vnTitle: 'Tầng L2 · Nhà Máy Kỹ Thuật, Pháp Chế & Hạ Tầng',
    summary: 'Lập trình tự hành TDD, kiểm toán tuân thủ pháp luật/bảo mật và vận hành hạ tầng triển khai liên tục.',
    gateId: 'mvp-live',
    revenueStage: 'Stage 2 · Production Live ($5K–$25K MRR)',
    departments: ['engineering-factory', 'quality-compliance', 'platform-operations'],
  },
  {
    id: 'L3',
    name: 'Revenue Capture Loop',
    vnTitle: 'Tầng L3 · Vòng Lặp Tăng Trưởng & Thu Phí',
    summary: 'Vận hành CMO Swarm đa kênh, chốt đơn B2B, đối soát thanh toán VietQR/USDT và hạch toán thuế/kế toán chuẩn VN.',
    gateId: 'first-revenue',
    revenueStage: 'Stage 3 · Repeatable Revenue ($25K–$100K MRR)',
    departments: ['growth-marketing', 'sales-revenue'],
  },
  {
    id: 'L4',
    name: 'Fulfillment & Retention',
    vnTitle: 'Tầng L4 · Bàn Giao Nghiệp Vụ & Giữ Chân Khách Hàng',
    summary: 'Tự động hóa bàn giao kết quả, chăm sóc khách hàng, kiểm soát chất lượng ngành dọc và gia tăng giá trị vòng đời (LTV).',
    gateId: 'fulfillment-stable',
    revenueStage: 'Stage 4 · Retention & Expansion ($100K–$350K MRR)',
    departments: ['customer-success'],
  },
  {
    id: 'L5',
    name: 'Clone Memory & Scale',
    vnTitle: 'Tầng L5 · Bộ Nhớ Nhân Bản & Mở Rộng Quy Mô',
    summary: 'Đóng gói SOP, sổ cái quyết định và kho tri thức để nhân bản sang các công ty Solo tiếp theo hướng tới mốc $1M ARR.',
    gateId: 'scale-ready',
    revenueStage: 'Stage 5 · Sovereign Clone Scale ($350K–$1M+ ARR)',
    departments: ['knowledge-memory'],
  },
];

export const DEPARTMENTS: DepartmentMeta[] = [
  {
    id: 'ceo-command',
    name: 'CEO Command',
    vnName: '01. Ban Chỉ Huy CEO (CEO Command)',
    layerId: 'L0',
    ownerAgent: 'planner',
    supportAgents: ['cli-expert', 'project-manager', 'brainstormer'],
    sopChain: ['intent-parse', 'company-frame', 'department-route', 'gate-lock'],
    gateId: 'company-blueprint',
    gateArtifact: 'state/evidence/company-blueprint.json',
    mission: 'Biến mục tiêu của Founder thành bản đồ điều phối 10 phòng ban kèm tiêu chuẩn nghiệm thu.',
  },
  {
    id: 'market-intelligence',
    name: 'Market Intelligence',
    vnName: '02. Tình Báo Thị Trường (Market Intelligence)',
    layerId: 'L1',
    ownerAgent: 'research-expert',
    supportAgents: ['gemini-analyzer', 'code-search', 'oracle'],
    sopChain: ['icp-scan', 'competitor-map', 'demand-proof', 'wedge-select'],
    gateId: 'offer-validated',
    gateArtifact: 'state/evidence/offer-validated.json',
    mission: 'Xác thực nhu cầu thị trường, đối thủ cạnh tranh và điểm đột phá thương mại.',
  },
  {
    id: 'product-strategy',
    name: 'Product Strategy',
    vnName: '03. Chiến Lược Sản Phẩm & Pháp Lý Thương Mại',
    layerId: 'L1',
    ownerAgent: 'business-analyst',
    supportAgents: ['ui-ux-designer', 'project-manager', 'planner'],
    sopChain: ['offer-design', 'pricing-ladder', 'scope-lock', 'acceptance-spec'],
    gateId: 'offer-validated',
    gateArtifact: 'state/evidence/offer-validated.json',
    mission: 'Đóng gói sản phẩm, khung pháp lý doanh nghiệp, hợp đồng và cấu trúc giá bán.',
  },
  {
    id: 'engineering-factory',
    name: 'Engineering Factory',
    vnName: '04. Nhà Máy Kỹ Thuật & Công Nghiệp (Engineering)',
    layerId: 'L2',
    ownerAgent: 'fullstack-developer',
    supportAgents: ['react-expert', 'nestjs-expert', 'database-postgres-expert'],
    sopChain: ['architecture-slice', 'build-vertical', 'wire-billing', 'smoke-verify'],
    gateId: 'mvp-live',
    gateArtifact: 'state/evidence/mvp-live.json',
    mission: 'Xây dựng mã nguồn sản xuất, tự động hóa công nghiệp, hạ tầng kỹ thuật và nghiệm thu.',
  },
  {
    id: 'quality-compliance',
    name: 'Quality & Compliance',
    vnName: '05. Kiểm Toán Chất Lượng & Pháp Chế Tuân Thủ',
    layerId: 'L2',
    ownerAgent: 'code-review-expert',
    supportAgents: ['jest-testing-expert', 'e2e-playwright-expert', 'code-quality-linting-expert'],
    sopChain: ['static-gate', 'test-gate', 'security-audit', 'release-signoff'],
    gateId: 'mvp-live',
    gateArtifact: 'state/evidence/mvp-live.json',
    mission: 'Chặn mọi rủi ro bảo mật, lỗi kỹ thuật và vi phạm pháp luật/hành chính trước khi xuất bản.',
  },
  {
    id: 'platform-operations',
    name: 'Platform Operations',
    vnName: '06. Vận Hành Hạ Tầng & An Ninh Mạng (Platform Ops)',
    layerId: 'L2',
    ownerAgent: 'infrastructure-github-actions-expert',
    supportAgents: ['devops-expert', 'infrastructure-docker-expert', 'git-manager'],
    sopChain: ['env-check', 'pipeline-run', 'deploy-verify', 'rollback-ready'],
    gateId: 'mvp-live',
    gateArtifact: 'state/evidence/mvp-live.json',
    mission: 'Giữ cho toàn bộ đường ống triển khai, cổng AI, viễn thông và bảo mật dữ liệu hoạt động 24/7.',
  },
  {
    id: 'growth-marketing',
    name: 'Growth Marketing',
    vnName: '07. Tiếp Thị Tăng Trưởng & Truyền Thông (Growth)',
    layerId: 'L3',
    ownerAgent: 'brainstormer',
    supportAgents: ['business-analyst', 'docs-manager', 'ui-ux-designer'],
    sopChain: ['positioning-hook', 'channel-asset', 'launch-wave', 'conversion-review'],
    gateId: 'repeatable-channel',
    gateArtifact: 'state/evidence/repeatable-channel.json',
    mission: 'Tạo phễu thu hút khách hàng tự động qua SEO, Zalo OA, thương mại điện tử và truyền thông.',
  },
  {
    id: 'sales-revenue',
    name: 'Sales & Revenue',
    vnName: '08. Doanh Thu, Tài Chính & Thuế Kế Toán (Sales & CFO)',
    layerId: 'L3',
    ownerAgent: 'business-analyst',
    supportAgents: ['project-manager', 'planner'],
    sopChain: ['offer-frame', 'checkout-path', 'payment-verify', 'mrr-ledger'],
    gateId: 'first-revenue',
    gateArtifact: 'state/evidence/first-revenue.json',
    mission: 'Chốt doanh thu, đối soát thanh toán VietQR/USDT và quyết toán Thuế/Kế toán/BHXH chuẩn Việt Nam.',
  },
  {
    id: 'customer-success',
    name: 'Customer Success & Fulfillment',
    vnName: '09. Bàn Giao & Chăm Sóc Khách Hàng (Customer Success)',
    layerId: 'L4',
    ownerAgent: 'project-manager',
    supportAgents: ['triage-expert', 'docs-manager', 'business-analyst'],
    sopChain: ['onboarding-pack', 'delivery-check', 'support-loop', 'expansion-trigger'],
    gateId: 'fulfillment-stable',
    gateArtifact: 'state/evidence/fulfillment-stable.json',
    mission: 'Đảm bảo bàn giao dịch vụ chuẩn xác, vận hành chuyên ngành Y tế/Giáo dục/Nông nghiệp và giữ chân khách hàng.',
  },
  {
    id: 'knowledge-memory',
    name: 'Knowledge & Memory',
    vnName: '10. Kho Tri Thức & Bộ Nhớ Nhân Bản (Knowledge & Memory)',
    layerId: 'L5',
    ownerAgent: 'docs-manager',
    supportAgents: ['journal-writer', 'documentation-expert', 'planner'],
    sopChain: ['decision-log', 'sop-update', 'playbook-extract', 'clone-sync'],
    gateId: 'scale-ready',
    gateArtifact: 'state/evidence/scale-ready.json',
    mission: 'Lưu trữ toàn bộ quyết định, quy trình SOP và bài học vận hành để nhân bản công ty Solo.',
  },
];

export const BUSINESS_CLUSTERS: ClusterMeta[] = [
  {
    id: 'csuite',
    label: 'Khối A · Ban Giám Đốc AI & Chiến Lược (C-Suite)',
    shortLabel: 'A. C-Suite & Strategy',
    badgeColor: 'text-amber-300 border-amber-500/30 bg-amber-500/10',
    description: 'Bộ tứ C-Suite (CFO, CMO, CSO, CTO), Binh Pháp Tôn Tử, quản trị hiến pháp ZenOS và điều hành công ty 1 người.',
  },
  {
    id: 'sdlc',
    label: 'Khối B · Nhà Máy Lập Trình Tự Hành (Autonomous SDLC)',
    shortLabel: 'B. Autonomous SDLC',
    badgeColor: 'text-cyan-300 border-cyan-500/30 bg-cyan-500/10',
    description: 'Chu trình Spec -> Design -> Cook TDD -> Verify -> Ship, điều phối Swarm đa Agent và cổng OmniRoute.',
  },
  {
    id: 'bizops',
    label: 'Khối C · Vận Hành Phòng Ban & Kinh Doanh (Business Ops)',
    shortLabel: 'C. Business Dept Ops',
    badgeColor: 'text-purple-300 border-purple-500/30 bg-purple-500/10',
    description: 'Bán hàng B2B, tiếp thị tăng trưởng, sản xuất nội dung, đối soát cước phí, chợ Plugin và quản lý 58 Unified Agents.',
  },
  {
    id: 'vn_statutory',
    label: 'Khối D · 130+ Bộ Nghiệp Vụ & Pháp Điển Việt Nam (VN Statutory)',
    shortLabel: 'D. 130+ Ngành & Luật VN',
    badgeColor: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10',
    description: 'Hệ thống 130+ mô-đun nghiệp vụ chuyên ngành và pháp luật Việt Nam (Thuế TT78, Kế toán TT200, BHXH, VietQR, Zalo OA, Luật Doanh nghiệp, Đất đai, Xây dựng, Y dược...).',
  },
];

export const CLI_FULL_REGISTRY: CliCommandEntry[] = rawRegistryJson as CliCommandEntry[];

export function getCrossMappingMatrix(): Record<DepartmentId, Record<ClusterId, CliCommandEntry[]>> {
  const matrix = {} as Record<DepartmentId, Record<ClusterId, CliCommandEntry[]>>;
  for (const dept of DEPARTMENTS) {
    matrix[dept.id] = {
      csuite: [],
      sdlc: [],
      bizops: [],
      vn_statutory: [],
    };
  }
  for (const item of CLI_FULL_REGISTRY) {
    if (matrix[item.departmentId] && matrix[item.departmentId][item.cluster]) {
      matrix[item.departmentId][item.cluster].push(item);
    }
  }
  return matrix;
}
