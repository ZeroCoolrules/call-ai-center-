import React, { useState } from 'react';
import { OperatorTreasuryState, CashDepositRequest, PlayerProfile } from '../types/casino';
import { GAME_CATALOG } from '../data/games';
import { sound } from '../lib/sound';
import confetti from 'canvas-confetti';
import {
  Building2,
  ShieldAlert,
  TrendingUp,
  Coins,
  RefreshCw,
  Download,
  CheckCircle,
  AlertTriangle,
  Sliders,
  DollarSign,
  Receipt,
  UserCheck,
  Check,
  X,
  ArrowDownRight,
  ArrowUpRight,
  Send,
  Lock
} from 'lucide-react';

interface OperatorPortalProps {
  depositRequests?: CashDepositRequest[];
  onApproveDeposit?: (requestId: string) => void;
  onRejectDeposit?: (requestId: string, reason?: string) => void;
  profiles?: PlayerProfile[];
  onManualCageTransfer?: (profileId: string, amount: number, isCredit: boolean, reason: string) => void;
}

export const OperatorPortal: React.FC<OperatorPortalProps> = ({
  depositRequests = [],
  onApproveDeposit,
  onRejectDeposit,
  profiles = [],
  onManualCageTransfer,
}) => {
  const [operatorTab, setOperatorTab] = useState<'treasury' | 'cage' | 'profiles'>('cage');

  const [treasury, setTreasury] = useState<OperatorTreasuryState>({
    reservesDcdn: 1850000,
    reservesUsd: 2627000,
    openLiabilityDcdn: 383817,
    coverRatio: 4.82,
    coverRatioFloor: 3.0,
    handle24h: 1420500,
    hold24hPct: 4.12,
    ngr30dUsd: 412850,
    pendingWithdrawalsCount: 4,
    pendingWithdrawalsAmount: 18200,
    networkBlockLag: 1,
    baseRpcStatus: 'HEALTHY'
  });

  const [selectedVariants, setSelectedVariants] = useState<Record<string, number>>({
    'made-men': 96.0,
    'bootleg-run': 95.5,
    'the-vault': 96.2,
    'numbers-racket': 95.0,
    'neon-nights': 96.5,
    'the-sitdown': 95.0,
    'back-room-blackjack': 99.5,
    'wheel-of-the-don': 97.3,
    'high-roller-baccarat': 98.94
  });

  // Manual Input on Back-Office State
  const [manualProfileId, setManualProfileId] = useState<string>(profiles[0]?.id || '');
  const [manualAmount, setManualAmount] = useState<number>(500);
  const [manualType, setManualType] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [manualReason, setManualReason] = useState<string>('Cash Buy-In at High-Limit Pit Table');

  const [topUpAmount, setTopUpAmount] = useState<number>(50000);
  const [successToast, setSuccessToast] = useState<string>('');

  const pendingRequests = depositRequests.filter(r => r.status === 'PENDING');

  const handleApprove = (req: CashDepositRequest) => {
    sound.playChipClick();
    sound.playWinChime(false);
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10B981', '#EAB308', '#DC2626']
    });

    if (onApproveDeposit) {
      onApproveDeposit(req.id);
    }
    setSuccessToast(`APPROVED & CREDITED: +$${req.amount.toFixed(2)} to ${req.profileUsername} (Slip #${req.slipNumber})`);
    setTimeout(() => setSuccessToast(''), 4500);
  };

  const handleReject = (req: CashDepositRequest) => {
    sound.playChipClick();
    if (onRejectDeposit) {
      onRejectDeposit(req.id, 'Desk inspection mismatch');
    }
    setSuccessToast(`REJECTED: Deposit slip #${req.slipNumber}`);
    setTimeout(() => setSuccessToast(''), 4000);
  };

  const handleManualCageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualProfileId || manualAmount <= 0) return;

    sound.playChipClick();
    sound.playWinChime(manualType === 'CREDIT');

    if (onManualCageTransfer) {
      onManualCageTransfer(
        manualProfileId,
        manualAmount,
        manualType === 'CREDIT',
        manualReason.trim() || 'Manual Cage Desk Transaction'
      );
    }

    const targetProfile = profiles.find(p => p.id === manualProfileId);
    setSuccessToast(
      `COMPLETED TRANSACTION: ${manualType === 'CREDIT' ? 'Credited' : 'Debited'} $${manualAmount.toFixed(2)} for ${targetProfile?.username || 'player'}.`
    );
    setTimeout(() => setSuccessToast(''), 4500);
  };

  const handleTopUpTreasury = () => {
    sound.playChipClick();
    setTreasury(prev => {
      const newDcdn = prev.reservesDcdn + topUpAmount;
      const newUsd = newDcdn * 1.42;
      const newCoverRatio = newDcdn / prev.openLiabilityDcdn;
      return {
        ...prev,
        reservesDcdn: newDcdn,
        reservesUsd: newUsd,
        coverRatio: Number(newCoverRatio.toFixed(2))
      };
    });
    setSuccessToast(`+${topUpAmount.toLocaleString()} DCDN deposited into multisig vault.`);
    setTimeout(() => setSuccessToast(''), 3500);
  };

  const handleExportAuditReport = () => {
    sound.playChipClick();
    const data = {
      timestamp: new Date().toISOString(),
      treasury,
      variants: selectedVariants,
      games: GAME_CATALOG,
      depositRequests,
      profiles
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dcdn-operator-audit-${Date.now()}.json`;
    a.click();
    setSuccessToast('Audit report downloaded successfully.');
    setTimeout(() => setSuccessToast(''), 3500);
  };

  const handleVariantChange = (gameId: string, variant: number) => {
    sound.playChipClick();
    setSelectedVariants(prev => ({
      ...prev,
      [gameId]: variant
    }));
    setSuccessToast(`Updated ${gameId} RTP variant to ${variant}%.`);
    setTimeout(() => setSuccessToast(''), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Portal Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#382F26] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-[#38BDF8]" />
            <h1 className="font-display text-2xl sm:text-3xl uppercase tracking-wide text-[#F5EAD4]">
              OPERATOR B2B & CAGE CASHIER DESK
            </h1>
          </div>
          <p className="text-xs text-[#F5EAD4]/70">
            Real-time multisig treasury monitoring, manual cash input on the back, and player cash deposit approvals.
          </p>
        </div>

        {/* Tab Switcher & Export */}
        <div className="flex items-center gap-2">
          <div className="flex bg-[#1F1914] border border-[#382F26] p-0.5">
            <button
              onClick={() => setOperatorTab('cage')}
              className={`px-3 py-1 text-xs font-bold uppercase transition-colors cursor-pointer flex items-center gap-1.5 ${
                operatorTab === 'cage'
                  ? 'bg-[#DC2626] text-[#F5EAD4] font-black shadow-comic-ink'
                  : 'text-[#F5EAD4]/70 hover:text-[#F5EAD4]'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              Cashier & Cage
              {pendingRequests.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#EAB308] text-[#0F0B08] text-[10px] flex items-center justify-center font-mono-num font-black">
                  {pendingRequests.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setOperatorTab('treasury')}
              className={`px-3 py-1 text-xs font-bold uppercase transition-colors cursor-pointer ${
                operatorTab === 'treasury'
                  ? 'bg-[#DC2626] text-[#F5EAD4] font-black shadow-comic-ink'
                  : 'text-[#F5EAD4]/70 hover:text-[#F5EAD4]'
              }`}
            >
              Treasury & Math
            </button>
            <button
              onClick={() => setOperatorTab('profiles')}
              className={`px-3 py-1 text-xs font-bold uppercase transition-colors cursor-pointer ${
                operatorTab === 'profiles'
                  ? 'bg-[#DC2626] text-[#F5EAD4] font-black shadow-comic-ink'
                  : 'text-[#F5EAD4]/70 hover:text-[#F5EAD4]'
              }`}
            >
              Profiles ({profiles.length})
            </button>
          </div>

          <button
            onClick={handleExportAuditReport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1F1914] hover:bg-[#2A2016] border-2 border-[#382F26] text-xs font-bold uppercase transition-colors cursor-pointer text-[#F5EAD4]"
          >
            <Download className="w-3.5 h-3.5 text-[#EAB308]" />
            Audit
          </button>
        </div>
      </div>

      {successToast && (
        <div className="p-3 bg-emerald-950/90 border-2 border-emerald-500 text-emerald-200 text-xs font-bold flex items-center justify-between shadow-comic-ink animate-fade-in">
          <span>{successToast}</span>
          <CheckCircle className="w-4 h-4 text-emerald-400" />
        </div>
      )}

      {/* TAB 1: CASINO CAGE & CASH TRANSFERS (The user's key requirement) */}
      {operatorTab === 'cage' && (
        <div className="space-y-6">
          
          {/* Section A: Pending Cash Deposit Requests Queue */}
          <div className="bg-[#181310] border-3 border-[#0F0B08] p-5 shadow-comic-red">
            <div className="flex items-center justify-between border-b-2 border-[#382F26] pb-3 mb-4">
              <div>
                <h3 className="font-display text-xl uppercase tracking-wide text-[#F5EAD4] flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-[#EAB308]" />
                  Pending Cash Deposit Slips for Admin Completion
                </h3>
                <p className="text-xs text-[#F5EAD4]/70">
                  Transfers initiated by player profiles waiting for admin sign-off to credit funds into the cash game.
                </p>
              </div>

              <span className="text-xs font-mono-num font-bold px-2 py-0.5 bg-[#0F0B08] text-[#EAB308] border border-[#382F26]">
                {pendingRequests.length} Pending Approval
              </span>
            </div>

            {pendingRequests.length === 0 ? (
              <div className="p-6 bg-[#0F0B08] border border-[#382F26] text-center space-y-1">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto opacity-70" />
                <div className="font-display text-base text-[#F5EAD4] uppercase">
                  All Cash Deposit Slips Processed
                </div>
                <p className="text-xs text-[#F5EAD4]/50">
                  No pending cash transfers. Players can submit deposit slips from their Profile Cashier modal or you can manually input cash below.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map(req => (
                  <div
                    key={req.id}
                    className="bg-[#0F0B08] border-2 border-[#EAB308] p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-comic-mustard"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="font-display text-lg text-[#F5EAD4]">
                          {req.profileUsername}
                        </span>
                        <span className="text-[10px] font-mono-num bg-[#1F1914] px-1.5 py-0.5 border border-[#382F26] text-[#EAB308] font-bold">
                          Slip #{req.slipNumber}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-600">
                          {req.method}
                        </span>
                      </div>

                      <div className="text-xs text-[#F5EAD4]/80 italic">
                        "{req.referenceNote}"
                      </div>

                      <div className="text-[11px] text-[#F5EAD4]/50 font-mono-num">
                        Submitted: {new Date(req.createdAt).toLocaleTimeString()} · Status: PENDING ADMIN REVIEW
                      </div>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                      <div className="text-right">
                        <span className="text-[10px] text-[#F5EAD4]/60 uppercase block">Deposit Amount</span>
                        <span className="font-display text-2xl font-black text-emerald-400 font-mono-num">
                          +${req.amount.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleReject(req)}
                          className="px-3 py-2 bg-[#1F1914] hover:bg-[#2A2016] text-[#F5EAD4] font-display text-xs uppercase border border-[#382F26] hover:border-[#DC2626] transition-colors cursor-pointer flex items-center gap-1"
                          title="Reject deposit slip"
                        >
                          <X className="w-3.5 h-3.5 text-[#DC2626]" />
                          Reject
                        </button>

                        <button
                          onClick={() => handleApprove(req)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-[#0F0B08] font-display text-sm uppercase font-black border-2 border-[#0F0B08] shadow-comic-ink transition-transform active:translate-x-0.5 active:translate-y-0.5 cursor-pointer flex items-center gap-1.5"
                          title="Complete transaction & credit cash balance"
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                          APPROVE & CREDIT CASH
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section B: Manual Input on the Back (Cage Direct Credit / Debit) */}
          <div className="bg-[#181310] border-3 border-[#0F0B08] p-5 shadow-comic-mustard">
            <div className="flex items-center justify-between border-b-2 border-[#382F26] pb-3 mb-4">
              <div>
                <h3 className="font-display text-xl uppercase tracking-wide text-[#F5EAD4] flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  Manual Cash Input on the Back (Admin Cage Transfer)
                </h3>
                <p className="text-xs text-[#F5EAD4]/70">
                  Manually adjust or credit cash directly into any player profile balance for real cash games.
                </p>
              </div>
              <span className="text-[10px] bg-[#DC2626] text-[#F5EAD4] font-bold px-2 py-0.5 uppercase border border-[#0F0B08]">
                ADMIN ACTION
              </span>
            </div>

            <form onSubmit={handleManualCageSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                
                {/* 1. Select Profile */}
                <div>
                  <label className="block text-[#F5EAD4]/80 font-bold uppercase mb-1">
                    Select Target Profile
                  </label>
                  <select
                    value={manualProfileId}
                    onChange={e => setManualProfileId(e.target.value)}
                    className="w-full bg-[#0F0B08] border border-[#382F26] px-3 py-2 text-xs text-[#F5EAD4] font-bold"
                  >
                    {profiles.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.username} (Cash: ${p.cashBalance.toFixed(2)} · Slip #{p.deskSlipCode})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Action Type */}
                <div>
                  <label className="block text-[#F5EAD4]/80 font-bold uppercase mb-1">
                    Transaction Direction
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setManualType('CREDIT')}
                      className={`py-2 text-xs font-bold uppercase border-2 cursor-pointer flex items-center justify-center gap-1 ${
                        manualType === 'CREDIT'
                          ? 'bg-emerald-600 text-[#0F0B08] border-[#0F0B08] font-black shadow-comic-ink'
                          : 'bg-[#0F0B08] text-[#F5EAD4]/70 border-[#382F26]'
                      }`}
                    >
                      <ArrowDownRight className="w-4 h-4" />
                      CREDIT CASH
                    </button>
                    <button
                      type="button"
                      onClick={() => setManualType('DEBIT')}
                      className={`py-2 text-xs font-bold uppercase border-2 cursor-pointer flex items-center justify-center gap-1 ${
                        manualType === 'DEBIT'
                          ? 'bg-[#DC2626] text-[#F5EAD4] border-[#0F0B08] font-black shadow-comic-ink'
                          : 'bg-[#0F0B08] text-[#F5EAD4]/70 border-[#382F26]'
                      }`}
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      DEBIT CASH
                    </button>
                  </div>
                </div>

                {/* 3. Amount */}
                <div>
                  <label className="block text-[#F5EAD4]/80 font-bold uppercase mb-1">
                    Cash Amount ($ USD)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={manualAmount}
                    onChange={e => setManualAmount(Number(e.target.value))}
                    className="w-full bg-[#0F0B08] border border-[#382F26] px-3 py-2 font-mono-num text-sm text-[#F5EAD4] font-bold"
                  />
                  <div className="flex gap-1.5 mt-1">
                    {[100, 500, 1000, 2500].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setManualAmount(val)}
                        className="px-2 py-0.5 bg-[#0F0B08] border border-[#382F26] text-[10px] font-mono-num hover:border-[#EAB308] cursor-pointer"
                      >
                        ${val}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Memo Note */}
              <div className="text-xs">
                <label className="block text-[#F5EAD4]/80 font-bold uppercase mb-1">
                  Cage Slip Memo / Desk Reason
                </label>
                <input
                  type="text"
                  value={manualReason}
                  onChange={e => setManualReason(e.target.value)}
                  placeholder="e.g. VIP Buy-In at Private Baccarat Room, Cash Desk Receipt #889"
                  className="w-full bg-[#0F0B08] border border-[#382F26] px-3 py-2 text-xs text-[#F5EAD4]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#EAB308] hover:bg-[#ca9a07] text-[#0F0B08] font-display text-sm uppercase font-black border-2 border-[#0F0B08] shadow-comic-ink cursor-pointer"
              >
                COMPLETE MANUAL BACK-OFFICE TRANSACTION
              </button>
            </form>
          </div>

          {/* Section C: Complete Transaction Ledger */}
          <div className="bg-[#181310] border-2 border-[#382F26] p-4 space-y-3">
            <h4 className="font-display text-base uppercase text-[#F5EAD4] tracking-wide">
              Recent Completed Cash Deposit Audit History
            </h4>

            <div className="max-h-48 overflow-y-auto space-y-1.5">
              {depositRequests.filter(r => r.status !== 'PENDING').length === 0 ? (
                <div className="text-xs text-[#F5EAD4]/50 italic bg-[#0F0B08] p-3 border border-[#382F26] text-center">
                  No completed deposit history yet. Process pending slips above.
                </div>
              ) : (
                depositRequests
                  .filter(r => r.status !== 'PENDING')
                  .slice()
                  .reverse()
                  .map(r => (
                    <div
                      key={r.id}
                      className="bg-[#0F0B08] p-2.5 border border-[#382F26] flex items-center justify-between text-xs font-mono-num"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#F5EAD4]">{r.profileUsername}</span>
                          <span className="text-[#F5EAD4]/60">Slip #{r.slipNumber}</span>
                          <span className="text-[10px] text-[#EAB308] uppercase">{r.method}</span>
                        </div>
                        <div className="text-[11px] text-[#F5EAD4]/70 truncate max-w-sm">
                          "{r.referenceNote}"
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={`font-bold text-sm ${r.status === 'APPROVED' ? 'text-emerald-400' : 'text-rose-400 line-through'}`}>
                          ${r.amount.toFixed(2)}
                        </div>
                        <span className={`text-[10px] font-bold uppercase px-1 py-0.2 border ${
                          r.status === 'APPROVED'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                            : 'bg-rose-950 text-rose-300 border-rose-500'
                        }`}>
                          {r.status}
                        </span>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TREASURY & MATH DASHBOARD (Existing Solvency Screen) */}
      {operatorTab === 'treasury' && (
        <div className="space-y-6">
          {/* Primary KPI Deck (The Headline Cover Ratio) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Cover Ratio Box */}
            <div className="bg-[#181310] border-3 border-[#0F0B08] p-4 shadow-comic-red">
              <div className="flex items-center justify-between text-xs text-[#F5EAD4]/60 uppercase font-semibold">
                <span>Solvency Cover Ratio</span>
                <span className="text-[10px] bg-emerald-900/60 text-emerald-300 px-1 py-0.5 border border-emerald-500 font-mono-num font-bold">
                  FLOOR: 3.00x
                </span>
              </div>

              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-display text-4xl sm:text-5xl font-black text-emerald-400 font-mono-num">
                  {treasury.coverRatio}x
                </span>
                <span className="text-xs text-[#F5EAD4]/70">Healthy</span>
              </div>

              <p className="text-[11px] text-[#F5EAD4]/60 mt-2">
                Reserves ({treasury.reservesDcdn.toLocaleString()} DCDN) ÷ Worst-Case Open Liability ({treasury.openLiabilityDcdn.toLocaleString()} DCDN).
              </p>
            </div>

            {/* Reserves Box */}
            <div className="bg-[#181310] border-3 border-[#0F0B08] p-4 shadow-comic-mustard">
              <div className="text-xs text-[#F5EAD4]/60 uppercase font-semibold">
                Multisig Treasury Reserves
              </div>
              <div className="mt-2 font-display text-3xl font-black text-[#EAB308] font-mono-num">
                {treasury.reservesDcdn.toLocaleString()} DCDN
              </div>
              <span className="text-xs text-[#F5EAD4]/70 block font-mono-num">
                ≈ ${treasury.reservesUsd.toLocaleString()} USD (@ $1.42/DCDN)
              </span>
            </div>

            {/* 24h Handle & Hold */}
            <div className="bg-[#181310] border-3 border-[#0F0B08] p-4 shadow-comic-ink">
              <div className="text-xs text-[#F5EAD4]/60 uppercase font-semibold">
                24h Handle & Hold Rate
              </div>
              <div className="mt-2 font-display text-3xl font-black text-[#F5EAD4] font-mono-num">
                {treasury.hold24hPct}% Hold
              </div>
              <span className="text-xs text-[#F5EAD4]/70 block font-mono-num">
                24h Handle: ${treasury.handle24h.toLocaleString()}
              </span>
            </div>

            {/* 30d Net Gaming Revenue */}
            <div className="bg-[#181310] border-3 border-[#0F0B08] p-4 shadow-comic-ink">
              <div className="text-xs text-[#F5EAD4]/60 uppercase font-semibold">
                30-Day Net Gaming Revenue
              </div>
              <div className="mt-2 font-display text-3xl font-black text-emerald-400 font-mono-num">
                +${treasury.ngr30dUsd.toLocaleString()}
              </div>
              <span className="text-xs text-[#F5EAD4]/70 block">
                Sweeps scheduled weekly to operator
              </span>
            </div>
          </div>

          {/* Section: Treasury Management & Top-up */}
          <div className="bg-[#181310] border-2 border-[#382F26] p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-lg uppercase text-[#F5EAD4] tracking-wide">
                Multisig Vault Capital Injection
              </h3>
              <p className="text-xs text-[#F5EAD4]/70">
                Deposit DCDN directly to the tenant's on-chain multisig contract to increase the cover ratio floor.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                value={topUpAmount}
                onChange={e => setTopUpAmount(parseInt(e.target.value) || 0)}
                className="w-32 bg-[#0F0B08] border border-[#382F26] px-3 py-1.5 font-mono-num text-xs text-[#F5EAD4]"
              />
              <button
                onClick={handleTopUpTreasury}
                className="px-4 py-2 bg-[#DC2626] hover:bg-[#b91c1c] text-[#F5EAD4] font-display text-xs uppercase border border-[#0F0B08] shadow-comic-ink cursor-pointer"
              >
                TOP UP TREASURY
              </button>
            </div>
          </div>

          {/* Section: Game RTP Variants Configuration */}
          <div className="bg-[#181310] border-2 border-[#382F26] p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#EAB308]" />
                <h3 className="font-display text-xl uppercase tracking-wide text-[#F5EAD4]">
                  Certified RTP Variant Selector
                </h3>
              </div>
              <span className="text-xs text-[#F5EAD4]/60">
                Operators may choose only certified lab variants; raw math cannot be tampered.
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono-num">
                <thead>
                  <tr className="border-b-2 border-[#382F26] text-[#F5EAD4]/60 uppercase">
                    <th className="py-2">Game Title</th>
                    <th className="py-2">Type</th>
                    <th className="py-2">House Edge</th>
                    <th className="py-2">Certified Variants</th>
                    <th className="py-2">Active Variant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#382F26]/60">
                  {GAME_CATALOG.map(game => (
                    <tr key={game.id} className="hover:bg-[#1F1914]">
                      <td className="py-2.5 font-bold font-sans text-[#F5EAD4]">
                        {game.title}
                      </td>
                      <td className="py-2.5 uppercase text-[#F5EAD4]/70">
                        {game.type}
                      </td>
                      <td className="py-2.5 text-[#DC2626] font-bold">
                        {(100 - (selectedVariants[game.id] || game.rtp)).toFixed(2)}%
                      </td>
                      <td className="py-2.5">
                        <div className="flex items-center gap-1.5">
                          {game.rtpVariants.map(v => (
                            <button
                              key={v}
                              onClick={() => handleVariantChange(game.id, v)}
                              className={`px-2 py-0.5 text-[11px] font-bold border transition-colors cursor-pointer ${
                                (selectedVariants[game.id] || game.rtp) === v
                                  ? 'bg-[#EAB308] text-[#0F0B08] border-[#0F0B08]'
                                  : 'bg-[#0F0B08] text-[#F5EAD4]/70 border-[#382F26] hover:text-[#F5EAD4]'
                              }`}
                            >
                              {v.toFixed(1)}%
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="py-2.5 text-emerald-400 font-bold">
                        {(selectedVariants[game.id] || game.rtp).toFixed(1)}% RTP
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PLAYER PROFILES DIRECTORY */}
      {operatorTab === 'profiles' && (
        <div className="bg-[#181310] border-2 border-[#382F26] p-5 space-y-4">
          <div className="flex items-center justify-between border-b-2 border-[#382F26] pb-3">
            <div>
              <h3 className="font-display text-xl uppercase tracking-wide text-[#F5EAD4]">
                Registered Player Profiles Ledger ({profiles.length})
              </h3>
              <p className="text-xs text-[#F5EAD4]/70">
                Live balances, cash game wallets, desk slip codes, and membership tiers.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono-num">
              <thead>
                <tr className="border-b border-[#382F26] text-[#F5EAD4]/60 uppercase">
                  <th className="py-2">Member</th>
                  <th className="py-2">Slip Code</th>
                  <th className="py-2">Tier</th>
                  <th className="py-2">Cash Game Wallet</th>
                  <th className="py-2">Free Chips</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#382F26]/60">
                {profiles.map(p => (
                  <tr key={p.id} className="hover:bg-[#1F1914]">
                    <td className="py-2.5 font-sans font-bold text-[#F5EAD4] flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-white"
                        style={{ backgroundColor: p.avatarColor }}
                      >
                        {p.username.slice(0, 2).toUpperCase()}
                      </div>
                      {p.username} ({p.nickname})
                    </td>
                    <td className="py-2.5 text-[#EAB308]">
                      #{p.deskSlipCode}
                    </td>
                    <td className="py-2.5 uppercase text-[#F5EAD4]/80">
                      {p.role}
                    </td>
                    <td className="py-2.5 font-bold text-emerald-400 text-sm">
                      ${p.cashBalance.toFixed(2)}
                    </td>
                    <td className="py-2.5 text-[#EAB308]">
                      {p.chipsBalance.toLocaleString()}
                    </td>
                    <td className="py-2.5">
                      <button
                        onClick={() => {
                          setManualProfileId(p.id);
                          setOperatorTab('cage');
                        }}
                        className="px-2 py-0.5 bg-[#0F0B08] hover:bg-[#DC2626] border border-[#382F26] text-[10px] uppercase font-bold cursor-pointer"
                      >
                        Adjust Cash
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Network Infrastructure Health Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono-num">
        <div className="bg-[#181310] border border-[#382F26] p-3 flex items-center justify-between">
          <span className="text-[#F5EAD4]/60">Base Sepolia RPC Status:</span>
          <span className="font-bold text-emerald-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            HEALTHY (42ms)
          </span>
        </div>

        <div className="bg-[#181310] border border-[#382F26] p-3 flex items-center justify-between">
          <span className="text-[#F5EAD4]/60">Cage Cashier Desk:</span>
          <span className="font-bold text-[#EAB308]">
            {pendingRequests.length} Slips Pending Sign-Off
          </span>
        </div>

        <div className="bg-[#181310] border border-[#382F26] p-3 flex items-center justify-between">
          <span className="text-[#F5EAD4]/60">Ledger Invariant Check:</span>
          <span className="font-bold text-emerald-400">Reconciled · 0 Mismatch</span>
        </div>
      </div>
    </div>
  );
};
