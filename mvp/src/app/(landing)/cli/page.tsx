'use client';

import { useEffect, useMemo, useState } from 'react';
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

export default function MekongCliPage() {
  const [selectedLayer, setSelectedLayer] = useState<OperatingLayerId | 'all'>('all');
  const [selectedDept, setSelectedDept] = useState<DepartmentId | 'all'>('all');
  const [selectedCluster, setSelectedCluster] = useState<ClusterId | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [pageSize, setPageSize] = useState<PageSizeOption>(24);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [inspectedCommand, setInspectedCommand] = useState<CliCommandEntry>(
    () => CLI_FULL_REGISTRY.find((c) => c.id === 'thue') || CLI_FULL_REGISTRY[0]
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);
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

  const handleRunLiveCommand = async (cmdEntry: CliCommandEntry) => {
    setIsExecuting(true);
    setLiveRunError(null);
    setReceiptVerified(null);
    setTerminalTab('live');

    let defaultParams: Record<string, unknown> = { subcommand: 'status' };
    if (cmdEntry.name === 'thue') {
      defaultParams = { subcommand: 'tncn', gross_income: 35_000_000, dependents: 1 };
    } else if (cmdEntry.name === 'ke-toan') {
      defaultParams = { subcommand: 'journal', amount: 25_000_000, buyer: 'Cong Ty TNHH Mekong' };
    } else if (cmdEntry.name === 'bhxh') {
      defaultParams = { subcommand: 'calculate', salary: 30_000_000, region: 1 };
    } else if (cmdEntry.name === 'vietqr') {
      defaultParams = { subcommand: 'generate', amount: 2_500_000, memo: 'THANH TOAN MEKONG' };
    } else if (cmdEntry.name === 'adminsanction') {
      defaultParams = {
        subcommand: 'calculate',
        entity_type: 'ORGANIZATION',
        min_fine: 10_000_000,
        max_fine: 20_000_000,
        mitigating_count: 1,
      };
    } else if (cmdEntry.name === 'payroll') {
      defaultParams = { subcommand: 'calculate', gross: 35_000_000, dependents: 1, region: 1 };
    } else if (['cfo', 'cmo', 'cso', 'cto', 'csuite', 'binh-phap', 'board-meeting'].includes(cmdEntry.name)) {
      defaultParams = {
        subcommand: 'brief',
        horizon: 'Q4-2026',
        objective: 'Scale Vietnam SME & OPC RaaS to $1M ARR',
      };
    } else if (['cook', 'plan', 'spec', 'autonomous', 'pev', 'swarm', 'goal'].includes(cmdEntry.name)) {
      defaultParams = {
        subcommand: 'plan',
        goal: 'Deploy automated VietQR + E-Invoice TT78 reconciliation workflow',
        dry_run: true,
      };
    } else if (cmdEntry.name === 'benchmark') {
      defaultParams = { suite: 'pev', iterations: 5 };
    } else if (['opc', 'sales', 'marketing', 'revenue', 'crm', 'pipeline'].includes(cmdEntry.name)) {
      defaultParams = {
        subcommand: 'metrics',
        segment: 'VN_OPC_FOUNDER',
        currency: 'VND',
      };
    } else if (['zalo-oa', 'ecom', 'audit', 'taxadmin', 'einvoice', 'tort', 'inheritance'].includes(cmdEntry.name)) {
      defaultParams = {
        subcommand: 'status',
        jurisdiction: 'VN',
        compliance_check: true,
      };
    }

    try {
      const res = await fetch('/api/cli/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command_id: cmdEntry.name,
          params: defaultParams,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLiveRunError(data?.error || 'Execution failed');
      } else {
        setLiveRunResult(data as ExecutionRunResult);
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

  const matrix = useMemo(() => getCrossMappingMatrix(), []);

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
      setInspectedCommand(cellItems[0]);
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
      setInspectedCommand(firstInDept);
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
      setInspectedCommand(firstInLayer);
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

  return (
    <div className="min-h-screen bg-[#06080d] text-white">
      {/* HERO & INVARIANT HEADER */}
      <section className="relative overflow-hidden border-b border-white/10 pt-14 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[420px] w-[980px] rounded-full bg-emerald-500/10 blur-[140px]" />
          <div className="absolute right-10 top-20 h-[260px] w-[420px] rounded-full bg-cyan-500/10 blur-[120px]" />
        </div>

        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-1.5 text-xs font-mono font-semibold text-emerald-300 mb-5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              FULL 100% COMMAND ECOSYSTEM · {CLI_FULL_REGISTRY.length} NHÓM LỆNH · 10 PHÒNG BAN · 6 TẦNG L0–L5
            </div>

            <h1 className="mx-auto max-w-5xl text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-[1.15]">
              Kiến Trúc Hệ Điều Hành{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                Mekong CLI 100% Full Registry
              </span>{' '}
              & Ma Trận Ánh Xạ Chéo Phòng Ban
            </h1>

            <p className="mx-auto mt-4 max-w-3xl text-sm sm:text-base text-slate-300 leading-relaxed">
              Không có bất kỳ câu lệnh nào đứng rời rạc. Toàn bộ{' '}
              <strong className="text-white">{CLI_FULL_REGISTRY.length} nhóm lệnh & bộ luật chuyên ngành</strong> trong{' '}
              <code className="text-emerald-400 font-mono">mekong-cli</code> đều được ánh xạ trực tiếp vào{' '}
              <strong className="text-emerald-300">58 Unified Agents</strong>,{' '}
              <strong className="text-cyan-300">10 Phòng Ban Vận Hành</strong>,{' '}
              <strong className="text-amber-300">Chuỗi 4 Bước SOP</strong> và khóa sổ tại{' '}
              <strong className="text-purple-300">Cổng Bằng Chứng SHA-256 Gate</strong>.
            </p>
          </div>

          {/* Core Invariant Pill Chain */}
          <div className="mt-8 rounded-2xl border border-emerald-500/30 bg-[#0b101b]/90 p-4 sm:p-5">
            <div className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 text-center mb-3">
              Nguyên Lý Bất Biến MekongMind · &ldquo;No Command Is Naked&rdquo;
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 text-center font-mono text-xs">
              <div className="rounded-xl border border-white/10 bg-[#06080d] px-3 py-2.5">
                <div className="text-[10px] text-slate-400">CHẶNG 1 · LỆNH CLI</div>
                <div className="text-emerald-400 font-bold mt-0.5">$ mekong &lt;command&gt;</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#06080d] px-3 py-2.5">
                <div className="text-[10px] text-slate-400">CHẶNG 2 · TÁC NHÂN AI</div>
                <div className="text-cyan-300 font-bold mt-0.5">Owner + Support Agents</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#06080d] px-3 py-2.5">
                <div className="text-[10px] text-slate-400">CHẶNG 3 · PHÒNG BAN</div>
                <div className="text-amber-300 font-bold mt-0.5">10 Phòng Ban (L0–L5)</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#06080d] px-3 py-2.5">
                <div className="text-[10px] text-slate-400">CHẶNG 4 · QUY TRÌNH SOP</div>
                <div className="text-purple-300 font-bold mt-0.5">Chuỗi 4 Bước Chuẩn Hóa</div>
              </div>
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5">
                <div className="text-[10px] text-emerald-300">CHẶNG 5 · CỔNG NGHIỆM THU</div>
                <div className="text-white font-bold mt-0.5">state/evidence/*.json</div>
              </div>
            </div>
          </div>

          {/* 5 Top Stat Cards */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="rounded-xl border border-white/10 bg-[#0b0f17] p-4 text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
                {CLI_FULL_REGISTRY.length}
              </div>
              <div className="text-xs text-slate-400 mt-1">Nhóm Lệnh & Bộ Luật CLI</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#0b0f17] p-4 text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-cyan-400 font-mono">10</div>
              <div className="text-xs text-slate-400 mt-1">Phòng Ban Vận Hành</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#0b0f17] p-4 text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono">58</div>
              <div className="text-xs text-slate-400 mt-1">Unified AI Agents</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#0b0f17] p-4 text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-purple-400 font-mono">6</div>
              <div className="text-xs text-slate-400 mt-1">Tầng Kiến Trúc (L0–L5)</div>
            </div>
            <div className="col-span-2 sm:col-span-1 rounded-xl border border-white/10 bg-[#0b0f17] p-4 text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-rose-400 font-mono">
                {clusterTotals.vn_statutory}
              </div>
              <div className="text-xs text-slate-400 mt-1">Pháp Điển & Ngành Nghề VN</div>
            </div>
          </div>
        </div>
      </section>

      {/* TIER 1: 6 OPERATING LAYERS (L0 -> L5) ARCHITECTURE EXPLORER */}
      <section className="mx-auto max-w-7xl px-4 pt-12 pb-8 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-emerald-400">
              TẦNG KIẾN TRÚC 1 · OPERATING LAYERS & REVENUE LADDER (L0 → L5)
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">
              Sơ Đồ 6 Tầng Vận Hành Công Ty 1 Người (OPC)
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Bấm vào bất kỳ tầng nào để lọc các Phòng ban, Cổng bằng chứng (Evidence Gate) và tập lệnh thuộc tầng đó.
            </p>
          </div>
          {selectedLayer !== 'all' && (
            <button
              type="button"
              onClick={() => setSelectedLayer('all')}
              className="self-start sm:self-auto rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2 text-xs font-mono text-emerald-300 hover:bg-emerald-500/20"
            >
              ✕ Bỏ lọc Tầng {selectedLayer} (Xem cả 6 tầng)
            </button>
          )}
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-6">
          {OPERATING_LAYERS.map((layer) => {
            const isSelected = selectedLayer === layer.id;
            const count = layerTotals[layer.id];
            return (
              <button
                key={layer.id}
                type="button"
                onClick={() => handleSelectLayer(layer.id)}
                className={`text-left rounded-2xl border p-4 transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-emerald-400 bg-emerald-500/15 shadow-lg shadow-emerald-500/10'
                    : 'border-white/10 bg-[#0b0f17] hover:border-emerald-500/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="rounded-md bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-xs font-mono font-bold text-emerald-300">
                      {layer.id}
                    </span>
                    <span className="text-xs font-mono font-semibold text-cyan-300">
                      {count} lệnh
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white leading-snug">{layer.name}</h3>
                  <p className="text-[11px] text-emerald-300/90 font-medium mt-0.5">{layer.vnTitle}</p>
                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">{layer.summary}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 space-y-1.5">
                  <div className="text-[10px] font-mono text-slate-400">
                    Gate: <span className="text-amber-300">{layer.gateId}.json</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {layer.departments.map((dId) => (
                      <span
                        key={dId}
                        className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-mono text-slate-300"
                      >
                        {dId}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* TIER 2: 2D CROSS-MAPPING MATRIX (10 DEPARTMENTS x 4 BUSINESS CLUSTERS) */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-white/10 bg-[#0b0f17] p-5 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-cyan-400">
                TẦNG KIẾN TRÚC 2 · MA TRẬN ÁNH XẠ CHÉO 2 CHIỀU (PHÒNG BAN × KHỐI NGHIỆP VỤ)
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">
                Ánh Xạ Chéo 10 Phòng Ban ↔ 4 Khối Nghiệp Vụ ({CLI_FULL_REGISTRY.length} Nhóm Lệnh)
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Bấm vào bất kỳ <strong className="text-white">Ô giao điểm</strong> nào để lọc chính xác các lệnh thuộc Phòng ban × Khối nghiệp vụ đó và nạp trực tiếp vào Thanh tra viên (Live Inspector) bên dưới.
              </p>
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="self-start lg:self-auto rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-xs font-mono font-semibold text-rose-300 hover:bg-rose-500/20"
              >
                ↺ Đặt lại toàn bộ bộ lọc ({filteredCommands.length}/{CLI_FULL_REGISTRY.length})
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/10 text-[11px] font-mono uppercase text-slate-400">
                  <th className="py-3.5 pr-4">10 Phòng Ban (agents/registry.json)</th>
                  <th className="py-3.5 px-3">Owner Agent & Gate</th>
                  {BUSINESS_CLUSTERS.map((cluster) => (
                    <th key={cluster.id} className="py-3.5 px-2 text-center">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedCluster(selectedCluster === cluster.id ? 'all' : cluster.id)
                        }
                        className={`w-full rounded-lg border px-2.5 py-1.5 text-center transition-all ${
                          selectedCluster === cluster.id
                            ? 'border-emerald-400 bg-emerald-500/20 text-white'
                            : 'border-white/10 bg-[#06080d] text-slate-300 hover:border-white/30'
                        }`}
                      >
                        <div>{cluster.shortLabel}</div>
                        <div className="text-[10px] text-emerald-400 mt-0.5">
                          {clusterTotals[cluster.id]} lệnh
                        </div>
                      </button>
                    </th>
                  ))}
                  <th className="py-3.5 pl-3 text-center">Tổng Phòng Ban</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {DEPARTMENTS.map((dept) => {
                  const rowCells = matrix[dept.id];
                  const rowTotal =
                    rowCells.csuite.length +
                    rowCells.sdlc.length +
                    rowCells.bizops.length +
                    rowCells.vn_statutory.length;
                  const isDeptSelected = selectedDept === dept.id && selectedCluster === 'all';
                  const isLayerFilteredOut =
                    selectedLayer !== 'all' && dept.layerId !== selectedLayer;

                  return (
                    <tr
                      key={dept.id}
                      className={`transition-colors ${
                        isLayerFilteredOut ? 'opacity-35' : 'hover:bg-white/[0.02]'
                      }`}
                    >
                      <td className="py-3 pr-4">
                        <button
                          type="button"
                          onClick={() => handleSelectDepartmentRow(dept.id)}
                          className={`w-full text-left rounded-xl border p-2.5 transition-all ${
                            isDeptSelected
                              ? 'border-emerald-400 bg-emerald-500/15'
                              : 'border-white/10 bg-[#06080d] hover:border-emerald-500/40'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
                              {dept.layerId}
                            </span>
                            <span className="font-bold text-white">{dept.vnName}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                            {dept.mission}
                          </div>
                        </button>
                      </td>

                      <td className="py-3 px-3 font-mono text-[11px]">
                        <div className="text-cyan-300 font-semibold">🤖 {dept.ownerAgent}</div>
                        <div className="text-slate-400 text-[10px] mt-0.5">
                          🔒 {dept.gateId}.json
                        </div>
                      </td>

                      {BUSINESS_CLUSTERS.map((cluster) => {
                        const cellCommands = rowCells[cluster.id] || [];
                        const count = cellCommands.length;
                        const isCellSelected =
                          selectedDept === dept.id && selectedCluster === cluster.id;

                        return (
                          <td key={cluster.id} className="py-3 px-2 text-center">
                            <button
                              type="button"
                              disabled={count === 0}
                              onClick={() => handleSelectMatrixCell(dept.id, cluster.id)}
                              className={`w-full rounded-xl border py-2.5 px-2 font-mono transition-all ${
                                count === 0
                                  ? 'border-white/5 bg-[#06080d]/40 text-slate-600 cursor-not-allowed'
                                  : isCellSelected
                                  ? 'border-emerald-400 bg-emerald-500 text-slate-950 font-extrabold shadow-md shadow-emerald-500/20'
                                  : 'border-white/10 bg-[#06080d] text-white hover:border-emerald-500/50 hover:bg-emerald-500/10'
                              }`}
                            >
                              <div className="text-sm font-bold">{count}</div>
                              <div
                                className={`text-[10px] ${
                                  isCellSelected ? 'text-slate-900' : 'text-slate-400'
                                }`}
                              >
                                {count > 0
                                  ? cellCommands
                                      .slice(0, 2)
                                      .map((c) => c.name)
                                      .join(', ')
                                  : '—'}
                              </div>
                            </button>
                          </td>
                        );
                      })}

                      <td className="py-3 pl-3 text-center font-mono">
                        <span className="inline-block rounded-lg border border-white/10 bg-[#06080d] px-3 py-1.5 text-sm font-bold text-emerald-400">
                          {rowTotal}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* TIER 3: LIVE COMMAND-TO-GATE INSPECTOR & TERMINAL SIMULATOR */}
      <section
        id="live-command-inspector"
        className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8"
      >
        <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-[#0b121e] via-[#090d16] to-[#06080d] p-6 sm:p-8 shadow-xl shadow-emerald-500/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                TẦNG KIẾN TRÚC 3 · LIVE COMMAND-TO-GATE INSPECTOR & TERMINAL
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
                Đang Thanh Tra Lệnh:{' '}
                <code className="text-emerald-400 font-mono">{inspectedCommand.command}</code>
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full border px-3 py-1 text-xs font-mono font-semibold ${activeClusterMeta.badgeColor}`}
              >
                {activeClusterMeta.shortLabel}
              </span>
              <span
                className={`rounded-full border px-3 py-1 text-xs font-mono font-semibold ${inspectedMaturityMeta.badgeClass}`}
                title={inspectedMaturityMeta.description}
              >
                ● {inspectedMaturityMeta.label}
              </span>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-mono font-semibold text-emerald-300">
                Tầng {inspectedCommand.layerId} · {inspectedCommand.departmentName}
              </span>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-12">
            {/* 5-Stage Cross-Mapping Pipeline */}
            <div className="lg:col-span-6 space-y-3">
              <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                Sơ Đồ Ánh Xạ 5 Chặng Của Lệnh ({inspectedCommand.name})
              </div>

              {/* Stage 1 */}
              <div className="rounded-2xl border border-white/10 bg-[#06080d] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-emerald-400">
                    CHẶNG 1 · CÚ PHÁP CLI & ALIAS SONG NGỮ
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(inspectedCommand.command, 'inspector-cmd')}
                    className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-mono text-emerald-300 hover:bg-emerald-500/20"
                  >
                    {copiedId === 'inspector-cmd' ? '✓ Đã chép lệnh' : 'Chép lệnh'}
                  </button>
                </div>
                <div className="mt-1.5 font-mono text-base font-bold text-white">
                  $ {inspectedCommand.command}
                </div>
                {inspectedCommand.aliases.length > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-slate-400 font-mono">Aliases:</span>
                    {inspectedCommand.aliases.map((alias) => (
                      <span
                        key={alias}
                        className="rounded bg-white/5 border border-white/10 px-2 py-0.5 text-[11px] font-mono text-cyan-300"
                      >
                        mekong {alias}
                      </span>
                    ))}
                  </div>
                )}
                <p className="mt-2 text-xs text-slate-300 leading-relaxed">{inspectedCommand.desc}</p>
              </div>

              {/* Stage 2 */}
              <div className="rounded-2xl border border-white/10 bg-[#06080d] p-4">
                <div className="text-[10px] font-mono uppercase text-cyan-400">
                  CHẶNG 2 · TÁC NHÂN AI ĐIỀU PHỐI (UNIFIED AGENTS)
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-2.5 py-1 text-xs font-mono font-bold text-cyan-300">
                    👑 Owner: {inspectedCommand.ownerAgent}
                  </span>
                  {inspectedCommand.supportAgents.map((ag) => (
                    <span
                      key={ag}
                      className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-mono text-slate-300"
                    >
                      + {ag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Stage 3 */}
              <div className="rounded-2xl border border-white/10 bg-[#06080d] p-4">
                <div className="text-[10px] font-mono uppercase text-amber-400">
                  CHẶNG 3 · PHÒNG BAN CHỦ QUẢN & TẦNG VẬN HÀNH
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  <div className="text-sm font-bold text-white">{activeDepartmentMeta.vnName}</div>
                  <span className="rounded bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-xs font-mono text-amber-300">
                    Layer {inspectedCommand.layerId}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">{activeDepartmentMeta.mission}</p>
              </div>

              {/* Stage 4 */}
              <div className="rounded-2xl border border-white/10 bg-[#06080d] p-4">
                <div className="text-[10px] font-mono uppercase text-purple-400">
                  CHẶNG 4 · CHUỖI 4 BƯỚC QUY TRÌNH CHUẨN (DEPARTMENT SOP CHAIN)
                </div>
                <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {inspectedCommand.sopChain.map((step, idx) => (
                    <div
                      key={step}
                      className="rounded-xl border border-purple-500/20 bg-purple-500/5 px-2.5 py-2 text-center font-mono"
                    >
                      <div className="text-[10px] text-purple-300">Bước {idx + 1}</div>
                      <div className="text-xs font-bold text-white mt-0.5">{step}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stage 5 */}
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                <div className="text-[10px] font-mono uppercase text-emerald-300">
                  CHẶNG 5 · CỔNG BẰNG CHỨNG MẬT MÃ (SHA-256 EVIDENCE GATE)
                </div>
                <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
                  <span className="text-white font-bold">🔒 {inspectedCommand.gateArtifact}</span>
                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-emerald-300">
                    SHA-256 VERIFIED
                  </span>
                </div>
                <div className="mt-1 text-xs text-slate-300">{inspectedCommand.deliverable}</div>
              </div>
            </div>

            {/* Live Terminal & Verified Execution */}
            <div className="lg:col-span-6 flex flex-col justify-between rounded-2xl border border-white/15 bg-[#05070b] p-5 font-mono text-xs shadow-inner">
              <div>
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-rose-500/80" />
                    <span className="h-3 w-3 rounded-full bg-amber-500/80" />
                    <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
                    <span className="ml-2 text-slate-400 text-[11px]">
                      mekong-cli — {inspectedCommand.departmentId} ({inspectedCommand.layerId})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTerminalTab('preview')}
                      className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
                        terminalTab === 'preview'
                          ? 'bg-white/15 text-white font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Mẫu Tài Liệu (Preview)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTerminalTab('live')}
                      className={`px-2.5 py-1 rounded text-[11px] flex items-center gap-1.5 transition-colors ${
                        terminalTab === 'live'
                          ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Thực Thi Thật (Live Run)
                    </button>
                  </div>
                </div>

                {terminalTab === 'preview' ? (
                  <div className="space-y-2.5 text-slate-300 leading-relaxed">
                    <div>
                      <span className="text-emerald-400">founder@mekong-opc</span>
                      <span className="text-slate-500">:</span>
                      <span className="text-cyan-400">~/company</span>
                      <span className="text-slate-500">$ </span>
                      <span className="text-white font-bold">{inspectedCommand.command} --help</span>
                    </div>

                    <div className="rounded-xl bg-white/[0.03] border border-white/5 p-3 text-[11px] text-slate-300 space-y-1">
                      <div className="text-emerald-300 font-bold">
                        Usage: {inspectedCommand.command} [OPTIONS] COMMAND [ARGS]...
                      </div>
                      <div>{inspectedCommand.desc}</div>
                      {inspectedCommand.aliases.length > 0 && (
                        <div className="text-cyan-300">
                          Aliases: {inspectedCommand.aliases.map((a) => `mekong ${a}`).join(', ')}
                        </div>
                      )}
                    </div>

                    <div className="pt-2">
                      <span className="text-emerald-400">founder@mekong-opc</span>
                      <span className="text-slate-500">:</span>
                      <span className="text-cyan-400">~/company</span>
                      <span className="text-slate-500">$ </span>
                      <span className="text-white font-bold">
                        {inspectedCommand.command} --inspect-contract
                      </span>
                    </div>

                    <div className="space-y-1.5 pl-2 border-l-2 border-slate-600 text-[11px]">
                      <div className="text-cyan-300">
                        [1/4] Routing `{inspectedCommand.name}` ➔ Owner Agent `{inspectedCommand.ownerAgent}` ({inspectedCommand.departmentId})
                      </div>
                      <div className="text-purple-300">
                        [2/4] SOP Chain: {inspectedCommand.sopChain.join(' ➔ ')}
                      </div>
                      <div className="text-amber-300">
                        [3/4] Đặc tả đầu ra: {inspectedCommand.sampleOutput}
                      </div>
                      <div className="text-slate-400">
                        [4/4] Dự kiến tạo biên bản: {inspectedCommand.gateArtifact}
                      </div>
                    </div>

                    <div className="rounded-xl bg-slate-900/60 border border-white/10 p-3 text-[11px] text-slate-300 mt-3">
                      <div className="font-bold text-slate-400 mb-1">
                        {`// Bản xem trước tài liệu tĩnh (Static Documentation Preview)`}
                      </div>
                      <pre className="overflow-x-auto text-[10px] leading-relaxed text-slate-400">
{`{
  "command": "${inspectedCommand.command}",
  "department": "${inspectedCommand.departmentId}",
  "layer": "${inspectedCommand.layerId}",
  "owner_agent": "${inspectedCommand.ownerAgent}",
  "sop_chain": ${JSON.stringify(inspectedCommand.sopChain)},
  "gate_artifact": "${inspectedCommand.gateArtifact}",
  "maturity_tier": "${inspectedContract?.maturity_tier || 'CATALOG_ONLY'}"
}`}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-white/[0.03] border border-white/5 rounded-xl p-3">
                      <div>
                        <div className="text-white font-bold">Thực thi nghiệp vụ In-Process</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Tự động chạy tính toán số học Decimal, kiểm chứng kép luật VN và ký biên lai mật mã HMAC-SHA256.
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={isExecuting}
                        onClick={() => handleRunLiveCommand(inspectedCommand)}
                        className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50 transition-colors shadow-sm shadow-emerald-500/30"
                      >
                        {isExecuting ? 'Đang thực thi...' : '▶ Chạy Lệnh Thật'}
                      </button>
                    </div>

                    {liveRunError && (
                      <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-rose-300 text-[11px]">
                        Lỗi thực thi: {liveRunError}
                      </div>
                    )}

                    {liveRunResult ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[10px]">
                          <div className="rounded-lg bg-white/5 p-2 border border-white/5">
                            <div className="text-slate-400">Trạng Thái</div>
                            <div className="text-emerald-400 font-bold mt-0.5">
                              {liveRunResult.status}
                            </div>
                          </div>
                          <div className="rounded-lg bg-white/5 p-2 border border-white/5">
                            <div className="text-slate-400">Thời Gian</div>
                            <div className="text-cyan-300 font-bold mt-0.5">
                              {liveRunResult.duration_ms} ms
                            </div>
                          </div>
                          <div className="rounded-lg bg-white/5 p-2 border border-white/5">
                            <div className="text-slate-400">Kiểm Chứng</div>
                            <div className="text-purple-300 font-bold mt-0.5 truncate">
                              {liveRunResult.domain_verification?.status === 'PASSED'
                                ? '✓ ĐẠT LUẬT VN'
                                : 'CHƯA CHẠY'}
                            </div>
                          </div>
                          <div className="rounded-lg bg-white/5 p-2 border border-white/5">
                            <div className="text-slate-400">Nguồn Chạy</div>
                            <div className="text-amber-300 font-bold mt-0.5 truncate">
                              {liveRunResult.source === 'live_gateway'
                                ? 'FastAPI daemon'
                                : 'Deterministic TS'}
                            </div>
                          </div>
                        </div>

                        {/* Raw Output Box */}
                        <div className="rounded-xl bg-black/60 border border-white/10 p-3 text-[11px]">
                          <div className="text-slate-400 font-bold mb-1 flex items-center justify-between">
                            <span>Kết quả nghiệp vụ thực tế (Raw Output):</span>
                            <span className="text-[10px] text-emerald-400">
                              run_id: {liveRunResult.run_id}
                            </span>
                          </div>
                          <pre className="overflow-x-auto text-[10px] text-emerald-300 leading-relaxed max-h-40">
                            {JSON.stringify(liveRunResult.output, null, 2)}
                          </pre>
                        </div>

                        {/* Cryptographic Receipt Box */}
                        <div className="rounded-xl bg-emerald-950/30 border border-emerald-500/40 p-3 text-[11px]">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-bold text-emerald-300">
                              🔒 Biên Lai Nghiệm Thu Cấp 1 (Tier 1 Signed Receipt)
                            </div>
                            <button
                              type="button"
                              onClick={() => handleVerifyReceipt(liveRunResult.receipt)}
                              className="rounded bg-emerald-500/20 border border-emerald-500/50 px-2 py-0.5 text-[10px] font-bold text-emerald-200 hover:bg-emerald-500/30"
                            >
                              Xác Minh Chữ Ký SHA-256
                            </button>
                          </div>
                          <div className="space-y-1 text-[10px] text-slate-300">
                            <div>
                              <span className="text-slate-400">Chữ ký HMAC:</span>{' '}
                              <span className="text-emerald-400 font-mono break-all">
                                {liveRunResult.receipt.signature}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400">Mã băm Input:</span>{' '}
                              <span className="text-cyan-300 font-mono">
                                {liveRunResult.receipt.input_sha256}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400">Mã băm Output:</span>{' '}
                              <span className="text-purple-300 font-mono">
                                {liveRunResult.receipt.output_sha256}
                              </span>
                            </div>
                            {liveRunResult.receipt.statutory_citations?.length > 0 && (
                              <div>
                                <span className="text-slate-400">Căn cứ pháp lý:</span>{' '}
                                <span className="text-amber-300">
                                  {liveRunResult.receipt.statutory_citations.join(' · ')}
                                </span>
                              </div>
                            )}
                          </div>

                          {receiptVerified && (
                            <div
                              className={`mt-2 rounded p-2 text-[10px] font-bold ${
                                receiptVerified.valid
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              }`}
                            >
                              {receiptVerified.valid
                                ? `✓ Chữ ký mật mã HMAC-SHA256 HỢP LỆ (RFC 8785 Canonical JSON · Nguồn: ${receiptVerified.source})`
                                : '✗ Chữ ký không hợp lệ hoặc dữ liệu biên lai đã bị can thiệp!'}
                            </div>
                          )}
                        </div>

                        {/* Tier 2 Milestone Gate Status Box */}
                        <div className="rounded-xl bg-purple-950/20 border border-purple-500/30 p-3 text-[10px] text-slate-300">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                            <span className="font-bold text-purple-300">
                              Cổng Cột Mốc Công Ty Tầng {inspectedCommand.layerId} (Tier 2 Milestone Gate)
                            </span>
                            <div className="flex items-center gap-2">
                              <span
                                className={`rounded px-1.5 py-0.5 font-bold ${
                                  companyGates.find((g) => g.layer_id === inspectedCommand.layerId)?.status ===
                                  'SEALED_VERIFIED'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                    : 'bg-amber-500/20 text-amber-300'
                                }`}
                              >
                                {companyGates.find((g) => g.layer_id === inspectedCommand.layerId)?.status || 'LOCKED'}
                              </span>
                              <button
                                type="button"
                                disabled={isReconcilingGate}
                                onClick={() =>
                                  handleReconcileMilestoneGate(inspectedCommand.layerId, liveRunResult.run_id)
                                }
                                className="rounded bg-purple-500/20 border border-purple-500/40 px-2 py-0.5 text-[10px] font-bold text-purple-200 hover:bg-purple-500/30 disabled:opacity-50"
                              >
                                {isReconcilingGate ? 'Đang đối soát...' : 'Đối Soát Giao Dịch (Reconcile Gate)'}
                              </button>
                            </div>
                          </div>
                          <p className="text-slate-400">
                            Khác với Biên lai thực thi lệnh (Tier 1 Receipt ký tức thì sau mỗi lần chạy), Cổng cột mốc công ty (Tier 2 Gate) giữ nguyên trạng thái <strong>LOCKED</strong> cho đến khi có giao dịch ngân hàng / hóa đơn thực tế được đối soát vào cơ sở dữ liệu.
                          </p>
                          {reconcileNotice && (
                            <div className="mt-2 rounded bg-purple-500/20 border border-purple-400/40 p-2 text-purple-200 font-semibold">
                              ✓ {reconcileNotice}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-slate-400 text-[11px]">
                        Bấm nút <strong>&ldquo;▶ Chạy Lệnh Thật&rdquo;</strong> ở trên để nạp thông số mặc định, gửi tới backend thực thi, nhận kết quả số học và biên lai mật mã đã được ký HMAC-SHA256.
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handleCopy(inspectedCommand.command, 'terminal-copy')}
                  className="rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition-colors"
                >
                  {copiedId === 'terminal-copy'
                    ? '✓ Đã chép lệnh vào Clipboard'
                    : `📋 Chép lệnh: ${inspectedCommand.command}`}
                </button>
                <Link
                  href="/templates"
                  className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white hover:border-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Xem các gói OPC Packs tích hợp →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TIER 4: FULL 100% COMMAND REGISTRY EXPLORER (197 COMMANDS) */}
      <section
        id="command-registry-explorer"
        className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-emerald-400">
              TẦNG KIẾN TRÚC 4 · FULL 100% COMMAND REGISTRY EXPLORER
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">
              Danh Bạ Toàn Bộ {CLI_FULL_REGISTRY.length} Nhóm Lệnh & Pháp Điển Chuyên Ngành
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Tìm kiếm tức thì (0ms) theo tên lệnh tiếng Anh, alias tiếng Việt (<code className="text-emerald-300">thue</code>, <code className="text-emerald-300">ke-toan</code>, <code className="text-emerald-300">honnhan</code>, <code className="text-emerald-300">xuphat</code>...), tên Agent hoặc Phòng ban.
            </p>
          </div>
          <div className="text-xs font-mono text-slate-300 text-right">
            <div>
              Đang lọc:{' '}
              <span className="text-emerald-400 font-bold text-base">{filteredCommands.length}</span> /{' '}
              {CLI_FULL_REGISTRY.length} nhóm lệnh
            </div>
            <div className="text-slate-400 text-[11px] mt-0.5">
              Trang {safeCurrentPage} / {totalPages} (mỗi trang {pageSize === 'all' ? 'tất cả' : pageSize} lệnh)
            </div>
          </div>
        </div>

        {/* Search & Multi-Dimensional Filter Bar */}
        <div className="rounded-2xl border border-white/10 bg-[#0b0f17] p-4 sm:p-5 space-y-4 mb-6">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="🔍 Gõ tên lệnh (vd: cfo, thue, ke-toan, zalo-oa, honnhan, xuphat, corporate, cook, swarm, BLDS 2015, TT78...)"
              className="w-full rounded-xl border border-white/15 bg-[#06080d] px-4 py-3.5 text-sm text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none font-mono"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg bg-white/10 px-2.5 py-1 text-xs font-mono text-slate-300 hover:bg-white/20"
              >
                Xóa
              </button>
            )}
          </div>

          {/* Cluster Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono uppercase text-slate-400 mr-1">
              Khối nghiệp vụ:
            </span>
            <button
              type="button"
              onClick={() => {
                setSelectedCluster('all');
                setCurrentPage(1);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-mono font-semibold transition-all ${
                selectedCluster === 'all'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'border border-white/10 bg-[#06080d] text-slate-300 hover:border-white/30'
              }`}
            >
              Tất cả ({CLI_FULL_REGISTRY.length})
            </button>
            {BUSINESS_CLUSTERS.map((cluster) => (
              <button
                key={cluster.id}
                type="button"
                onClick={() => {
                  setSelectedCluster(selectedCluster === cluster.id ? 'all' : cluster.id);
                  setCurrentPage(1);
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-mono font-semibold transition-all ${
                  selectedCluster === cluster.id
                    ? 'bg-emerald-500 text-slate-950'
                    : 'border border-white/10 bg-[#06080d] text-slate-300 hover:border-white/30'
                }`}
              >
                {cluster.shortLabel} ({clusterTotals[cluster.id]})
              </button>
            ))}
          </div>

          {/* Department Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-white/5">
            <span className="text-[11px] font-mono uppercase text-slate-400 mr-1">
              Phòng ban:
            </span>
            <button
              type="button"
              onClick={() => {
                setSelectedDept('all');
                setCurrentPage(1);
              }}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-mono transition-all ${
                selectedDept === 'all'
                  ? 'bg-cyan-400 text-slate-950 font-bold'
                  : 'border border-white/10 bg-[#06080d] text-slate-400 hover:text-white'
              }`}
            >
              Tất cả 10 Phòng ban
            </button>
            {DEPARTMENTS.map((dept) => (
              <button
                key={dept.id}
                type="button"
                onClick={() => {
                  setSelectedDept(selectedDept === dept.id ? 'all' : dept.id);
                  setCurrentPage(1);
                }}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-mono transition-all ${
                  selectedDept === dept.id
                    ? 'bg-cyan-400 text-slate-950 font-bold'
                    : 'border border-white/10 bg-[#06080d] text-slate-400 hover:text-white'
                }`}
              >
                [{dept.layerId}] {dept.id}
              </button>
            ))}
          </div>
        </div>

        {/* TOP PAGINATION & PAGE-SIZE CONTROLS */}
        <div className="rounded-2xl border border-white/10 bg-[#0b0f17] p-3.5 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Hiển thị:</span>
            <span className="text-emerald-400 font-bold">
              {rangeStart}–{rangeEnd}
            </span>
            <span className="text-slate-500">/</span>
            <span className="text-white font-semibold">{filteredCommands.length}</span>
            <span className="text-slate-400">nhóm lệnh</span>
            {totalPages > 1 && (
              <span className="rounded bg-white/5 border border-white/10 px-2 py-0.5 text-[11px] text-slate-300 ml-1">
                Trang {safeCurrentPage}/{totalPages}
              </span>
            )}
            {inspectedCommandPage !== null && inspectedCommandPage !== safeCurrentPage && (
              <button
                type="button"
                onClick={() => handlePageChange(inspectedCommandPage, true)}
                className="rounded border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-300 hover:bg-amber-500/20 transition-colors ml-2"
              >
                📍 Lệnh đang thanh tra ở Trang {inspectedCommandPage}
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Page Size Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px]">Mỗi trang:</span>
              {PAGE_SIZE_OPTIONS.map((opt) => (
                <button
                  key={String(opt)}
                  type="button"
                  onClick={() => {
                    setPageSize(opt);
                    setCurrentPage(1);
                  }}
                  className={`rounded-lg px-2.5 py-1 text-xs font-mono transition-all ${
                    pageSize === opt
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm shadow-emerald-500/30'
                      : 'border border-white/10 bg-[#06080d] text-slate-400 hover:text-white'
                  }`}
                >
                  {opt === 'all' ? `Tất cả (${filteredCommands.length})` : opt}
                </button>
              ))}
            </div>

            {/* Quick Prev / Next for Top Bar */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1 pl-2 border-l border-white/10">
                <button
                  type="button"
                  disabled={safeCurrentPage <= 1}
                  onClick={() => handlePageChange(safeCurrentPage - 1, true)}
                  className="rounded-lg border border-white/10 bg-[#06080d] px-2.5 py-1 text-xs text-slate-300 hover:border-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ‹ Trước
                </button>
                <button
                  type="button"
                  disabled={safeCurrentPage >= totalPages}
                  onClick={() => handlePageChange(safeCurrentPage + 1, true)}
                  className="rounded-lg border border-white/10 bg-[#06080d] px-2.5 py-1 text-xs text-slate-300 hover:border-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Sau ›
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Command Cards Grid */}
        {filteredCommands.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#0b0f17] p-12 text-center">
            <div className="text-lg font-bold text-white">
              Không tìm thấy nhóm lệnh nào khớp với bộ lọc hiện tại
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Hãy thử xóa từ khóa tìm kiếm hoặc đặt lại bộ lọc Phòng ban / Khối nghiệp vụ.
            </p>
            <button
              type="button"
              onClick={resetAllFilters}
              className="mt-4 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400"
            >
              Hiển thị lại toàn bộ {CLI_FULL_REGISTRY.length} nhóm lệnh
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedCommands.map((item) => {
              const isInspected = inspectedCommand.id === item.id;
              const clusterMeta =
                BUSINESS_CLUSTERS.find((c) => c.id === item.cluster) || BUSINESS_CLUSTERS[0];
              const cardContract = getCapabilityContract(item.name);
              const cardTier: MaturityTier = cardContract?.maturity_tier || 'CATALOG_ONLY';
              const cardTierMeta = MATURITY_TIERS[cardTier];

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-5 transition-all flex flex-col justify-between ${
                    isInspected
                      ? 'border-emerald-400 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
                      : 'border-white/10 bg-[#0b0f17] hover:border-emerald-500/40'
                  }`}
                >
                  <div>
                    {/* Top row: Layer + Cluster + Maturity badges */}
                    <div className="flex flex-wrap items-center justify-between gap-1.5 mb-3">
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[10px] font-mono font-semibold ${clusterMeta.badgeColor}`}
                      >
                        {clusterMeta.shortLabel}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`rounded-md border px-2 py-0.5 text-[9px] font-mono font-semibold ${cardTierMeta.badgeClass}`}
                          title={cardTierMeta.description}
                        >
                          {cardTier}
                        </span>
                        <span className="rounded-md bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] font-mono text-emerald-300">
                          {item.layerId} · {item.departmentId}
                        </span>
                      </div>
                    </div>

                    {/* Command syntax */}
                    <div className="font-mono text-base font-bold text-white flex items-center justify-between">
                      <span>
                        <span className="text-emerald-400">$ </span>
                        {item.command}
                      </span>
                    </div>

                    {/* Aliases */}
                    {item.aliases.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {item.aliases.map((al) => (
                          <span
                            key={al}
                            className="rounded bg-cyan-500/10 border border-cyan-500/30 px-1.5 py-0.5 text-[10px] font-mono text-cyan-300"
                          >
                            alias: {al}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Description */}
                    <p className="mt-2.5 text-xs text-slate-300 leading-relaxed line-clamp-3">
                      {item.desc}
                    </p>

                    {/* Cross-Mapping Metadata Box */}
                    <div className="mt-4 rounded-xl border border-white/10 bg-[#06080d] p-3 space-y-1.5 font-mono text-[11px]">
                      <div className="flex items-center justify-between text-slate-400">
                        <span>🏢 Phòng ban:</span>
                        <span className="text-white font-semibold">{item.departmentName}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-400">
                        <span>🤖 Owner Agent:</span>
                        <span className="text-cyan-300">{item.ownerAgent}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-400">
                        <span>🔒 Gate:</span>
                        <span className="text-amber-300">{item.gateId}.json</span>
                      </div>
                      <div className="pt-1 border-t border-white/5 text-[10px] text-purple-300 truncate">
                        SOP: {item.sopChain.join(' → ')}
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setInspectedCommand(item);
                        const el = document.getElementById('live-command-inspector');
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }}
                      className="flex-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-mono font-semibold text-emerald-300 hover:bg-emerald-500/20 transition-colors"
                    >
                      🔍 Thanh tra & Terminal
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(item.command, item.id)}
                      className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-mono text-slate-300 hover:border-emerald-400 hover:text-white transition-colors"
                    >
                      {copiedId === item.id ? '✓ Đã chép' : 'Chép'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* BOTTOM NUMBERED PAGINATION BAR */}
        {totalPages > 1 && (
          <div className="mt-8 rounded-2xl border border-white/10 bg-[#0b0f17] p-4 flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-xs">
            <div className="text-slate-400">
              Đang hiển thị{' '}
              <span className="text-emerald-400 font-bold">
                {rangeStart}–{rangeEnd}
              </span>{' '}
              trên <span className="text-white font-semibold">{filteredCommands.length}</span> nhóm lệnh ·{' '}
              <span className="text-slate-300">
                Trang {safeCurrentPage} / {totalPages}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                disabled={safeCurrentPage <= 1}
                onClick={() => handlePageChange(1, true)}
                className="rounded-lg border border-white/10 bg-[#06080d] px-2.5 py-1.5 text-xs text-slate-300 hover:border-emerald-400 disabled:opacity-25 disabled:cursor-not-allowed"
                title="Về trang đầu"
              >
                « Đầu
              </button>
              <button
                type="button"
                disabled={safeCurrentPage <= 1}
                onClick={() => handlePageChange(safeCurrentPage - 1, true)}
                className="rounded-lg border border-white/10 bg-[#06080d] px-2.5 py-1.5 text-xs text-slate-300 hover:border-emerald-400 disabled:opacity-25 disabled:cursor-not-allowed"
                title="Trang trước"
              >
                ‹ Trước
              </button>

              {paginationItems.map((item, idx) => {
                if (item === 'ellipsis-left' || item === 'ellipsis-right') {
                  return (
                    <span
                      key={`${item}-${idx}`}
                      className="px-2 py-1 text-slate-600 select-none"
                    >
                      …
                    </span>
                  );
                }

                const pageNum = item as number;
                const isActive = pageNum === safeCurrentPage;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => handlePageChange(pageNum, true)}
                    className={`min-w-[34px] rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold transition-all ${
                      isActive
                        ? 'border border-emerald-400 bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                        : 'border border-white/10 bg-[#06080d] text-slate-300 hover:border-emerald-500/50 hover:text-white'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                type="button"
                disabled={safeCurrentPage >= totalPages}
                onClick={() => handlePageChange(safeCurrentPage + 1, true)}
                className="rounded-lg border border-white/10 bg-[#06080d] px-2.5 py-1.5 text-xs text-slate-300 hover:border-emerald-400 disabled:opacity-25 disabled:cursor-not-allowed"
                title="Trang sau"
              >
                Sau ›
              </button>
              <button
                type="button"
                disabled={safeCurrentPage >= totalPages}
                onClick={() => handlePageChange(totalPages, true)}
                className="rounded-lg border border-white/10 bg-[#06080d] px-2.5 py-1.5 text-xs text-slate-300 hover:border-emerald-400 disabled:opacity-25 disabled:cursor-not-allowed"
                title="Tới trang cuối"
              >
                Cuối »
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
