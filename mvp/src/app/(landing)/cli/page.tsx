'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  BUSINESS_CLUSTERS,
  CLI_FULL_REGISTRY,
  CliCommandEntry,
  ClusterId,
  DEPARTMENTS,
  DepartmentId,
  MATURITY_TIERS,
  MaturityTier,
  OPERATING_LAYERS,
  OperatingLayerId,
  getCapabilityContract,
  getCrossMappingMatrix,
} from '@/data/cli-full-registry';
import type { CommandReceipt, ExecutionRunResult, MilestoneGate } from '@/lib/cli-execution-bridge';

type PageSizeOption = 12 | 24 | 48 | 'all';

const PAGE_SIZE_OPTIONS: PageSizeOption[] = [12, 24, 48, 'all'];

function buildPaginationItems(
  currentPage: number,
  totalPages: number
): Array<number | 'ellipsis-left' | 'ellipsis-right'> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, idx) => idx + 1);
  }

  const items: Array<number | 'ellipsis-left' | 'ellipsis-right'> = [1];
  const leftSibling = Math.max(currentPage - 1, 2);
  const rightSibling = Math.min(currentPage + 1, totalPages - 1);

  if (leftSibling > 2) {
    items.push('ellipsis-left');
  }

  for (let page = leftSibling; page <= rightSibling; page += 1) {
    items.push(page);
  }

  if (rightSibling < totalPages - 1) {
    items.push('ellipsis-right');
  }

  items.push(totalPages);
  return items;
}

const DEFAULT_COMMAND_ID = 'cfo';

function fallbackCommand(): CliCommandEntry {
  return CLI_FULL_REGISTRY.find((item) => item.id === DEFAULT_COMMAND_ID) || CLI_FULL_REGISTRY[0];
}

function findCommandById(id: string): CliCommandEntry | null {
  return CLI_FULL_REGISTRY.find((item) => item.id === id) || null;
}

type InspectorTabId = 'overview' | 'pinout' | 'simulator' | 'specs';

const INSPECTOR_TABS: Array<{ id: InspectorTabId; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'pinout', label: 'Pinout' },
  { id: 'simulator', label: 'Simulator' },
  { id: 'specs', label: 'Specs' },
];

const CLUSTER_BADGE_LETTER: Record<ClusterId, string> = {
  csuite: 'A',
  sdlc: 'B',
  bizops: 'C',
  vn_statutory: 'D',
};

const SOP_SHORT_LABEL: Record<string, string> = {
  'intent-parse': 'Intent Parse',
  'company-frame': 'Company Frame',
  'department-route': 'Department Route',
  'gate-lock': 'Gate Lock',
  'icp-scan': 'ICP Scan',
  'competitor-map': 'Competitor Map',
  'demand-proof': 'Demand Proof',
  'wedge-select': 'Wedge Select',
  'offer-design': 'Offer Design',
  'pricing-ladder': 'Pricing Ladder',
  'scope-lock': 'Scope Lock',
  'acceptance-spec': 'Acceptance Spec',
  'architecture-slice': 'Architecture Slice',
  'build-vertical': 'Build Vertical',
  'wire-billing': 'Wire Billing',
  'smoke-verify': 'Smoke Verify',
  'static-gate': 'Static Gate',
  'test-gate': 'Test Gate',
  'security-audit': 'Security Audit',
  'release-signoff': 'Release Sign-off',
  'env-check': 'Env Check',
  'pipeline-run': 'Pipeline Run',
  'deploy-verify': 'Deploy Verify',
  'rollback-ready': 'Rollback Ready',
  'positioning-hook': 'Positioning Hook',
  'channel-asset': 'Channel Asset',
  'launch-wave': 'Launch Wave',
  'conversion-review': 'Conversion Review',
  'offer-frame': 'Offer Frame',
  'checkout-path': 'Checkout Path',
  'payment-verify': 'Payment Verify',
  'mrr-ledger': 'MRR Ledger',
  'onboarding-pack': 'Onboarding Pack',
  'delivery-check': 'Delivery Check',
  'support-loop': 'Support Loop',
  'expansion-trigger': 'Expansion Trigger',
  'decision-log': 'Decision Log',
  'sop-update': 'SOP Update',
  'playbook-extract': 'Playbook Extract',
  'clone-sync': 'Clone Sync',
};

function sopShortLabel(step: string): string {
  return SOP_SHORT_LABEL[step] || step;
}

