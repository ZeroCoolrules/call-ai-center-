import React, { useState } from 'react';
import { PlayerProfile, CashDepositRequest, DepositMethod } from '../types/casino';
import { sound } from '../lib/sound';
import {
  User,
  Users,
  Plus,
  Check,
  Clock,
  ArrowDownToLine,
  ShieldCheck,
  Coins,
  Banknote,
  Receipt,
  X,
  CreditCard,
  Building
} from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profiles: PlayerProfile[];
  activeProfile: PlayerProfile;
  onSelectProfile: (profile: PlayerProfile) => void;
  onCreateProfile: (profile: PlayerProfile) => void;
  onSubmitDepositRequest: (req: CashDepositRequest) => void;
  depositRequests: CashDepositRequest[];
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  profiles,
  activeProfile,
  onSelectProfile,
  onCreateProfile,
  onSubmitDepositRequest,
  depositRequests,
}) => {
  const [activeTab, setActiveTab] = useState<'switch' | 'deposit' | 'create'>('switch');

  // New Profile Form State
  const [newUsername, setNewUsername] = useState<string>('');
  const [newNickname, setNewNickname] = useState<string>('');
  const [newRole, setNewRole] = useState<PlayerProfile['role']>('player');

  // Deposit Request Form State
  const [depositAmount, setDepositAmount] = useState<number>(250);
  const [depositMethod, setDepositMethod] = useState<DepositMethod>('CASH_DESK');
  const [referenceNote, setReferenceNote] = useState<string>('Cash handed at cage desk');
  const [depositSuccessMsg, setDepositSuccessMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleCreateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) return;

    sound.playChipClick();
    const slipCode = `SLIP-${Math.floor(1000 + Math.random() * 9000)}`;
    const colors = ['#DC2626', '#EAB308', '#38BDF8', '#10B981', '#A855F7'];
    const chosenColor = colors[Math.floor(Math.random() * colors.length)];

    const created: PlayerProfile = {
      id: `prof-${Date.now()}`,
      username: newUsername.trim(),
      nickname: newNickname.trim() || newUsername.trim(),
      role: newRole,
      chipsBalance: 10000,
      cashBalance: 0,
      totalDeposited: 0,
      totalWithdrawn: 0,
      createdAt: Date.now(),
      deskSlipCode: slipCode,
      avatarColor: chosenColor,
    };

    onCreateProfile(created);
    setNewUsername('');
    setNewNickname('');
    setActiveTab('switch');
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (depositAmount <= 0) return;

    sound.playChipClick();
    const slipNum = `CSH-${Math.floor(100000 + Math.random() * 900000)}`;

    const req: CashDepositRequest = {
      id: `dep-${Date.now()}`,
      profileId: activeProfile.id,
      profileUsername: activeProfile.username,
      amount: depositAmount,
      method: depositMethod,
      referenceNote: referenceNote.trim() || 'Manual cash deposit voucher',
      slipNumber: slipNum,
      status: 'PENDING',
      createdAt: Date.now(),
    };

    onSubmitDepositRequest(req);
    setDepositSuccessMsg(`Deposit slip #${slipNum} generated! Waiting for admin cage approval.`);
    setTimeout(() => setDepositSuccessMsg(''), 4500);
  };

  const myRequests = depositRequests.filter(r => r.profileId === activeProfile.id);

  return (
    <div className="fixed inset-0 z-50 bg-[#0F0B08]/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#181310] border-3 border-[#0F0B08] p-5 sm:p-7 text-[#F5EAD4] shadow-comic-red my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-[#382F26] pb-3 mb-5">
          <div className="flex items-center gap-2.5">
            <Users className="w-6 h-6 text-[#EAB308]" />
            <div>
              <h2 className="font-display text-2xl uppercase tracking-wide">
                PLAYER PROFILES & CAGE CASHIER
              </h2>
              <p className="text-xs text-[#F5EAD4]/70">
                Active Member: <strong className="text-[#EAB308]">{activeProfile.username}</strong> ({activeProfile.nickname}) · Slip #{activeProfile.deskSlipCode}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#F5EAD4]/70 hover:text-[#DC2626] transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-2 mb-5 border-b border-[#382F26] pb-2">
          <button
            onClick={() => setActiveTab('switch')}
            className={`text-xs font-bold uppercase transition-colors cursor-pointer pb-1 ${
              activeTab === 'switch'
                ? 'text-[#EAB308] border-b-2 border-[#EAB308]'
                : 'text-[#F5EAD4]/70 hover:text-[#F5EAD4]'
            }`}
          >
            Switch Profile ({profiles.length})
          </button>
          <button
            onClick={() => setActiveTab('deposit')}
            className={`text-xs font-bold uppercase transition-colors cursor-pointer pb-1 flex items-center gap-1 ${
              activeTab === 'deposit'
                ? 'text-[#EAB308] border-b-2 border-[#EAB308]'
                : 'text-[#F5EAD4]/70 hover:text-[#F5EAD4]'
            }`}
          >
            <Banknote className="w-3.5 h-3.5 text-emerald-400" />
            Request Cash Deposit
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`text-xs font-bold uppercase transition-colors cursor-pointer pb-1 flex items-center gap-1 ${
              activeTab === 'create'
                ? 'text-[#EAB308] border-b-2 border-[#EAB308]'
                : 'text-[#F5EAD4]/70 hover:text-[#F5EAD4]'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Register New Profile
          </button>
        </div>

        {/* Tab 1: Switch Profile */}
        {activeTab === 'switch' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
              {profiles.map(prof => {
                const isCurrent = prof.id === activeProfile.id;
                return (
                  <div
                    key={prof.id}
                    onClick={() => {
                      sound.playChipClick();
                      onSelectProfile(prof);
                    }}
                    className={`p-3.5 border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      isCurrent
                        ? 'bg-[#1F1914] border-[#EAB308] shadow-comic-mustard'
                        : 'bg-[#0F0B08] border-[#382F26] hover:border-[#DC2626]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center font-display text-sm font-bold text-[#F5EAD4] border border-[#0F0B08]"
                          style={{ backgroundColor: prof.avatarColor }}
                        >
                          {prof.username.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-[#F5EAD4] font-sans flex items-center gap-1.5">
                            {prof.username}
                            {isCurrent && (
                              <span className="text-[10px] bg-[#EAB308] text-[#0F0B08] px-1 py-0.2 font-black uppercase">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#F5EAD4]/60 font-mono-num">
                            "{prof.nickname}" · #{prof.deskSlipCode}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 bg-[#181310] border border-[#382F26] text-[#EAB308]">
                        {prof.role}
                      </span>
                    </div>

                    <div className="mt-3 pt-2 border-t border-[#382F26] flex items-center justify-between text-xs font-mono-num">
                      <div>
                        <span className="text-[#F5EAD4]/60 text-[10px] block">CASH BALANCE</span>
                        <span className="font-bold text-emerald-400 text-sm">
                          ${prof.cashBalance.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[#F5EAD4]/60 text-[10px] block">FREE CHIPS</span>
                        <span className="font-bold text-[#EAB308]">
                          {prof.chipsBalance.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-[#0F0B08] p-3 border border-[#382F26] text-xs text-[#F5EAD4]/70 flex items-center justify-between">
              <span>Switching profiles seamlessly restores that player’s chips and cash wallet.</span>
              <span className="font-mono-num text-[#EAB308]">Auto-Saved Upfront</span>
            </div>
          </div>
        )}

        {/* Tab 2: Request Cash Deposit */}
        {activeTab === 'deposit' && (
          <div className="space-y-4">
            <div className="bg-[#0F0B08] p-3 border-2 border-emerald-600/80 text-xs space-y-1">
              <div className="font-bold text-emerald-400 flex items-center gap-1.5 uppercase font-display text-sm">
                <Receipt className="w-4 h-4" />
                Cash Deposit Request Workflow
              </div>
              <p className="text-[#F5EAD4]/80">
                Submit your cash amount here. The transaction creates a pending voucher slip that flows to the back-room <strong>Operator Cage / Admin Desk</strong> for approval. Once confirmed by an admin, the cash is immediately credited to <strong>{activeProfile.username}</strong>'s cash games balance.
              </p>
            </div>

            {depositSuccessMsg && (
              <div className="p-3 bg-emerald-950 border-2 border-emerald-500 text-emerald-300 text-xs font-bold">
                {depositSuccessMsg}
              </div>
            )}

            <form onSubmit={handleDepositSubmit} className="space-y-3 bg-[#1F1914] p-4 border border-[#382F26]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[#F5EAD4]/80 font-bold uppercase mb-1">
                    Cash Amount to Transfer ($ USD)
                  </label>
                  <input
                    type="number"
                    min="10"
                    step="10"
                    required
                    value={depositAmount}
                    onChange={e => setDepositAmount(Number(e.target.value))}
                    className="w-full bg-[#0F0B08] border border-[#382F26] px-3 py-2 font-mono-num text-sm text-[#F5EAD4] font-bold"
                  />
                  <div className="flex gap-1.5 mt-1.5">
                    {[100, 250, 500, 1000].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setDepositAmount(val)}
                        className="px-2 py-0.5 bg-[#0F0B08] border border-[#382F26] text-[10px] font-mono-num hover:border-[#EAB308] cursor-pointer"
                      >
                        ${val}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[#F5EAD4]/80 font-bold uppercase mb-1">
                    Transfer / Drop-Off Method
                  </label>
                  <select
                    value={depositMethod}
                    onChange={e => setDepositMethod(e.target.value as DepositMethod)}
                    className="w-full bg-[#0F0B08] border border-[#382F26] px-3 py-2 text-xs text-[#F5EAD4] font-bold"
                  >
                    <option value="CASH_DESK">Physical Cash Desk Drop-Off</option>
                    <option value="WIRE_TRANSFER">Bank Wire / ACH Slip</option>
                    <option value="ZELLE_VOUCHER">Zelle / Electronic Voucher</option>
                    <option value="CAGE_DIRECT">Casino Cage Direct Receipt</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#F5EAD4]/80 font-bold uppercase mb-1 text-xs">
                  Desk Note / Slip Memo / Teller Voucher
                </label>
                <input
                  type="text"
                  value={referenceNote}
                  onChange={e => setReferenceNote(e.target.value)}
                  placeholder="e.g. Handed $250 envelope to Cage Master Sal"
                  className="w-full bg-[#0F0B08] border border-[#382F26] px-3 py-2 text-xs text-[#F5EAD4]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#DC2626] hover:bg-[#b91c1c] text-[#F5EAD4] font-display text-sm uppercase border border-[#0F0B08] shadow-comic-ink cursor-pointer"
              >
                SUBMIT CASH DEPOSIT REQUEST FOR ADMIN APPROVAL
              </button>
            </form>

            {/* Past Requests for this Profile */}
            <div className="space-y-2">
              <h4 className="font-display text-xs uppercase text-[#F5EAD4]/80">
                Your Pending & Past Deposit Slips
              </h4>
              {myRequests.length === 0 ? (
                <div className="text-xs text-[#F5EAD4]/50 italic bg-[#0F0B08] p-3 border border-[#382F26] text-center">
                  No deposit requests created for this profile yet.
                </div>
              ) : (
                <div className="max-h-36 overflow-y-auto space-y-1.5">
                  {myRequests.slice().reverse().map(r => (
                    <div
                      key={r.id}
                      className="bg-[#0F0B08] p-2.5 border border-[#382F26] flex items-center justify-between text-xs font-mono-num"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#F5EAD4]">#{r.slipNumber}</span>
                          <span className="text-[10px] text-[#F5EAD4]/60 uppercase">{r.method}</span>
                        </div>
                        <div className="text-[11px] text-[#F5EAD4]/70 truncate max-w-[280px]">
                          "{r.referenceNote}"
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-bold text-emerald-400 text-sm">
                          +${r.amount.toFixed(2)}
                        </div>
                        <span
                          className={`text-[10px] font-bold uppercase px-1 py-0.2 border ${
                            r.status === 'APPROVED'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                              : r.status === 'REJECTED'
                              ? 'bg-rose-950 text-rose-300 border-rose-500'
                              : 'bg-amber-950 text-amber-300 border-amber-500 animate-pulse'
                          }`}
                        >
                          {r.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Register New Profile */}
        {activeTab === 'create' && (
          <form onSubmit={handleCreateProfile} className="space-y-4 bg-[#1F1914] p-4 border border-[#382F26] text-xs">
            <div>
              <label className="block text-[#F5EAD4]/80 font-bold uppercase mb-1">
                Full Character / Player Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Vincent 'Vinnie' Falcone"
                value={newUsername}
                onChange={e => setNewUsername(e.target.value)}
                className="w-full bg-[#0F0B08] border border-[#382F26] px-3 py-2 text-xs text-[#F5EAD4]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#F5EAD4]/80 font-bold uppercase mb-1">
                  Table Nickname / Handle
                </label>
                <input
                  type="text"
                  placeholder="e.g. The Enforcer"
                  value={newNickname}
                  onChange={e => setNewNickname(e.target.value)}
                  className="w-full bg-[#0F0B08] border border-[#382F26] px-3 py-2 text-xs text-[#F5EAD4]"
                />
              </div>

              <div>
                <label className="block text-[#F5EAD4]/80 font-bold uppercase mb-1">
                  Club Membership Tier
                </label>
                <select
                  value={newRole}
                  onChange={e => setNewRole(e.target.value as PlayerProfile['role'])}
                  className="w-full bg-[#0F0B08] border border-[#382F26] px-3 py-2 text-xs text-[#F5EAD4]"
                >
                  <option value="player">Card Room Player</option>
                  <option value="high_roller">High Roller Syndicate</option>
                  <option value="vip">Penthouse VIP</option>
                  <option value="admin">House Floor Manager</option>
                </select>
              </div>
            </div>

            <div className="p-3 bg-[#0F0B08] border border-[#382F26] text-[#F5EAD4]/70">
              New profiles start with <strong>10,000 complimentary Chips</strong>. Real cash can be added via cash deposit slip or manual cage desk input.
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-[#DC2626] hover:bg-[#b91c1c] text-[#F5EAD4] font-display text-sm uppercase border border-[#0F0B08] shadow-comic-ink cursor-pointer"
            >
              REGISTER NEW PROFILE & GENERATE DESK SLIP
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
