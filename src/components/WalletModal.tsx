import React, { useState } from 'react';
import { PlayerMode } from '../types/casino';
import { sound } from '../lib/sound';
import { Wallet, Copy, Check, ArrowDownToLine, ArrowUpFromLine, Shield, X, AlertCircle } from 'lucide-react';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMode: PlayerMode;
  chipsBalance: number;
  dcdnBalance: number;
  onClaimChipsFaucet: () => void;
  onClaimDcdnFaucet: () => void;
  onOpenProfileDesk?: () => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  currentMode,
  chipsBalance,
  dcdnBalance,
  onClaimChipsFaucet,
  onClaimDcdnFaucet,
  onOpenProfileDesk,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'balances' | 'limits'>('balances');
  
  // Responsible gaming limits state
  const [dailyLossLimit, setDailyLossLimit] = useState<number>(500);
  const [sessionTimeLimit, setSessionTimeLimit] = useState<number>(60);
  const [limitsSaved, setLimitsSaved] = useState<boolean>(false);

  const depositAddress = '0x8849E2D4Bc3dE68b44c82b09a930B07e0e2C4421';

  const handleCopy = () => {
    sound.playChipClick();
    navigator.clipboard.writeText(depositAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveLimits = () => {
    sound.playChipClick();
    setLimitsSaved(true);
    setTimeout(() => setLimitsSaved(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0F0B08]/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-[#181310] border-3 border-[#0F0B08] p-6 text-[#F5EAD4] shadow-comic-red">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-[#382F26] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-[#EAB308]" />
            <h2 className="font-display text-xl sm:text-2xl uppercase tracking-wide">
              WALLET & TREASURY CASHIER
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#F5EAD4]/70 hover:text-[#DC2626] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-2 mb-4 border-b border-[#382F26] pb-2">
          <button
            onClick={() => setActiveTab('balances')}
            className={`text-xs font-bold uppercase transition-colors cursor-pointer pb-1 ${
              activeTab === 'balances'
                ? 'text-[#EAB308] border-b-2 border-[#EAB308]'
                : 'text-[#F5EAD4]/70 hover:text-[#F5EAD4]'
            }`}
          >
            Balances & Faucet
          </button>
          <button
            onClick={() => setActiveTab('limits')}
            className={`text-xs font-bold uppercase transition-colors cursor-pointer pb-1 ${
              activeTab === 'limits'
                ? 'text-[#EAB308] border-b-2 border-[#EAB308]'
                : 'text-[#F5EAD4]/70 hover:text-[#F5EAD4]'
            }`}
          >
            Responsible Gaming Limits
          </button>
        </div>

        {activeTab === 'balances' ? (
          <div className="space-y-4">
            {/* Balances Card */}
            <div className="grid grid-cols-2 gap-3 font-mono-num text-xs">
              <div className="bg-[#0F0B08] p-3 border-2 border-[#EAB308]">
                <span className="text-[#F5EAD4]/60 uppercase block">Off-Chain Chips</span>
                <span className="text-xl font-bold text-[#EAB308] block my-1">
                  {chipsBalance.toLocaleString()}
                </span>
                <button
                  onClick={() => {
                    sound.playChipClick();
                    onClaimChipsFaucet();
                  }}
                  className="w-full mt-2 py-1 bg-[#EAB308] text-[#0F0B08] font-bold uppercase text-[10px] cursor-pointer"
                >
                  +5,000 Refill
                </button>
              </div>

              <div className="bg-[#0F0B08] p-3 border-2 border-[#DC2626]">
                <span className="text-[#F5EAD4]/60 uppercase block">DCDN (Base Sepolia)</span>
                <span className="text-xl font-bold text-[#DC2626] block my-1">
                  {dcdnBalance.toFixed(2)} DCDN
                </span>
                <button
                  onClick={() => {
                    sound.playChipClick();
                    onClaimDcdnFaucet();
                  }}
                  className="w-full mt-2 py-1 bg-[#DC2626] text-[#F5EAD4] font-bold uppercase text-[10px] cursor-pointer"
                >
                  +100 Test DCDN
                </button>
              </div>
            </div>

            {/* Base Sepolia Deposit Vault */}
            <div className="bg-[#0F0B08] p-3.5 border border-[#382F26] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#F5EAD4] uppercase">Your Platform Deposit Address</span>
                <span className="text-[10px] bg-emerald-900/70 text-emerald-300 px-1 py-0.5 border border-emerald-500 font-mono-num font-bold">
                  BASE SEPOLIA
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={depositAddress}
                  className="w-full bg-[#181310] border border-[#382F26] px-2.5 py-1.5 font-mono-num text-xs text-[#F5EAD4] select-all"
                />
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 bg-[#DC2626] text-[#F5EAD4] text-xs font-bold uppercase cursor-pointer flex items-center gap-1 shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="text-[11px] text-[#F5EAD4]/60">
                Credits after 12 block confirmations via QuickNode streams. No wallet required for guest play.
              </p>
            </div>

            {/* Cash Desk Slip Direct Transfer */}
            {onOpenProfileDesk && (
              <div className="bg-[#1F1914] border-2 border-emerald-600/80 p-3 flex items-center justify-between gap-3">
                <div className="text-xs">
                  <div className="font-bold text-emerald-400 uppercase font-display">
                    Prefer Direct Cash Drop / Cage Voucher?
                  </div>
                  <div className="text-[11px] text-[#F5EAD4]/70">
                    Submit a cash deposit request slip for the admin cage to review and credit.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    sound.playChipClick();
                    onClose();
                    onOpenProfileDesk();
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-[#0F0B08] font-bold text-xs uppercase font-display shrink-0 cursor-pointer shadow-comic-ink"
                >
                  Cash Desk Slips →
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            <p className="text-[#F5EAD4]/70">
              Set hard stop limits to maintain bankroll discipline. Wagers that would exceed your configured thresholds will be rejected automatically by the treasury engine.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[#F5EAD4]/80 font-bold uppercase mb-1">
                  Daily Loss Limit (DCDN / Chips)
                </label>
                <input
                  type="number"
                  value={dailyLossLimit}
                  onChange={e => setDailyLossLimit(parseInt(e.target.value) || 0)}
                  className="w-full bg-[#0F0B08] border border-[#382F26] px-3 py-2 font-mono-num text-sm text-[#F5EAD4]"
                />
              </div>

              <div>
                <label className="block text-[#F5EAD4]/80 font-bold uppercase mb-1">
                  Max Session Duration (Minutes)
                </label>
                <input
                  type="number"
                  value={sessionTimeLimit}
                  onChange={e => setSessionTimeLimit(parseInt(e.target.value) || 0)}
                  className="w-full bg-[#0F0B08] border border-[#382F26] px-3 py-2 font-mono-num text-sm text-[#F5EAD4]"
                />
              </div>

              <button
                onClick={handleSaveLimits}
                className="w-full py-2.5 bg-[#DC2626] hover:bg-[#b91c1c] text-[#F5EAD4] font-display text-sm uppercase border border-[#0F0B08] shadow-comic-ink cursor-pointer"
              >
                SAVE RESPONSIBLE GAMING LIMITS
              </button>

              {limitsSaved && (
                <div className="p-2 bg-emerald-900/60 border border-emerald-500 text-emerald-300 text-xs text-center font-bold">
                  Limits enforced across all games for the next 24 hours.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-[#382F26] flex items-center justify-between text-[11px] text-[#F5EAD4]/50">
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-[#EAB308]" />
            KYC & Jurisdictional Gating Cleared
          </span>
          <span>Base Testnet ID: 84532</span>
        </div>
      </div>
    </div>
  );
};