function readHashCommandId(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const raw = window.location.hash.replace(/^#/, '').trim();
  if (!raw) {
    return null;
  }
  const matched = CLI_FULL_REGISTRY.find((item) => item.id === raw);
  return matched ? matched.id : null;
}

function clusterBadgeClass(clusterId: ClusterId): string {
  const meta = BUSINESS_CLUSTERS.find((c) => c.id === clusterId);
  return meta ? meta.badgeColor : 'border-white/10 bg-white/5 text-white/50';
}

const PIN_LABELS = [
  'PIN 1 · CLI Input',
  'PIN 2 · Owner & Support Agents',
  'PIN 3 · L0–L5 Department',
  'PIN 4 · 4-Step SOP LED Chain',
  'PIN 5 · SHA-256 Gate Artifact',
];

const PULSE_POINTS: Array<{ x: number; y: number }> = [
  { x: 100, y: 60 },
  { x: 100, y: 100 },
  { x: 100, y: 140 },
  { x: 420, y: 60 },
  { x: 420, y: 100 },
];

function pulseX(step: number): number {
  const point = PULSE_POINTS[Math.min(Math.max(step, 1), 5) - 1];
  return point.x;
}

function pulseY(step: number): number {
  const point = PULSE_POINTS[Math.min(Math.max(step, 1), 5) - 1];
  return point.y;
}

export default function MekongCliPage() {
  const [selectedLayer, setSelectedLayer] = useState<OperatingLayerId | 'all'>('all');
  const [selectedDept, setSelectedDept] = useState<DepartmentId | 'all'>('all');
  const [selectedCluster, setSelectedCluster] = useState<ClusterId | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [pageSize, setPageSize] = useState<PageSizeOption>(24);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [inspectedCommand, setInspectedCommand] = useState<CliCommandEntry>(() => fallbackCommand());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<InspectorTabId>('overview');
  const [simStep, setSimStep] = useState<number>(0);
  const [terminalTab, setTerminalTab] = useState<'preview' | 'live'>('live');
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [liveRunResult, setLiveRunResult] = useState<ExecutionRunResult | null>(null);
  const [liveRunError, setLiveRunError] = useState<string | null>(null);
  const [receiptVerified, setReceiptVerified] = useState<{
    checked: boolean;
    valid: boolean;
    source: string;
  } | null>(null);
  const [companyGates, setCompanyGates] = useState<MilestoneGate[]>([]);
  const [isReconcilingGate, setIsReconcilingGate] = useState<boolean>(false);
  const [reconcileNotice, setReconcileNotice] = useState<string | null>(null);

  const inspectedContract = useMemo(
    () => getCapabilityContract(inspectedCommand.name),
    [inspectedCommand.name]
  );

  const inspectedMaturityMeta = useMemo(() => {
    const tier: MaturityTier = inspectedContract?.maturity_tier || 'CATALOG_ONLY';
    return MATURITY_TIERS[tier];
  }, [inspectedContract]);

  const matrix = useMemo(() => getCrossMappingMatrix(), []);

  useEffect(() => {
    fetch('/api/cli/gates')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.gates)) {
          setCompanyGates(data.gates);
        }
      })
      .catch(() => {
        // Ignore network errors during initial hydration
      });
  }, []);

  const defaultParamsFor = (cmdEntry: CliCommandEntry): Record<string, unknown> => {
    if (cmdEntry.name === 'thue') {
      return { subcommand: 'tncn', gross_income: 35_000_000, dependents: 1 };
    }
    if (cmdEntry.name === 'ke-toan') {
      return { subcommand: 'journal', amount: 25_000_000, buyer: 'Cong Ty TNHH Mekong' };
    }
    if (cmdEntry.name === 'bhxh') {
      return { subcommand: 'calculate', salary: 30_000_000, region: 1 };
    }
    if (cmdEntry.name === 'vietqr') {
      return { subcommand: 'generate', amount: 2_500_000, memo: 'THANH TOAN MEKONG' };
    }
    if (cmdEntry.name === 'adminsanction') {
      return {
        subcommand: 'calculate',
        entity_type: 'ORGANIZATION',
        min_fine: 10_000_000,
        max_fine: 20_000_000,
        mitigating_count: 1,
      };
    }
    if (cmdEntry.name === 'payroll') {
      return { subcommand: 'calculate', gross: 35_000_000, dependents: 1, region: 1 };
    }
    if (['cfo', 'cmo', 'cso', 'cto', 'csuite', 'binh-phap', 'board-meeting'].includes(cmdEntry.name)) {
      return {
        subcommand: 'brief',
        horizon: 'Q4-2026',
        objective: 'Scale Vietnam SME & OPC RaaS to $1M ARR',
      };
    }
    if (['cook', 'plan', 'spec', 'autonomous', 'pev', 'swarm', 'goal'].includes(cmdEntry.name)) {
      return {
        subcommand: 'plan',
        goal: 'Deploy automated VietQR + E-Invoice TT78 reconciliation workflow',
        dry_run: true,
      };
    }
    if (cmdEntry.name === 'benchmark') {
      return { suite: 'pev', iterations: 5 };
    }
    if (['opc', 'sales', 'marketing', 'revenue', 'crm', 'pipeline'].includes(cmdEntry.name)) {
      return { subcommand: 'metrics', segment: 'VN_OPC_FOUNDER', currency: 'VND' };
    }
    if (
      ['zalo-oa', 'ecom', 'audit', 'taxadmin', 'einvoice', 'tort', 'inheritance'].includes(
        cmdEntry.name
      )
    ) {
      return { subcommand: 'status', jurisdiction: 'VN', compliance_check: true };
    }
    return { subcommand: 'status' };
  };

  const handleRunLiveCommand = async (cmdEntry: CliCommandEntry) => {
    setIsExecuting(true);
    setLiveRunError(null);
    setReceiptVerified(null);
    setActiveTab('simulator');
    setSimStep(1);

    try {
      const res = await fetch('/api/cli/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command_id: cmdEntry.name,
          params: defaultParamsFor(cmdEntry),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLiveRunError(data?.error || 'Execution failed');
      } else {
        setLiveRunResult(data as ExecutionRunResult);
        setSimStep(5);
      }
    } catch (err) {
      setLiveRunError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleVerifyReceipt = async (receipt: CommandReceipt) => {
    try {
      const res = await fetch('/api/cli/receipts/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receipt }),
      });
      const data = await res.json();
      setReceiptVerified({
        checked: true,
        valid: Boolean(data?.valid),
        source: String(data?.source || 'verifier'),
      });
    } catch {
      setReceiptVerified({
        checked: true,
        valid: false,
        source: 'error',
      });
    }
  };

  const handleReconcileMilestoneGate = async (layerId: OperatingLayerId, runId: string) => {
    const targetGate = companyGates.find((g) => g.layer_id === layerId);
    const gateId = targetGate?.gate_id || inspectedContract?.gate_id || 'mvp-live';
    setIsReconcilingGate(true);
    setReconcileNotice(null);
    try {
      const transactionId = `TXN-NAPAS247-${runId}`;
      const evidenceRef = `receipt:sha256:${liveRunResult?.receipt?.signature?.slice(0, 16) || runId}`;
      const res = await fetch('/api/cli/gates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gate_id: gateId,
          transaction_id: transactionId,
          evidence_ref: evidenceRef,
        }),
      });
      if (res.ok) {
        const updatedGate = await res.json();
        setCompanyGates((prev) => {
          const exists = prev.some((g) => g.gate_id === gateId);
          if (!exists) return [...prev, updatedGate];
          return prev.map((g) => (g.gate_id === gateId ? { ...g, ...updatedGate } : g));
        });
        setReconcileNotice(`Đã đối soát thành công cổng '${gateId}' với mã giao dịch ${transactionId}`);
      } else {
        setReconcileNotice('Không thể đối soát cổng cột mốc lúc này');
      }
    } catch {
      setReconcileNotice('Lỗi kết nối khi đối soát cổng cột mốc');
    } finally {
      setIsReconcilingGate(false);
    }
  };

  const clusterTotals = useMemo(() => {
    const counts: Record<ClusterId, number> = {
      csuite: 0,
      sdlc: 0,
      bizops: 0,
      vn_statutory: 0,
    };
    for (const item of CLI_FULL_REGISTRY) {
      counts[item.cluster] += 1;
    }
    return counts;
  }, []);

  const layerTotals = useMemo(() => {
    const counts: Record<OperatingLayerId, number> = {
      L0: 0,
      L1: 0,
      L2: 0,
      L3: 0,
      L4: 0,
      L5: 0,
    };
    for (const item of CLI_FULL_REGISTRY) {
      counts[item.layerId] += 1;
    }
    return counts;
  }, []);

  const filteredCommands = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return CLI_FULL_REGISTRY.filter((item) => {
      if (selectedLayer !== 'all' && item.layerId !== selectedLayer) {
        return false;
      }
      if (selectedDept !== 'all' && item.departmentId !== selectedDept) {
        return false;
      }
      if (selectedCluster !== 'all' && item.cluster !== selectedCluster) {
        return false;
      }
      if (!q) {
        return true;
      }
      const inName = item.name.toLowerCase().includes(q);
      const inCmd = item.command.toLowerCase().includes(q);
      const inAliases = item.aliases.some((a) => a.toLowerCase().includes(q));
      const inDesc = item.desc.toLowerCase().includes(q);
      const inDept = item.departmentName.toLowerCase().includes(q) || item.departmentId.toLowerCase().includes(q);
      const inAgent =
        item.ownerAgent.toLowerCase().includes(q) ||
        item.supportAgents.some((a) => a.toLowerCase().includes(q));
      const inGate = item.gateId.toLowerCase().includes(q);
      return inName || inCmd || inAliases || inDesc || inDept || inAgent || inGate;
    });
  }, [selectedLayer, selectedDept, selectedCluster, searchQuery]);

  const effectivePageSize =
    pageSize === 'all' ? Math.max(filteredCommands.length, 1) : pageSize;
  const totalPages = Math.max(1, Math.ceil(filteredCommands.length / effectivePageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const rangeStart =
    filteredCommands.length === 0 ? 0 : (safeCurrentPage - 1) * effectivePageSize + 1;
  const rangeEnd = Math.min(safeCurrentPage * effectivePageSize, filteredCommands.length);

  const paginatedCommands = useMemo(() => {
    if (pageSize === 'all') {
      return filteredCommands;
    }
    const startIdx = (safeCurrentPage - 1) * pageSize;
    return filteredCommands.slice(startIdx, startIdx + pageSize);
  }, [filteredCommands, pageSize, safeCurrentPage]);

  const paginationItems = useMemo(
    () => buildPaginationItems(safeCurrentPage, totalPages),
    [safeCurrentPage, totalPages]
  );

  const inspectedCommandPage = useMemo(() => {
    if (pageSize === 'all') {
      return 1;
    }
    const idx = filteredCommands.findIndex((item) => item.id === inspectedCommand.id);
    if (idx === -1) {
      return null;
    }
    return Math.floor(idx / pageSize) + 1;
  }, [filteredCommands, inspectedCommand.id, pageSize]);

  const handlePageChange = (nextPage: number, shouldScrollToTopOfRegistry: boolean = false) => {
    const bounded = Math.min(Math.max(1, nextPage), totalPages);
    setCurrentPage(bounded);
    if (shouldScrollToTopOfRegistry) {
      const el = document.getElementById('command-registry-explorer');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const selectCommand = (entry: CliCommandEntry) => {
    setInspectedCommand(entry);
    setSimStep(0);
  };

  const handleSelectMatrixCell = (deptId: DepartmentId, clusterId: ClusterId) => {
    setCurrentPage(1);
    if (selectedDept === deptId && selectedCluster === clusterId) {
      setSelectedDept('all');
      setSelectedCluster('all');
      return;
    }
    setSelectedLayer('all');
    setSelectedDept(deptId);
    setSelectedCluster(clusterId);
    const cellItems = matrix[deptId]?.[clusterId] || [];
    if (cellItems.length > 0) {
      selectCommand(cellItems[0]);
    }
  };

  const handleSelectDepartmentRow = (deptId: DepartmentId) => {
    setCurrentPage(1);
    if (selectedDept === deptId && selectedCluster === 'all') {
      setSelectedDept('all');
      return;
    }
    setSelectedLayer('all');
    setSelectedDept(deptId);
    setSelectedCluster('all');
    const firstInDept = CLI_FULL_REGISTRY.find((c) => c.departmentId === deptId);
    if (firstInDept) {
      selectCommand(firstInDept);
    }
  };

  const handleSelectLayer = (layerId: OperatingLayerId) => {
    setCurrentPage(1);
    if (selectedLayer === layerId) {
      setSelectedLayer('all');
      setSelectedDept('all');
      return;
    }
    setSelectedLayer(layerId);
    setSelectedDept('all');
    setSelectedCluster('all');
    const firstInLayer = CLI_FULL_REGISTRY.find((c) => c.layerId === layerId);
    if (firstInLayer) {
      selectCommand(firstInLayer);
    }
  };

  const resetAllFilters = () => {
    setSelectedLayer('all');
    setSelectedDept('all');
    setSelectedCluster('all');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    selectedLayer !== 'all' ||
    selectedDept !== 'all' ||
    selectedCluster !== 'all' ||
    searchQuery.trim().length > 0;

  const activeDepartmentMeta = useMemo(
    () => DEPARTMENTS.find((d) => d.id === inspectedCommand.departmentId) || DEPARTMENTS[0],
    [inspectedCommand]
  );

  const activeClusterMeta = useMemo(
    () => BUSINESS_CLUSTERS.find((c) => c.id === inspectedCommand.cluster) || BUSINESS_CLUSTERS[0],
    [inspectedCommand]
  );

  const activeLayerMeta = useMemo(
    () => OPERATING_LAYERS.find((l) => l.id === inspectedCommand.layerId) || OPERATING_LAYERS[0],
    [inspectedCommand]
  );

  useEffect(() => {
    const hashId = readHashCommandId();
    if (hashId) {
      const entry = findCommandById(hashId);
      if (entry) {
        setInspectedCommand(entry);
        setSimStep(0);
      }
    }
  }, []);

  useEffect(() => {
    const nextHash = `#${inspectedCommand.id}`;
    if (typeof window !== 'undefined' && window.location.hash !== nextHash) {
      window.history.replaceState(null, '', nextHash);
    }
  }, [inspectedCommand.id]);

  useEffect(() => {
    const onHashChange = () => {
      const hashId = readHashCommandId();
      if (!hashId) {
        return;
      }
      const entry = findCommandById(hashId);
      if (entry && entry.id !== inspectedCommand.id) {
        setInspectedCommand(entry);
        setSimStep(0);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [inspectedCommand.id]);

  const runSimulation = () => {
    setActiveTab('simulator');
    setSimStep(1);
    const timers: Array<ReturnType<typeof setTimeout>> = [];
    for (let step = 2; step <= 5; step += 1) {
      timers.push(setTimeout(() => setSimStep(step), step * 650));
    }
    timers.push(setTimeout(() => setSimStep(0), 4200));
  };

  return (
    <div className="min-h-screen bg-[#06080d] text-white">
      {/* COMPACT HEADER BAR */}
      <header className="border-b border-white/10 bg-[#080b12] px-4 py-4 lg:px-8">
        <div className="mx-auto flex max-w-[1800px] flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-400">
              Mekong CLI · Sovereign Workbench
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight lg:text-3xl">
              {CLI_FULL_REGISTRY.length} lệnh · Không lệnh nào đứng trần
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 font-mono text-white/70">
              {CLI_FULL_REGISTRY.length} commands
            </span>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-emerald-300">
              10 depts
            </span>
            <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 font-mono text-cyan-300">
              L0–L5
            </span>
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 font-mono text-amber-300">
              SHA-256 Gate
            </span>
          </div>
        </div>

        {/* INVARIANT CHAIN */}
        <div className="mx-auto mt-4 max-w-[1800px] overflow-x-auto">
          <div className="flex min-w-max items-center gap-2 font-mono text-[11px] text-white/60">
            <span className="rounded border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-cyan-300">Command</span>
            <span className="text-white/30">→</span>
            <span className="rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-amber-300">Owner Agent</span>
            <span className="text-white/30">→</span>
            <span className="rounded border border-purple-500/30 bg-purple-500/10 px-2 py-1 text-purple-300">Department (L0–L5)</span>
            <span className="text-white/30">→</span>
            <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-emerald-300">SOP Chain</span>
            <span className="text-white/30">→</span>
            <span className="rounded border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-rose-300">SHA-256 Evidence Gate</span>
          </div>
        </div>
      </header>

      {/* 3-PANE SOVEREIGN WORKBENCH */}
      <main className="mx-auto grid max-w-[1800px] grid-cols-1 gap-4 px-4 py-5 lg:grid-cols-12 lg:px-8">
        {/* ============ LEFT DOCK (3 cols) ============ */}
        <section
          id="command-registry-explorer"
          aria-label="Command Registry Explorer"
          className="scroll-mt-4 rounded-xl border border-white/10 bg-[#0a0d14] lg:col-span-3"
        >
          <div className="border-b border-white/10 px-3 py-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">Command Registry</h2>
              <span className="font-mono text-[10px] text-emerald-400">{CLI_FULL_REGISTRY.length}</span>
            </div>
            <p className="mt-1 font-mono text-[10px] text-white/40">
              {filteredCommands.length} khớp · Trang {safeCurrentPage}/{totalPages}
            </p>
          </div>

          {/* SEARCH */}
          <div className="px-3 pt-3">
            <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-black/40 px-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="🔍 0ms search: cfo, thue, cook, TT78..."
                aria-label="Tìm kiếm lệnh"
                className="w-full bg-transparent py-2 font-mono text-[11px] text-white placeholder-white/30 outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  className="shrink-0 rounded border border-white/15 px-1.5 py-0.5 font-mono text-[10px] text-white/50 hover:text-white"
                >
                  Xóa
                </button>
              )}
            </div>
          </div>

          {/* CLUSTER FILTER PILLS */}
          <div className="px-3 pt-2">
            <p className="mb-1 font-mono text-[9px] uppercase tracking-wider text-white/30">Cluster</p>
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => {
                  setSelectedCluster('all');
                  setCurrentPage(1);
                }}
                className={`rounded border px-1.5 py-0.5 font-mono text-[10px] transition ${
                  selectedCluster === 'all'
                    ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                    : 'border-white/10 bg-white/5 text-white/50 hover:text-white'
                }`}
              >
                All ({CLI_FULL_REGISTRY.length})
              </button>
              {BUSINESS_CLUSTERS.map((cluster) => (
                <button
                  key={cluster.id}
                  type="button"
                  onClick={() => {
                    setSelectedCluster(selectedCluster === cluster.id ? 'all' : cluster.id);
                    setCurrentPage(1);
                  }}
                  className={`rounded border px-1.5 py-0.5 font-mono text-[10px] transition ${
                    selectedCluster === cluster.id
                      ? cluster.badgeColor
                      : 'border-white/10 bg-white/5 text-white/50 hover:text-white'
                  }`}
                >
                  {CLUSTER_BADGE_LETTER[cluster.id]}. ({clusterTotals[cluster.id]})
                </button>
              ))}
            </div>
          </div>

          {/* LAYER FILTER PILLS */}
          <div className="px-3 pt-2">
            <p className="mb-1 font-mono text-[9px] uppercase tracking-wider text-white/30">Layer</p>
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => {
                  setSelectedLayer('all');
                  setCurrentPage(1);
                }}
                className={`rounded border px-1.5 py-0.5 font-mono text-[10px] transition ${
                  selectedLayer === 'all'
                    ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                    : 'border-white/10 bg-white/5 text-white/50 hover:text-white'
                }`}
              >
                All
              </button>
              {OPERATING_LAYERS.map((layer) => (
                <button
                  key={layer.id}
                  type="button"
                  onClick={() => handleSelectLayer(layer.id)}
                  className={`rounded border px-1.5 py-0.5 font-mono text-[10px] transition ${
                    selectedLayer === layer.id
                      ? 'border-cyan-500/40 bg-cyan-500/20 text-cyan-300'
                      : 'border-white/10 bg-white/5 text-white/50 hover:text-white'
                  }`}
                >
                  {layer.id} ({layerTotals[layer.id]})
                </button>
              ))}
            </div>
          </div>

          {/* DEPARTMENT PILLS */}
          <div className="px-3 pt-2">
            <p className="mb-1 font-mono text-[9px] uppercase tracking-wider text-white/30">Department</p>
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => {
                  setSelectedDept('all');
                  setCurrentPage(1);
                }}
                className={`rounded border px-1.5 py-0.5 font-mono text-[10px] transition ${
                  selectedDept === 'all'
                    ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                    : 'border-white/10 bg-white/5 text-white/50 hover:text-white'
                }`}
              >
                All 10
              </button>
              {DEPARTMENTS.map((dept) => (
                <button
                  key={dept.id}
                  type="button"
                  onClick={() => handleSelectDepartmentRow(dept.id)}
                  className={`rounded border px-1.5 py-0.5 font-mono text-[10px] transition ${
                    selectedDept === dept.id
                      ? 'border-purple-500/40 bg-purple-500/20 text-purple-300'
                      : 'border-white/10 bg-white/5 text-white/50 hover:text-white'
                  }`}
                >
                  [{dept.layerId}] {dept.id}
                </button>
              ))}
            </div>
          </div>

          {hasActiveFilters && (
            <div className="px-3 pt-2">
              <button
                type="button"
                onClick={resetAllFilters}
                className="w-full rounded border border-rose-500/30 bg-rose-500/10 py-1 font-mono text-[10px] text-rose-300 hover:bg-rose-500/20"
              >
                ✕ Reset filters
              </button>
            </div>
          )}

          {/* TOP PAGINATION & PAGE-SIZE CONTROLS */}
          <div className="border-b border-white/10 px-3 py-2">
            <p className="font-mono text-[9px] text-white/40">
              Hiển thị: {rangeStart}–{rangeEnd} / {filteredCommands.length} nhóm lệnh
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-1">
              <span className="font-mono text-[9px] text-white/30">SIZE:</span>
              {PAGE_SIZE_OPTIONS.map((opt) => (
                <button
                  key={String(opt)}
                  type="button"
                  onClick={() => {
                    setPageSize(opt);
                    setCurrentPage(1);
                  }}
                  className={`rounded border px-1.5 py-0.5 font-mono text-[10px] transition ${
                    pageSize === opt
                      ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                      : 'border-white/10 bg-white/5 text-white/50 hover:text-white'
                  }`}
                >
                  {opt === 'all' ? `Tất cả (${filteredCommands.length})` : opt}
                </button>
              ))}
            </div>
            {inspectedCommandPage !== null && inspectedCommandPage !== safeCurrentPage && (
              <button
                type="button"
                onClick={() => handlePageChange(inspectedCommandPage, true)}
                className="mt-1 w-full rounded border border-amber-500/30 bg-amber-500/10 py-1 font-mono text-[10px] text-amber-300 hover:bg-amber-500/20"
              >
                📍 Nhảy tới trang {inspectedCommandPage} chứa lệnh đang thanh tra
              </button>
            )}
          </div>

          {/* COMPACT 1-LINE COMMAND LIST */}
          <ul className="max-h-[520px] divide-y divide-white/5 overflow-y-auto">
            {paginatedCommands.map((item) => {
              const isActive = item.id === inspectedCommand.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => selectCommand(item)}
                    aria-current={isActive ? 'true' : undefined}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left transition ${
                      isActive ? 'bg-emerald-500/15' : 'hover:bg-white/5'
                    }`}
                  >
                    <span className="shrink-0 font-mono text-[9px] text-white/30">#{item.id}</span>
                    <span
                      className={`min-w-0 flex-1 truncate font-mono text-[11px] ${
                        isActive ? 'text-emerald-300' : 'text-white/80'
                      }`}
                    >
                      {item.command}
                    </span>
                    <span
                      className={`shrink-0 rounded border px-1 py-0.5 font-mono text-[9px] ${
                        isActive ? 'border-emerald-500/40 text-emerald-300' : 'border-white/10 text-white/40'
                      }`}
                    >
                      {item.layerId}
                    </span>
                    <span
                      className={`shrink-0 rounded border px-1 py-0.5 font-mono text-[9px] ${clusterBadgeClass(item.cluster)}`}
                    >
                      {CLUSTER_BADGE_LETTER[item.cluster]}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {filteredCommands.length === 0 && (
            <div className="px-3 py-8 text-center">
              <p className="font-mono text-[11px] text-white/40">Không tìm thấy lệnh nào khớp bộ lọc.</p>
              <button
                type="button"
                onClick={resetAllFilters}
                className="mt-3 rounded border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-[10px] text-emerald-300"
              >
                Reset tất cả bộ lọc
              </button>
            </div>
          )}

          {/* BOTTOM NUMBERED PAGINATION BAR */}
          {totalPages > 1 && (
            <div className="border-t border-white/10 px-2 py-3">
              <p className="mb-2 text-center font-mono text-[9px] text-white/40">
                Đang hiển thị {rangeStart}–{rangeEnd} trên {filteredCommands.length} nhóm lệnh · Trang{' '}
                {safeCurrentPage} / {totalPages}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-1">
                <button
                  type="button"
                  onClick={() => handlePageChange(1, true)}
                  disabled={safeCurrentPage === 1}
                  className="rounded border border-white/10 px-1.5 py-1 font-mono text-[10px] text-white/60 transition hover:text-white disabled:opacity-30"
                >
                  « Đầu
                </button>
                <button
                  type="button"
                  onClick={() => handlePageChange(safeCurrentPage - 1, true)}
                  disabled={safeCurrentPage === 1}
                  className="rounded border border-white/10 px-1.5 py-1 font-mono text-[10px] text-white/60 transition hover:text-white disabled:opacity-30"
                >
                  ‹ Trước
                </button>
                {paginationItems.map((item, idx) => {
                  if (item === 'ellipsis-left' || item === 'ellipsis-right') {
                    return (
                      <span key={`${item}-${idx}`} className="px-1 font-mono text-[10px] text-white/30">
                        …
                      </span>
                    );
                  }
                  const pageNum = item;
                  const isCurrent = pageNum === safeCurrentPage;
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => handlePageChange(pageNum, true)}
                      aria-current={isCurrent ? 'page' : undefined}
                      className={`min-w-[28px] rounded border px-1.5 py-1 font-mono text-[10px] transition ${
                        isCurrent
                          ? 'border-emerald-500/50 bg-emerald-500/25 text-emerald-300'
                          : 'border-white/10 text-white/60 hover:text-white'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => handlePageChange(safeCurrentPage + 1, true)}
                  disabled={safeCurrentPage === totalPages}
                  className="rounded border border-white/10 px-1.5 py-1 font-mono text-[10px] text-white/60 transition hover:text-white disabled:opacity-30"
                >
                  Sau ›
                </button>
                <button
                  type="button"
                  onClick={() => handlePageChange(totalPages, true)}
                  disabled={safeCurrentPage === totalPages}
                  className="rounded border border-white/10 px-1.5 py-1 font-mono text-[10px] text-white/60 transition hover:text-white disabled:opacity-30"
                >
                  Cuối »
                </button>
              </div>
            </div>
          )}
        </section>

        {/* ============ CENTER VISUAL STAGE (5 cols) ============ */}
        <section
          id="live-command-inspector"
          aria-label="Visual Stage"
          className="flex scroll-mt-4 flex-col gap-4 rounded-xl border border-white/10 bg-[#0a0d14] p-4 lg:col-span-5"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-emerald-400">
                Đang Thanh Tra · Active Command
              </p>
              <h2 className="mt-1 truncate font-mono text-lg font-bold text-white lg:text-xl">
                {inspectedCommand.command}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className={`rounded border px-2 py-0.5 font-mono text-[10px] ${activeClusterMeta.badgeColor}`}>
                  {activeClusterMeta.shortLabel}
                </span>
                <span className="rounded border border-white/15 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-white/60">
                  Tầng {inspectedCommand.layerId} · {inspectedCommand.departmentName}
                </span>
                <span
                  className={`rounded border px-2 py-0.5 font-mono text-[10px] font-semibold ${inspectedMaturityMeta.badgeClass}`}
                  title={inspectedMaturityMeta.description}
                >
                  ● {inspectedMaturityMeta.label}
                </span>
                <span className="rounded border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 font-mono text-[10px] text-cyan-300">
                  #{inspectedCommand.id}
                </span>
              </div>
            </div>
            <div className="flex shrink-0 flex-col gap-1.5">
              <button
                type="button"
                disabled={isExecuting}
                onClick={() => handleRunLiveCommand(inspectedCommand)}
                className="rounded-lg border border-cyan-500/40 bg-cyan-500/20 px-3 py-2 font-mono text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/30 disabled:opacity-40"
              >
                {isExecuting ? '⏳ Đang chạy…' : '▶ Chạy Lệnh Thật'}
              </button>
              <button
                type="button"
                onClick={runSimulation}
                className="rounded-lg border border-emerald-500/40 bg-emerald-500/20 px-3 py-2 font-mono text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/30"
              >
                ▶ Run Simulation
              </button>
            </div>
          </div>

          {/* SVG 5-PIN SOVEREIGN IC CIRCUIT BOARD */}
          <div className="rounded-lg border border-white/10 bg-black/40 p-3">
            <svg
              viewBox="0 0 520 250"
              className="h-auto w-full"
              role="img"
              aria-label={`5-pin IC circuit board for ${inspectedCommand.command}`}
            >
              <defs>
                <linearGradient id="pinGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
                  <stop offset="50%" stopColor="#10b981" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.15" />
                </linearGradient>
              </defs>

              {/* IC BODY */}
              <rect x="150" y="55" width="220" height="140" rx="10" fill="#0b1120" stroke="#334155" strokeWidth="2" />
              <text x="260" y="92" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="monospace">
                SOVEREIGN IC
              </text>
              <text x="260" y="112" textAnchor="middle" fill="#e2e8f0" fontSize="16" fontFamily="monospace" fontWeight="bold">
                #{inspectedCommand.id}
              </text>
              <text x="260" y="132" textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="monospace">
                {inspectedCommand.layerId} · {inspectedCommand.departmentId}
              </text>
              <line x1="150" y1="145" x2="370" y2="145" stroke="#1e293b" strokeWidth="1" />
              <text x="260" y="165" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="monospace">
                {inspectedCommand.name.slice(0, 34)}
              </text>
              <text x="260" y="181" textAnchor="middle" fill="#475569" fontSize="8" fontFamily="monospace">
                GATE: {inspectedCommand.gateId}
              </text>

              {/* PIN LEADS + LABELS — 2 left, 2 right, 1 bottom */}
              {[60, 100, 140, 180].map((y) => (
                <line key={`lead-${y}`} x1="150" y1={y} x2="120" y2={y} stroke="#334155" strokeWidth="3" />
              ))}
              {[60, 100, 140, 180].map((y) => (
                <line key={`leadr-${y}`} x1="370" y1={y} x2="400" y2={y} stroke="#334155" strokeWidth="3" />
              ))}
              <line x1="260" y1="195" x2="260" y2="228" stroke="#334155" strokeWidth="3" />

              {/* PIN LEDS */}
              <circle
                cx="100" cy="60" r="7"
                fill={simStep >= 1 ? '#10b981' : '#1e293b'}
                stroke={simStep >= 1 ? '#34d399' : '#334155'} strokeWidth="1.5"
              />
              <circle
                cx="100" cy="100" r="7"
                fill={simStep >= 2 ? '#f59e0b' : '#1e293b'}
                stroke={simStep >= 2 ? '#fbbf24' : '#334155'} strokeWidth="1.5"
              />
              <circle
                cx="100" cy="140" r="7"
                fill={simStep >= 3 ? '#a855f7' : '#1e293b'}
                stroke={simStep >= 3 ? '#c084fc' : '#334155'} strokeWidth="1.5"
              />
              <circle
                cx="420" cy="60" r="7"
                fill={simStep >= 4 ? '#06b6d4' : '#1e293b'}
                stroke={simStep >= 4 ? '#22d3ee' : '#334155'} strokeWidth="1.5"
              />
              <circle
                cx="420" cy="100" r="7"
                fill={simStep >= 5 ? '#f43f5e' : '#1e293b'}
                stroke={simStep >= 5 ? '#fb7185' : '#334155'} strokeWidth="1.5"
              />

              {/* PIN TEXT LABELS */}
              <text x="18" y="46" fill="#64748b" fontSize="8" fontFamily="monospace">PIN 1 · CLI INPUT</text>
              <text x="18" y="60" fill="#e2e8f0" fontSize="8" fontFamily="monospace">{inspectedCommand.command.slice(0, 20)}</text>
              <text x="18" y="86" fill="#64748b" fontSize="8" fontFamily="monospace">PIN 2 · OWNER AGENT</text>
              <text x="18" y="100" fill="#e2e8f0" fontSize="8" fontFamily="monospace">{inspectedCommand.ownerAgent.slice(0, 20)}</text>
              <text x="18" y="126" fill="#64748b" fontSize="8" fontFamily="monospace">PIN 3 · DEPARTMENT</text>
              <text x="18" y="140" fill="#e2e8f0" fontSize="8" fontFamily="monospace">{inspectedCommand.layerId} · {inspectedCommand.departmentId.slice(0, 14)}</text>
              <text x="376" y="46" fill="#64748b" fontSize="8" fontFamily="monospace">PIN 4 · SOP CHAIN</text>
              <text x="376" y="60" fill="#e2e8f0" fontSize="8" fontFamily="monospace">{inspectedCommand.sopChain.length} steps</text>
              <text x="376" y="86" fill="#64748b" fontSize="8" fontFamily="monospace">PIN 5 · SHA-256 GATE</text>
              <text x="376" y="100" fill="#e2e8f0" fontSize="8" fontFamily="monospace">VERIFIED</text>

              {/* PIN 4 SOP LED CHAIN */}
              {inspectedCommand.sopChain.slice(0, 4).map((step, idx) => (
                <g key={step}>
                  <circle
                    cx="400"
                    cy={140 + idx * 14}
                    r="4"
                    fill={simStep >= 4 ? '#22d3ee' : '#1e293b'}
                    stroke={simStep >= 4 ? '#a5f3fc' : '#334155'}
                    strokeWidth="1"
                  />
                  <text x="410" y={144 + idx * 14} fill="#94a3b8" fontSize="7.5" fontFamily="monospace">
                    {idx + 1}. {sopShortLabel(step).slice(0, 18)}
                  </text>
                </g>
              ))}

              {/* PULSE PATH — sequential animated signal across PIN 1 → PIN 5 */}
              <path
                d="M 100 60 L 150 60 M 100 100 L 150 100 M 100 140 L 150 140 M 370 60 L 420 60 M 370 100 L 420 100 M 260 195 L 260 228"
                fill="none"
                stroke="url(#pinGrad)"
                strokeWidth="2.5"
                strokeLinecap="round"
                opacity={simStep >= 1 ? 0.9 : 0.15}
                style={{ transition: 'opacity 300ms ease' }}
              />
              {simStep >= 1 && simStep <= 5 && (
                <circle cx={pulseX(simStep)} cy={pulseY(simStep)} r="5" fill="#34d399">
                  <animate attributeName="r" values="3.5;6;3.5" dur="0.65s" repeatCount="indefinite" />
                </circle>
              )}

              {/* GATE ARTIFACT BOOTSTRAP */}
              <text x="260" y="242" textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="monospace">
                PIN 5 → {inspectedCommand.gateArtifact}
              </text>
            </svg>

            <div className="mt-2 grid grid-cols-5 gap-1">
              {PIN_LABELS.map((label, idx) => (
                <div
                  key={label}
                  className={`rounded border px-1 py-1 text-center font-mono text-[8px] leading-tight transition ${
                    simStep === idx + 1
                      ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300'
                      : 'border-white/10 bg-white/5 text-white/40'
                  }`}
                >
                  {label.split(' · ')[0]}
                  <br />
                  <span className="text-white/25">{label.split(' · ')[1]}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 font-mono text-[9px] text-white/30">
              {simStep === 0
                ? 'Nhấn ▶ Run Simulation để chạy xung tín hiệu PIN 1 → PIN 5.'
                : `Đang chạy bước ${simStep}/5 · ${PIN_LABELS[simStep - 1]}`}
            </p>
          </div>

          {/* COMPACT 10 DEPARTMENTS × 4 CLUSTERS RADAR MATRIX */}
          <div className="rounded-lg border border-white/10 bg-black/40 p-3">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
                10 Phòng ban × 4 Khối Radar
              </h3>
              <span className="font-mono text-[9px] text-white/30">click ô = lọc + thanh tra</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[440px] border-collapse text-left">
                <thead>
                  <tr>
                    <th className="border-b border-white/10 px-1 pb-1 font-mono text-[8px] text-white/30">DEPT</th>
                    {BUSINESS_CLUSTERS.map((cluster) => (
                      <th
                        key={cluster.id}
                        className={`border-b border-white/10 px-1 pb-1 text-center font-mono text-[8px] ${cluster.badgeColor}`}
                      >
                        {CLUSTER_BADGE_LETTER[cluster.id]}
                      </th>
                    ))}
                    <th className="border-b border-white/10 px-1 pb-1 text-right font-mono text-[8px] text-white/30">Σ</th>
                  </tr>
                </thead>
                <tbody>
                  {DEPARTMENTS.map((dept) => {
                    let rowTotal = 0;
                    const isDeptActive = selectedDept === dept.id;
                    return (
                      <tr key={dept.id} className={isDeptActive ? 'bg-emerald-500/10' : ''}>
                        <td className="border-b border-white/5 px-1 py-1">
                          <button
                            type="button"
                            onClick={() => handleSelectDepartmentRow(dept.id)}
                            className={`font-mono text-[8px] transition hover:text-white ${
                              isDeptActive ? 'text-emerald-300' : 'text-white/50'
                            }`}
                          >
                            [{dept.layerId}] {dept.name.slice(0, 18)}
                          </button>
                        </td>
                        {BUSINESS_CLUSTERS.map((cluster) => {
                          const items = matrix[dept.id][cluster.id];
                          rowTotal += items.length;
                          const isActive =
                            selectedDept === dept.id && selectedCluster === cluster.id;
                          const isInspected =
                            inspectedCommand.departmentId === dept.id && inspectedCommand.cluster === cluster.id;
                          return (
                            <td key={cluster.id} className="border-b border-white/5 px-0.5 py-1 text-center">
                              <button
                                type="button"
                                onClick={() => handleSelectMatrixCell(dept.id, cluster.id)}
                                aria-label={`${dept.name} · ${cluster.shortLabel}`}
                                className={`h-6 w-full rounded border font-mono text-[8px] transition ${
                                  isActive
                                    ? 'border-emerald-500/60 bg-emerald-500/30 text-emerald-200'
                                    : isInspected
                                      ? 'border-cyan-400/60 bg-cyan-500/25 text-cyan-200'
                                      : items.length > 0
                                        ? 'border-white/10 bg-white/5 text-white/60 hover:border-white/25'
                                        : 'border-white/5 bg-transparent text-white/15'
                                }`}
                              >
                                {items.length > 0 ? items.length : '·'}
                              </button>
                            </td>
                          );
                        })}
                        <td className="border-b border-white/5 px-1 py-1 text-right font-mono text-[8px] text-white/40">
                          {rowTotal}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="px-1 pt-1 font-mono text-[8px] text-white/30">Σ {CLI_FULL_REGISTRY.length}</td>
                    {BUSINESS_CLUSTERS.map((cluster) => (
                      <td key={cluster.id} className="px-1 pt-1 text-center font-mono text-[8px] text-white/30">
                        {clusterTotals[cluster.id]}
                      </td>
                    ))}
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </section>

        {/* ============ RIGHT INSPECTOR (4 cols) ============ */}
        <section
          aria-label="Command Inspector"
          className="flex scroll-mt-4 flex-col rounded-xl border border-white/10 bg-[#0a0d14] lg:col-span-4"
        >
          {/* TAB BAR */}
          <div role="tablist" aria-label="Inspector tabs" className="flex border-b border-white/10">
            {INSPECTOR_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`inspector-panel-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 border-b-2 px-2 py-2.5 font-mono text-[11px] font-semibold transition ${
                  activeTab === tab.id
                    ? 'border-emerald-400 text-emerald-300'
                    : 'border-transparent text-white/40 hover:text-white/70'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="max-h-[720px] overflow-y-auto p-3">
            {/* ---------- OVERVIEW TAB ---------- */}
            {activeTab === 'overview' && (
              <div id="inspector-panel-overview" role="tabpanel" className="space-y-2">
                <StageCard step={1} title="CLI Syntax" tone="cyan">
                  <div className="flex items-center justify-between gap-2">
                    <code className="break-all font-mono text-[11px] text-cyan-300">
                      $ {inspectedCommand.command}
                    </code>
                    <button
                      type="button"
                      onClick={() => handleCopy(inspectedCommand.command, 'inspector-cmd')}
                      className="shrink-0 rounded border border-white/15 px-1.5 py-0.5 font-mono text-[9px] text-white/50 hover:text-white"
                    >
                      {copiedId === 'inspector-cmd' ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                  {inspectedCommand.aliases.length > 0 && (
                    <p className="mt-1 font-mono text-[9px] text-white/40">
                      aliases: {inspectedCommand.aliases.map((a) => `mekong ${a}`).join(', ')}
                    </p>
                  )}
                </StageCard>

                <StageCard step={2} title="Owner & Support Agents" tone="amber">
                  <p className="font-mono text-[11px] text-amber-300">🤖 {inspectedCommand.ownerAgent}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {inspectedCommand.supportAgents.map((agent) => (
                      <span
                        key={agent}
                        className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[9px] text-white/60"
                      >
                        {agent}
                      </span>
                    ))}
                  </div>
                </StageCard>

                <StageCard step={3} title="Department & Layer" tone="purple">
                  <p className="font-mono text-[11px] text-purple-300">🏢 {activeDepartmentMeta.vnName}</p>
                  <p className="mt-0.5 font-mono text-[9px] text-white/40">
                    Layer {inspectedCommand.layerId} · {activeLayerMeta.vnTitle}
                  </p>
                  <p className="mt-1 text-[10px] leading-relaxed text-white/55">{activeDepartmentMeta.mission}</p>
                </StageCard>

                <StageCard step={4} title="SOP Chain" tone="emerald">
                  <ol className="space-y-1">
                    {inspectedCommand.sopChain.map((step, idx) => (
                      <li key={step} className="flex items-start gap-2 font-mono text-[10px] text-white/60">
                        <span className="shrink-0 rounded bg-emerald-500/20 px-1 font-mono text-[9px] text-emerald-300">
                          Bước {idx + 1}
                        </span>
                        <span className="min-w-0 break-all">
                          {step} — {sopShortLabel(step)}
                        </span>
                      </li>
                    ))}
                  </ol>
                </StageCard>

                <StageCard step={5} title="SHA-256 Evidence Gate" tone="rose">
                  <p className="break-all font-mono text-[10px] text-rose-300">🔒 {inspectedCommand.gateArtifact}</p>
                  <p className="mt-1 font-mono text-[9px] text-emerald-400">✓ SHA-256 VERIFIED · {inspectedCommand.gateId}</p>
                  <p className="mt-1 text-[10px] leading-relaxed text-white/50">{inspectedCommand.deliverable}</p>
                </StageCard>
              </div>
            )}

            {/* ---------- PINOUT TAB ---------- */}
            {activeTab === 'pinout' && (
              <div id="inspector-panel-pinout" role="tabpanel" className="space-y-2">
                <p className="font-mono text-[10px] text-white/40">
                  5 chân của IC #{inspectedCommand.id} — mỗi chân là một mắt xích bắt buộc của hợp đồng điều phối.
                </p>
                <PinoutRow step={1} simStep={simStep} label="CLI Input" tone="cyan">
                  <code className="break-all font-mono text-[11px] text-cyan-300">{inspectedCommand.command}</code>
                  {inspectedCommand.aliases.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {inspectedCommand.aliases.map((al) => (
                        <span
                          key={al}
                          className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[9px] text-white/60"
                        >
                          alias: {al}
                        </span>
                      ))}
                    </div>
                  )}
                </PinoutRow>

                <PinoutRow step={2} simStep={simStep} label="Owner & Support Agents" tone="amber">
                  <p className="font-mono text-[11px] text-amber-300">{inspectedCommand.ownerAgent}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {inspectedCommand.supportAgents.map((agent) => (
                      <span
                        key={agent}
                        className="rounded border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[9px] text-amber-200/80"
                      >
                        {agent}
                      </span>
                    ))}
                  </div>
                </PinoutRow>

                <PinoutRow step={3} simStep={simStep} label="L0–L5 Department" tone="purple">
                  <p className="font-mono text-[11px] text-purple-300">{activeDepartmentMeta.vnName}</p>
                  <p className="mt-0.5 font-mono text-[9px] text-white/40">
                    {inspectedCommand.layerId} · {activeLayerMeta.name}
                  </p>
                  <p className="mt-0.5 font-mono text-[9px] text-white/35">{activeLayerMeta.gateId}</p>
                </PinoutRow>

                <PinoutRow step={4} simStep={simStep} label="4-Step SOP LED Chain" tone="cyan">
                  <div className="flex flex-wrap items-center gap-1">
                    {inspectedCommand.sopChain.map((step, idx) => (
                      <span key={step} className="flex items-center gap-1">
                        <span className="rounded border border-cyan-500/30 bg-cyan-500/15 px-1.5 py-0.5 font-mono text-[9px] text-cyan-200">
                          {idx + 1}. {sopShortLabel(step)}
                        </span>
                        {idx < inspectedCommand.sopChain.length - 1 && (
                          <span className="font-mono text-[9px] text-white/25">➜</span>
                        )}
                      </span>
                    ))}
                  </div>
                </PinoutRow>

                <PinoutRow step={5} simStep={simStep} label="SHA-256 Gate Artifact" tone="rose">
                  <p className="break-all font-mono text-[10px] text-rose-300">{inspectedCommand.gateArtifact}</p>
                  <p className="mt-1 font-mono text-[9px] text-white/40">
                    Gate ID: {inspectedContract?.gate_id || inspectedCommand.gateId}
                  </p>
                </PinoutRow>
              </div>
            )}

            {/* ---------- SIMULATOR TAB ---------- */}
            {activeTab === 'simulator' && (
              <div id="inspector-panel-simulator" role="tabpanel" className="space-y-3">
                <div className="overflow-hidden rounded-lg border border-white/10 bg-black">
                  {/* TERMINAL CHROME */}
                  <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-2 py-1.5">
                    <div className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-rose-500/70" />
                      <span className="h-2 w-2 rounded-full bg-amber-500/70" />
                      <span className="h-2 w-2 rounded-full bg-emerald-500/70" />
                      <span className="ml-2 font-mono text-[9px] text-white/40">
                        mekong-cli — {inspectedCommand.departmentId} ({inspectedCommand.layerId})
                      </span>
                    </div>
                    <span className="flex items-center gap-1 font-mono text-[9px] text-emerald-400">
                      <span className={`h-1.5 w-1.5 rounded-full ${isExecuting ? 'bg-amber-400' : liveRunResult ? 'bg-emerald-400' : 'bg-white/20'}`} />
                      ● {isExecuting ? 'EXECUTING' : liveRunResult ? 'RUN SEALED' : 'IDLE'}
                    </span>
                  </div>

                  {/* TERMINAL BODY */}
                  <div className="space-y-1.5 p-2.5 font-mono text-[10px] leading-relaxed">
                    <p className="text-white/50">
                      founder@mekong-opc:~/company${' '}
                      <span className="text-white">{inspectedCommand.command} --verbose</span>
                    </p>
                    <p className="text-white/40">
                      Maturity: <span className="text-white/70">● {inspectedMaturityMeta.label}</span> —{' '}
                      {inspectedMaturityMeta.description}
                    </p>

                    <TraceLine visible={simStep >= 1 || simStep === 0} tone="cyan">
                      [1/4] Routing `{inspectedCommand.name}` ➔ Owner Agent `{inspectedCommand.ownerAgent}` (
                      {inspectedCommand.departmentId})
                    </TraceLine>
                    <TraceLine visible={simStep >= 2 || simStep === 0} tone="emerald">
                      [2/4] SOP Chain: {inspectedCommand.sopChain.join(' ➔ ')}
                    </TraceLine>
                    <TraceLine visible={simStep >= 3 || simStep === 0} tone="white">
                      [3/4] Contract: {inspectedContract?.gate_id || inspectedCommand.gateId}
                    </TraceLine>
                    <TraceLine visible={simStep >= 4 || simStep === 5} tone="rose">
                      [4/4] Gate Artifact: {inspectedCommand.gateArtifact}
                    </TraceLine>

                    {liveRunError && (
                      <p className="rounded border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-rose-300">
                        ✗ {liveRunError}
                      </p>
                    )}

                    {liveRunResult && (
                      <div className="space-y-2">
                        <TraceLine visible tone="emerald">
                          ✓ Run {liveRunResult.run_id} sealed · {liveRunResult.status}
                        </TraceLine>

                        <pre className="overflow-x-auto rounded border border-white/10 bg-black/60 p-2 font-mono text-[9px] leading-relaxed text-emerald-300/90">
                          {JSON.stringify(liveRunResult.output, null, 2)}
                        </pre>

                        <div className="rounded border border-white/10 bg-white/[0.03] p-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-[9px] uppercase text-cyan-300">
                              HMAC Receipt
                            </span>
                            <button
                              type="button"
                              onClick={() => handleVerifyReceipt(liveRunResult.receipt)}
                              className="rounded border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 font-mono text-[9px] text-cyan-200 hover:bg-cyan-500/20"
                            >
                              Xin Chứng Thực (Verify)
                            </button>
                          </div>
                          <dl className="mt-1 space-y-0.5 font-mono text-[9px]">
                            <div className="flex gap-2">
                              <dt className="shrink-0 text-white/40">signature</dt>
                              <dd className="break-all text-cyan-200">
                                {liveRunResult.receipt.signature}
                              </dd>
                            </div>
                            <div className="flex gap-2">
                              <dt className="shrink-0 text-white/40">input_sha256</dt>
                              <dd className="break-all text-white/60">
                                {liveRunResult.receipt.input_sha256}
                              </dd>
                            </div>
                            <div className="flex gap-2">
                              <dt className="shrink-0 text-white/40">output_sha256</dt>
                              <dd className="break-all text-white/60">
                                {liveRunResult.receipt.output_sha256}
                              </dd>
                            </div>
                          </dl>
                          {receiptVerified && (
                            <p
                              className={`mt-1 font-mono text-[9px] ${receiptVerified.valid ? 'text-emerald-300' : 'text-rose-300'}`}
                            >
                              {receiptVerified.valid ? '✓' : '✗'}{' '}
                              {receiptVerified.valid ? 'Receipt hợp lệ' : 'Receipt không hợp lệ'} (
                              {receiptVerified.source})
                            </p>
                          )}
                        </div>

                        {liveRunResult.receipt.statutory_citations?.length > 0 && (
                          <div className="rounded border border-amber-500/20 bg-amber-500/[0.06] p-2">
                            <p className="font-mono text-[9px] uppercase text-amber-300">
                              Trích dẫn pháp lý (Statutory Citations)
                            </p>
                            <ul className="mt-1 space-y-0.5 font-mono text-[9px] text-amber-200/80">
                              {liveRunResult.receipt.statutory_citations.map((citation) => (
                                <li key={citation}>• {citation}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="rounded border border-white/10 bg-white/[0.03] p-2">
                          <p className="font-mono text-[9px] uppercase text-purple-300">
                            Đối soát Cổng Cột Mốc (Milestone Gate)
                          </p>
                          {companyGates.length > 0 ? (
                            <ul className="mt-1 space-y-1">
                              {companyGates.map((gate) => (
                                <li
                                  key={gate.gate_id}
                                  className="flex items-center justify-between gap-2 font-mono text-[9px]"
                                >
                                  <span className="text-white/60">
                                    {gate.gate_id} · {gate.status}
                                  </span>
                                  <button
                                    type="button"
                                    disabled={isReconcilingGate}
                                    onClick={() =>
                                      handleReconcileMilestoneGate(inspectedCommand.layerId, liveRunResult.run_id)
                                    }
                                    className="rounded border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 text-purple-200 hover:bg-purple-500/20 disabled:opacity-40"
                                  >
                                    Đối soát
                                  </button>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="mt-1 font-mono text-[9px] text-white/30">
                              Chưa có cổng cột mốc nào được nạp.
                            </p>
                          )}
                          {reconcileNotice && (
                            <p className="mt-1 font-mono text-[9px] text-emerald-300">{reconcileNotice}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {!liveRunResult && !liveRunError && (
                      <pre className="mt-2 overflow-x-auto rounded border border-white/10 bg-black/60 p-2 font-mono text-[9px] leading-relaxed text-emerald-300/90">
                        {`{
  "command": "${inspectedCommand.command}",
  "department": "${inspectedCommand.departmentId}",
  "layer": "${inspectedCommand.layerId}",
  "owner_agent": "${inspectedCommand.ownerAgent}",
  "gate_id": "${inspectedContract?.gate_id || inspectedCommand.gateId}",
  "maturity_tier": "${inspectedMaturityMeta.tier}",
  "gate_artifact": "${inspectedCommand.gateArtifact}",
  "status": "AWAITING_REAL_EXECUTION"
}`}
                      </pre>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isExecuting}
                  onClick={() => handleRunLiveCommand(inspectedCommand)}
                  className="w-full rounded-lg border border-emerald-500/40 bg-emerald-500/20 py-2 font-mono text-[11px] font-semibold text-emerald-300 transition hover:bg-emerald-500/30 disabled:opacity-40"
                >
                  {isExecuting ? '⏳ Đang chạy lệnh thật…' : '▶ Chạy Lệnh Thật (POST /api/cli/runs)'}
                </button>
                <button
                  type="button"
                  onClick={runSimulation}
                  className="w-full rounded-lg border border-white/15 bg-white/5 py-2 font-mono text-[11px] font-semibold text-white/70 transition hover:bg-white/10"
                >
                  {simStep > 0 ? '↻ Chạy lại xung 5 chân' : '▶ Run Simulation (xung trực quan)'}
                </button>
              </div>
            )}

            {/* ---------- SPECS TAB ---------- */}
            {activeTab === 'specs' && (
              <div id="inspector-panel-specs" role="tabpanel" className="space-y-2">
                <SpecRow label="Command ID" value={`#${inspectedCommand.id}`} />
                <SpecRow label="Command" value={inspectedCommand.command} mono />
                <SpecRow label="Name (VN/EN)" value={inspectedCommand.name} />
                <SpecRow label="Cluster" value={activeClusterMeta.label} />
                <SpecRow label="Department" value={inspectedCommand.departmentName} />
                <SpecRow label="Department ID" value={inspectedCommand.departmentId} mono />
                <SpecRow label="Layer" value={`${inspectedCommand.layerId} · ${activeLayerMeta.vnTitle}`} />
                <SpecRow label="Revenue Stage" value={activeLayerMeta.revenueStage} />
                <SpecRow label="Owner Agent" value={inspectedCommand.ownerAgent} mono />
                <SpecRow
                  label="Support Agents"
                  value={inspectedCommand.supportAgents.length > 0 ? inspectedCommand.supportAgents.join(', ') : '—'}
                  mono
                />
                <SpecRow
                  label="SOP Chain"
                  value={inspectedCommand.sopChain.map((s, i) => `${i + 1}. ${s}`).join(' → ')}
                  mono
                />
                <SpecRow label="Gate ID" value={inspectedCommand.gateId} mono />
                <SpecRow label="Gate Artifact" value={inspectedCommand.gateArtifact} mono />
                <SpecRow label="Deliverable" value={inspectedCommand.deliverable} />
                <SpecRow label="Sample Output" value={inspectedCommand.sampleOutput} mono />
                <SpecRow
                  label="Registry Depth"
                  value={`${filteredCommands.length} / ${CLI_FULL_REGISTRY.length} lệnh sau lọc`}
                />

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        JSON.stringify(
                          {
                            id: inspectedCommand.id,
                            command: inspectedCommand.command,
                            department: inspectedCommand.departmentId,
                            layer: inspectedCommand.layerId,
                            owner_agent: inspectedCommand.ownerAgent,
                            sop_chain: inspectedCommand.sopChain,
                            gate_artifact: inspectedCommand.gateArtifact,
                          },
                          null,
                          2
                        ),
                        'specs-json'
                      )
                    }
                    className="w-full rounded-lg border border-cyan-500/30 bg-cyan-500/10 py-2 font-mono text-[10px] text-cyan-300 transition hover:bg-cyan-500/20"
                  >
                    {copiedId === 'specs-json' ? '✓ Copied JSON' : 'Copy JSON Full Contract'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="mt-auto border-t border-white/10 px-3 py-3">
            <Link
              href="/templates"
              className="block rounded-lg border border-white/15 bg-white/5 py-2 text-center font-mono text-[10px] text-white/60 transition hover:text-white"
            >
              Xem các gói OPC Packs tích hợp →
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

const STAGE_TONE: Record<string, string> = {
  cyan: 'border-cyan-500/25 bg-cyan-500/[0.07]',
  amber: 'border-amber-500/25 bg-amber-500/[0.07]',
  purple: 'border-purple-500/25 bg-purple-500/[0.07]',
  emerald: 'border-emerald-500/25 bg-emerald-500/[0.07]',
  rose: 'border-rose-500/25 bg-rose-500/[0.07]',
};

function stageToneClass(tone: string): string {
  return STAGE_TONE[tone] || 'border-white/10 bg-white/5';
}

function StageCard({
  step,
  title,
  tone,
  children,
}: {
  step: number;
  title: string;
  tone: string;
  children: ReactNode;
}) {
  return (
    <div className={`rounded-lg border p-2.5 ${stageToneClass(tone)}`}>
      <div className="mb-1.5 flex items-center gap-1.5">
        <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[9px] text-white/60">Bước {step}</span>
        <h3 className="font-mono text-[10px] font-semibold uppercase tracking-wider text-white/70">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function PinoutRow({
  step,
  label,
  tone,
  simStep,
  children,
}: {
  step: number;
  label: string;
  tone: string;
  simStep: number;
  children: ReactNode;
}) {
  const pinActive = simStep === step;
  return (
    <div className={`rounded-lg border p-2.5 transition ${pinActive ? 'border-emerald-500/50 bg-emerald-500/10' : stageToneClass(tone)}`}>
      <div className="mb-1.5 flex items-center gap-1.5">
        <span
          className={`h-2 w-2 rounded-full ${pinActive ? 'bg-emerald-400' : 'bg-white/20'}`}
          aria-hidden="true"
        />
        <span className="font-mono text-[9px] font-bold text-white/60">PIN {step}</span>
        <span className="font-mono text-[10px] text-white/70">{label}</span>
      </div>
      {children}
    </div>
  );
}

const TRACE_TONE: Record<string, string> = {
  cyan: 'text-cyan-300',
  emerald: 'text-emerald-300',
  white: 'text-white/70',
  rose: 'text-rose-300',
};

function TraceLine({
  visible,
  tone,
  children,
}: {
  visible: boolean;
  tone: string;
  children: ReactNode;
}) {
  if (!visible) {
    return null;
  }
  return (
    <p className={`flex gap-1.5 ${TRACE_TONE[tone] || 'text-white/70'}`}>
      <span className="shrink-0 text-white/25">›</span>
      <span className="min-w-0 break-all">{children}</span>
    </p>
  );
}

function SpecRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  const isIdField = label === 'Command' || label === 'Department ID' || label === 'Owner Agent' || label === 'Gate ID' || label === 'Gate Artifact';
  return (
    <div className="rounded border border-white/10 bg-black/40 p-2">
      <p className="font-mono text-[9px] uppercase tracking-wider text-white/30">{label}</p>
      <p
        className={`mt-0.5 break-all text-[10px] leading-relaxed text-white/75 ${
          mono || isIdField ? 'font-mono text-emerald-300/90' : ''
        }`}
      >
        {value}
      </p>
    </div>
  );
}
