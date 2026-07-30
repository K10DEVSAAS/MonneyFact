'use client';

import React, { useState } from 'react';
import { X, User, Plus, ArrowRight, Lock, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/lib/auth/authContext';
import { useAppStore } from '@/lib/store/appStore';

interface GoogleOAuthPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleOAuthPopup: React.FC<GoogleOAuthPopupProps> = ({ isOpen, onClose }) => {
  const { registerClient } = useAuth();
  const { initializeZeroAccount } = useAppStore();

  const [step, setStep] = useState<'select' | 'password' | 'custom'>('select');
  const [selectedAccount, setSelectedAccount] = useState<{ name: string; email: string } | null>(null);
  const [password, setPassword] = useState('');
  const [customEmail, setCustomEmail] = useState('');

  if (!isOpen) return null;

  const handleChooseAccount = (account: { name: string; email: string }) => {
    setSelectedAccount(account);
    setStep('password');
  };

  const handleConfirmLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const accountName = selectedAccount?.name || customEmail.split('@')[0] || 'Entreprise Google';
    const accountEmail = selectedAccount?.email || customEmail;

    const companyName = accountName.includes(' ')
      ? `${accountName.split(' ')[0]} SARL`
      : `${accountName} Enterprise`;

    initializeZeroAccount(companyName, accountEmail);
    registerClient(companyName, accountEmail, 'Pro');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-slate-900 animate-fade-in relative border border-slate-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Google Header */}
        <div className="text-center space-y-2">
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
            <h3 className="text-lg font-extrabold text-slate-900">Connexion avec Google</h3>
            <p className="text-xs text-slate-500">Choisir un compte pour continuer vers MonneyFact</p>
          </div>
        </div>

        {/* Step 1: Select Google Account */}
        {step === 'select' && (
          <div className="space-y-3">
            {[
              { name: 'Kouassi Yao', email: 'k.yao.entreprise@gmail.com' },
              { name: 'Direction Akwaba', email: 'direction.akwaba@gmail.com' },
            ].map((acc, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleChooseAccount(acc)}
                className="w-full p-3.5 bg-slate-50 hover:bg-orange-50/60 border border-slate-200 hover:border-orange-300 rounded-2xl flex items-center justify-between group transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-orange-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                    {acc.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                      {acc.name}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium">{acc.email}</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-orange-600 transition-colors" />
              </button>
            ))}

            <button
              type="button"
              onClick={() => setStep('custom')}
              className="w-full p-3.5 bg-white hover:bg-slate-50 border border-dashed border-slate-300 rounded-2xl flex items-center gap-3 text-xs font-bold text-slate-700 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                <Plus className="w-4 h-4" />
              </div>
              <span>Utiliser un autre compte Google</span>
            </button>
          </div>
        )}

        {/* Step 2: Google Password Input */}
        {step === 'password' && selectedAccount && (
          <form onSubmit={handleConfirmLogin} className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-orange-600 text-white font-bold text-xs flex items-center justify-center">
                {selectedAccount.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">{selectedAccount.name}</p>
                <p className="text-[11px] text-slate-500">{selectedAccount.email}</p>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Saisissez votre mot de passe Google</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="Mot de passe Google"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep('select')}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
              >
                Retour
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-extrabold rounded-xl shadow-md shadow-orange-600/20 transition-all"
              >
                <span>Valider et se connecter</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Enter Custom Google Email */}
        {step === 'custom' && (
          <form onSubmit={handleConfirmLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Adresse email Google</label>
              <input
                type="email"
                required
                placeholder="votre.entreprise@gmail.com"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep('select')}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
              >
                Retour
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-extrabold rounded-xl shadow-md transition-all"
              >
                <span>Continuer</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        <div className="pt-2 text-center text-[10px] text-slate-400">
          Google partagera votre nom, adresse email et photo de profil avec MonneyFact.
        </div>
      </div>
    </div>
  );
};
