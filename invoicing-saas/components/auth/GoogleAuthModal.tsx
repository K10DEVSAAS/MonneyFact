'use client';

import React, { useState } from 'react';
import { X, User, Plus, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth/authContext';
import { useAppStore } from '@/lib/store/appStore';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({ isOpen, onClose }) => {
  const { registerClient } = useAuth();
  const { initializeZeroAccount } = useAppStore();

  const [customEmail, setCustomEmail] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  if (!isOpen) return null;

  const handleSelectAccount = (email: string, name: string) => {
    const companyName = name.includes(' ') ? `${name.split(' ')[0]} Enterprise` : `${name} SARL`;
    initializeZeroAccount(companyName, email);
    registerClient(companyName, email, 'Pro');
    onClose();
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim()) return;
    const name = customEmail.split('@')[0];
    handleSelectAccount(customEmail, name);
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-slate-900 animate-fade-in relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Google Header */}
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto shadow-xs">
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
              />
              <path
                fill="#FBBC05"
                d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12.5s.7 2.8 1.9 5.2l3.7-2.9z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">Choisissez un compte Google</h3>
            <p className="text-xs text-slate-500 mt-1">pour continuer vers MonneyFact</p>
          </div>
        </div>

        {/* Account Selector List */}
        {!showCustomInput ? (
          <div className="space-y-3">
            {[
              { name: 'Kouassi Yao', email: 'kouassi.yao@gmail.com' },
              { name: 'Chrome Digital', email: 'chrome.digital@gmail.com' },
            ].map((account, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectAccount(account.email, account.name)}
                className="w-full p-3.5 bg-slate-50 hover:bg-orange-50/60 border border-slate-200 hover:border-orange-300 rounded-2xl flex items-center justify-between group transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-orange-600 text-white font-bold text-xs flex items-center justify-center">
                    {account.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                      {account.name}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium">{account.email}</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-orange-600 transition-colors" />
              </button>
            ))}

            <button
              onClick={() => setShowCustomInput(true)}
              className="w-full p-3.5 bg-white hover:bg-slate-50 border border-dashed border-slate-300 rounded-2xl flex items-center gap-3 text-xs font-bold text-slate-700 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                <Plus className="w-4 h-4" />
              </div>
              <span>Utiliser un autre compte Google</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleCustomSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Adresse email Google</label>
              <input
                type="email"
                required
                placeholder="votre.nom@gmail.com"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowCustomInput(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
              >
                Retour
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-extrabold rounded-xl shadow-md transition-all"
              >
                Continuer
              </button>
            </div>
          </form>
        )}

        <div className="pt-2 text-center text-[11px] text-slate-400">
          En continuant, Google partagera votre nom et votre adresse email avec MonneyFact.
        </div>
      </div>
    </div>
  );
};
