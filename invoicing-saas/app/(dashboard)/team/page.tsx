'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Users, UserPlus, Shield, Crown, Lock, CheckCircle2, Mail, Trash2, RefreshCw, Copy, ExternalLink, Check } from 'lucide-react';
import { useAppStore } from '@/lib/store/appStore';
import { emailService } from '@/lib/services/emailService';

export default function TeamPage() {
  const { organization } = useAppStore();
  const isBusinessPlan = organization.plan === 'Business';

  const [members, setMembers] = useState([
    { id: 'm1', name: organization.name, email: organization.email || 'gerant@entreprise.ci', role: 'Administrateur', status: 'Actif' },
    { id: 'm2', name: 'Cabinet Comptable CI', email: 'comptable@cabinet-abidjan.ci', role: 'Comptable Externe', status: 'Actif' },
  ]);

  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('Gestionnaire');
  const [sending, setSending] = useState(false);

  // Success Invite Modal with Direct Link
  const [inviteModal, setInviteModal] = useState<{ open: boolean; email: string; inviteUrl: string }>({
    open: false,
    email: '',
    inviteUrl: '',
  });

  const [copied, setCopied] = useState(false);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    setSending(true);

    const token = `inv-${Date.now()}`;
    const expiresAt = new Date(Date.now() + 48 * 3600 * 1000).toLocaleString('fr-FR');

    // 1. Dispatch Email via Centralized Email Service
    const emailResult = await emailService.sendInvitationEmail({
      toEmail: newEmail.trim(),
      companyName: organization.name,
      role: newRole,
      token,
      expiresAt,
    });

    // 2. Update local state
    setMembers([
      ...members,
      { id: `m-${Date.now()}`, name: newEmail.split('@')[0], email: newEmail.trim(), role: newRole, status: 'Invitation Envoyée' },
    ]);

    setSending(false);
    setInviteModal({
      open: true,
      email: newEmail.trim(),
      inviteUrl: emailResult.inviteUrl,
    });
    setNewEmail('');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteModal.inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-900">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Gestion de l&apos;Équipe & Accès Comptables</h2>
        <p className="text-xs text-slate-500 mt-1">
          Invitez des collaborateurs, gestionnaires et comptables externes avec envoi d&apos;e-mails automatisé.
        </p>
      </div>

      {/* LOCK HERO BANNER IF NOT BUSINESS PLAN */}
      {!isBusinessPlan ? (
        <div className="p-8 bg-zinc-950 text-white rounded-3xl border border-zinc-800 shadow-2xl space-y-6 text-center relative overflow-hidden">
          <div className="w-16 h-16 rounded-3xl bg-orange-600/20 border border-orange-500/30 text-orange-400 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-orange-500" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <span className="px-3 py-1 bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold rounded-full">
              👑 Exclusif au Plan Business (15.000 FCFA/mois)
            </span>
            <h3 className="text-2xl font-black text-white">Débloquez le Multi-Utilisateurs & Accès Comptables</h3>
            <p className="text-xs text-zinc-400">
              Votre formule actuelle (<strong className="text-white">{organization.plan || 'Pro'}</strong>) ne permet pas d&apos;inviter des collaborateurs. Passez au Plan Business pour partager les accès avec votre comptable et votre équipe.
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-orange-600/30 transition-all"
            >
              <span>Passer au Plan Business (15.000 FCFA/m)</span>
              <Crown className="w-4 h-4 text-amber-300" />
            </Link>
          </div>
        </div>
      ) : (
        /* FULL BUSINESS FEATURE CONTENT */
        <div className="space-y-6">
          {/* Invite Member Form */}
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-slate-900">
              <UserPlus className="w-5 h-5 text-orange-600" />
              <h3 className="text-sm font-extrabold uppercase tracking-wider">Inviter un nouveau membre ou comptable</h3>
            </div>

            <form onSubmit={handleAddMember} className="flex flex-col sm:flex-row items-end gap-3 text-xs">
              <div className="flex-1 space-y-1 w-full">
                <label className="font-bold text-slate-700">Adresse Email Professionnelle *</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="comptable@entreprise.ci"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-orange-500 font-medium"
                  />
                </div>
              </div>

              <div className="w-full sm:w-48 space-y-1">
                <label className="font-bold text-slate-700">Rôle attribué</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:bg-white"
                >
                  <option value="Gestionnaire">Gestionnaire</option>
                  <option value="Comptable Externe">Comptable Externe</option>
                  <option value="Facturation Seule">Facturation Seule</option>
                  <option value="Administrateur">Administrateur</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full sm:w-auto px-5 py-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-extrabold rounded-xl shadow-md transition-all shrink-0 flex items-center justify-center gap-2"
              >
                {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                <span>Envoyer l&apos;invitation</span>
              </button>
            </form>
          </div>

          {/* Members Table */}
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">Membres & Invitations Envoyées ({members.length})</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase">
                    <th className="py-3 px-4 rounded-l-xl">Membre</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4 text-center">Rôle</th>
                    <th className="py-3 px-4 text-center">Statut E-mail</th>
                    <th className="py-3 px-4 text-right rounded-r-xl">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {members.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{m.name}</td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono">{m.email}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
                          {m.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            m.status.includes('Envoyée')
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {m.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {m.role !== 'Administrateur' && (
                          <button
                            onClick={() => setMembers(members.filter((x) => x.id !== m.id))}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                            title="Retirer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS INVITE MODAL WITH DIRECT EMERGENCY LINK */}
      {inviteModal.open && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="max-w-md w-full bg-zinc-900 rounded-3xl border border-zinc-800 p-6 space-y-5 text-zinc-100 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-white">Invitation Générée avec Succès !</h3>
              <p className="text-xs text-zinc-400">
                L&apos;invitation a été transmise à <strong className="text-white">{inviteModal.email}</strong>.
              </p>
            </div>

            <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 text-left space-y-2">
              <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider block">
                Lien d&apos;activation direct (Sécurisé 48h) :
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={inviteModal.inviteUrl}
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-[11px] font-mono text-zinc-300 focus:outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className="p-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold shrink-0 transition-colors"
                  title="Copier le lien"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-zinc-800">
              <a
                href={inviteModal.inviteUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-orange-400 font-bold hover:underline"
              >
                <span>Tester le lien maintenant</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                type="button"
                onClick={() => setInviteModal({ open: false, email: '', inviteUrl: '' })}
                className="px-5 py-2.5 bg-orange-600 text-white text-xs font-extrabold rounded-xl shadow-md"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
