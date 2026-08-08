'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  UserPlus,
  Crown,
  Lock,
  CheckCircle2,
  Mail,
  Trash2,
  RefreshCw,
  Copy,
  ExternalLink,
  Check,
  Clock,
  History,
  ShieldCheck,
  Eye,
} from 'lucide-react';
import { useAppStore } from '@/lib/store/appStore';
import { emailService } from '@/lib/services/emailService';
import { RoleType, PermissionKey, TeamMember, Subsidiary } from '@/lib/types/invoice';
import { formatDate } from '@/lib/utils/formatters';

import { usePermissions } from '@/lib/hooks/usePermissions';

interface AuditLogEntry {
  id: string;
  userEmail: string;
  userName: string;
  action: string;
  target: string;
  timestamp: string;
}

export default function TeamPage() {
  const { organization } = useAppStore();
  const { hasPermission } = usePermissions();
  const canManageTeam = hasPermission('manage_team');
  const isProPlan = organization.plan === 'Pro';
  const userEmail = organization.email ? organization.email.toLowerCase() : 'guest';

  const [subsidiaries, setSubsidiaries] = useState<Subsidiary[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);

  useEffect(() => {
    try {
      const savedSubs = localStorage.getItem(`monneyfact_subsidiaries_${userEmail}`);
      if (savedSubs) setSubsidiaries(JSON.parse(savedSubs));

      const savedMembers = localStorage.getItem(`monneyfact_team_${userEmail}`);
      if (savedMembers) {
        setMembers(JSON.parse(savedMembers));
      } else {
        const ownerMember: TeamMember = {
          id: `m-owner`,
          organizationId: organization.id,
          name: organization.name,
          email: organization.email || 'gerant@entreprise.ci',
          role: 'Administrateur Interne',
          permissions: ['create_invoices', 'edit_invoices', 'delete_invoices', 'send_invoices', 'manage_clients', 'view_analytics', 'manage_payments', 'manage_team'],
          accessScope: 'global',
          allowedSubsidiaryIds: [],
          status: 'Actif',
          createdAt: new Date().toISOString(),
        };
        setMembers([ownerMember]);
      }
    } catch (e) {
      console.error(e);
    }
  }, [organization.id, organization.name, organization.email, userEmail]);

  const saveMembersList = (list: TeamMember[]) => {
    setMembers(list);
    try {
      localStorage.setItem(`monneyfact_team_${userEmail}`, JSON.stringify(list));
    } catch (e) {
      console.error(e);
    }
  };

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);


  // Form state for creating member with fine permissions & scoping
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<RoleType>('Gestionnaire');
  const [inviteExpiration, setInviteExpiration] = useState<'10m' | '30m' | '1h' | '24h'>('30m');
  const [accessScope, setAccessScope] = useState<'global' | 'limited'>('global');
  const [selectedSubIds, setSelectedSubIds] = useState<string[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<PermissionKey[]>([
    'create_invoices',
    'send_invoices',
    'manage_clients',
  ]);

  const [sending, setSending] = useState(false);

  // Success Invite Modal with Direct Link
  const [inviteModal, setInviteModal] = useState<{ open: boolean; email: string; inviteUrl: string; expiryText: string }>({
    open: false,
    email: '',
    inviteUrl: '',
    expiryText: '',
  });

  const [copied, setCopied] = useState(false);

  const availablePermissions: { key: PermissionKey; label: string }[] = [
    { key: 'create_invoices', label: 'Créer des Factures & Devis' },
    { key: 'edit_invoices', label: 'Modifier les Factures' },
    { key: 'delete_invoices', label: 'Supprimer des Factures' },
    { key: 'send_invoices', label: 'Envoyer les Factures (Email & WhatsApp)' },
    { key: 'manage_clients', label: 'Gérer le Répertoire Clients' },
    { key: 'view_analytics', label: 'Consulter les Statistiques & CA' },
    { key: 'manage_payments', label: 'Gérer les Encaissements & Règlements' },
    { key: 'manage_team', label: 'Gérer les Collaborateurs' },
  ];

  const handleRoleChange = (role: RoleType) => {
    setNewRole(role);
    if (role === 'Administrateur Interne') {
      setSelectedPermissions(availablePermissions.map((p) => p.key));
    } else if (role === 'Comptable') {
      setSelectedPermissions(['view_analytics', 'manage_payments', 'send_invoices']);
    } else if (role === 'Commercial') {
      setSelectedPermissions(['create_invoices', 'send_invoices', 'manage_clients']);
    } else if (role === 'Gestionnaire') {
      setSelectedPermissions(['create_invoices', 'edit_invoices', 'send_invoices', 'manage_clients', 'manage_payments']);
    }
  };

  const togglePermission = (key: PermissionKey) => {
    setSelectedPermissions((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const toggleSubId = (subId: string) => {
    setSelectedSubIds((prev) =>
      prev.includes(subId) ? prev.filter((id) => id !== subId) : [...prev, subId]
    );
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    setSending(true);

    const token = `inv-${Date.now()}`;
    const expiryLabels = {
      '10m': '10 Minutes',
      '30m': '30 Minutes',
      '1h': '1 Heure',
      '24h': '24 Heures',
    };
    const expiresAtText = expiryLabels[inviteExpiration];

    const durationMinutesMap: Record<string, number> = {
      '10m': 10,
      '30m': 30,
      '1h': 60,
      '24h': 1440,
    };
    const durationMins = durationMinutesMap[inviteExpiration] || 30;
    const memberName = newEmail.split('@')[0];
    const hostCompanyEmail = organization.email || userEmail;

    // Store invitation details locally for instant retrieval when accepting
    const invitePayload = {
      token,
      email: newEmail.trim(),
      memberName,
      role: newRole,
      hostCompanyName: organization.name,
      hostCompanyEmail,
      permissions: selectedPermissions,
      accessScope,
      allowedSubsidiaryIds: accessScope === 'limited' ? selectedSubIds : [],
      durationMins,
      createdAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(`monneyfact_invite_${token}`, JSON.stringify(invitePayload));
      localStorage.setItem(`monneyfact_invite_latest_${newEmail.trim().toLowerCase()}`, JSON.stringify(invitePayload));
    } catch (e) {
      console.error(e);
    }

    // 1. Dispatch Email via Centralized Email Service
    const emailResult = await emailService.sendInvitationEmail({
      toEmail: newEmail.trim(),
      memberName,
      companyName: organization.name,
      hostCompanyEmail,
      role: newRole,
      token,
      expiresAt: expiresAtText,
      durationMins,
      permissions: selectedPermissions,
      accessScope,
      allowedSubsidiaryIds: accessScope === 'limited' ? selectedSubIds : [],
    });

    const fullInviteUrl = emailResult.inviteUrl;

    // 2. Add member with fine permissions & scoping
    const createdMember: TeamMember = {
      id: `m-${Date.now()}`,
      organizationId: organization.id,
      name: newEmail.split('@')[0],
      email: newEmail.trim(),
      role: newRole,
      permissions: selectedPermissions,
      accessScope,
      allowedSubsidiaryIds: accessScope === 'limited' ? selectedSubIds : [],
      status: 'Invitation Envoyée',
      createdAt: new Date().toISOString(),
    };

    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      userEmail: organization.email || 'gerant@entreprise.ci',
      userName: organization.name,
      action: `Invitation du collaborateur ${newEmail.trim()} (Expiration ${expiresAtText})`,
      target: 'Gestion Équipe',
      timestamp: new Date().toISOString(),
    };

    saveMembersList([...members, createdMember]);
    setAuditLogs([newLog, ...auditLogs]);
    setSending(false);
    setInviteModal({
      open: true,
      email: newEmail.trim(),
      inviteUrl: fullInviteUrl,
      expiryText: expiresAtText,
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
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Gestion des Collaborateurs, Invitations & Traçabilité</h2>
        <p className="text-xs text-slate-500 mt-1">
          Invitez votre équipe, attribuez des rôles sur-mesure, définissez l&apos;expiration des liens et consultez l&apos;historique d&apos;audit.
        </p>
      </div>

      {/* LOCK HERO BANNER IF NOT BUSINESS PLAN OR IF COLLABORATOR WITHOUT MANAGE_TEAM PERMISSION */}
      {!canManageTeam ? (
        <div className="p-8 bg-zinc-950 text-white rounded-3xl border border-zinc-800 shadow-2xl space-y-6 text-center relative overflow-hidden">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-rose-500" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <span className="px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold rounded-full">
              🔒 Autorisation Manquante
            </span>
            <h3 className="text-2xl font-black text-white">Gestion de l&apos;Équipe Restreinte</h3>
            <p className="text-xs text-zinc-400">
              Votre compte collaborateur ne dispose pas de la permission &quot;Gérer les Collaborateurs&quot;. Seul l&apos;administrateur de l&apos;entreprise peut inviter des membres ou modifier les droits d&apos;accès.
            </p>
          </div>
        </div>
      ) : !isProPlan ? (
        <div className="p-8 bg-zinc-950 text-white rounded-3xl border border-zinc-800 shadow-2xl space-y-6 text-center relative overflow-hidden">
          <div className="w-16 h-16 rounded-3xl bg-orange-600/20 border border-orange-500/30 text-orange-400 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-orange-500" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <span className="px-3 py-1 bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold rounded-full">
              👑 Exclusif au Plan Business (15.000 FCFA/mois)
            </span>
            <h3 className="text-2xl font-black text-white">Débloquez le Multi-Utilisateurs & Journal d&apos;Audit</h3>
            <p className="text-xs text-zinc-400">
              Votre formule actuelle (<strong className="text-white">{organization.plan || 'Pro'}</strong>) ne permet pas d&apos;inviter des collaborateurs. Passez au Plan Business pour partager les accès avec votre équipe et suivre les actions effectuées.
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
          {/* Invite Member Form with Expiration Control & Scoping */}
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center gap-2 text-slate-900 border-b border-slate-100 pb-3">
              <UserPlus className="w-5 h-5 text-orange-600" />
              <h3 className="text-sm font-extrabold uppercase tracking-wider">Ajouter un Collaborateur & Attribuer des Droits</h3>
            </div>

            <form onSubmit={handleAddMember} className="space-y-6 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Adresse Email du Collaborateur *</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="collaborateur@entreprise.ci"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-orange-500 font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Rôle Préréglé</label>
                  <select
                    value={newRole}
                    onChange={(e) => handleRoleChange(e.target.value as RoleType)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:bg-white"
                  >
                    <option value="Gestionnaire">Gestionnaire</option>
                    <option value="Comptable">Comptable</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Administrateur Interne">Administrateur Interne</option>
                    <option value="Sur-mesure">Sur-mesure</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-orange-600" /> Expiration de l&apos;Invitation *
                  </label>
                  <select
                    value={inviteExpiration}
                    onChange={(e) => setInviteExpiration(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:bg-white"
                  >
                    <option value="10m">10 Minutes (Sécurité maximale)</option>
                    <option value="30m">30 Minutes (Recommandé)</option>
                    <option value="1h">1 Heure</option>
                    <option value="24h">24 Heures</option>
                  </select>
                </div>
              </div>

              {/* 1. Fine-grained Permissions Matrix */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="font-extrabold text-slate-900 block">Permissions Accordées :</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {availablePermissions.map((perm) => (
                    <label
                      key={perm.key}
                      className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                        selectedPermissions.includes(perm.key)
                          ? 'bg-orange-50 border-orange-300 text-orange-950 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(perm.key)}
                        onChange={() => togglePermission(perm.key)}
                        className="rounded text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-[11px] leading-tight">{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 2. Scope Option Choice: Global vs Limited to Specific Subsidiaries */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <label className="font-extrabold text-slate-900 block">Scope d&apos;Accès aux Sous-Entreprises / Agences :</label>

                <div className="flex flex-col sm:flex-row gap-4">
                  <label
                    className={`flex-1 p-4 rounded-2xl border cursor-pointer space-y-1 transition-all ${
                      accessScope === 'global'
                        ? 'bg-orange-50 border-orange-400 text-orange-950 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="scope"
                        checked={accessScope === 'global'}
                        onChange={() => setAccessScope('global')}
                        className="text-orange-600"
                      />
                      <span className="font-extrabold text-xs">Option 1 : Accès Global</span>
                    </div>
                    <p className="text-[11px] text-slate-500 pl-6">
                      Le collaborateur peut accéder et consulter toutes les filiales et agences de l&apos;entreprise.
                    </p>
                  </label>

                  <label
                    className={`flex-1 p-4 rounded-2xl border cursor-pointer space-y-1 transition-all ${
                      accessScope === 'limited'
                        ? 'bg-orange-50 border-orange-400 text-orange-950 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="scope"
                        checked={accessScope === 'limited'}
                        onChange={() => setAccessScope('limited')}
                        className="text-orange-600"
                      />
                      <span className="font-extrabold text-xs">Option 2 : Accès Restreint par Agence</span>
                    </div>
                    <p className="text-[11px] text-slate-500 pl-6">
                      Le collaborateur est affecté uniquement aux sous-entreprises sélectionnées ci-dessous.
                    </p>
                  </label>
                </div>

                {/* Subsidiary Checkboxes if Limited */}
                {accessScope === 'limited' && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 animate-fade-in">
                    <span className="font-bold text-slate-800 text-[11px] block">Sélectionner les agences autorisées :</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {subsidiaries.map((sub) => (
                        <label key={sub.id} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                          <input
                            type="checkbox"
                            checked={selectedSubIds.includes(sub.id)}
                            onChange={() => toggleSubId(sub.id)}
                            className="rounded text-orange-600"
                          />
                          <span>{sub.name} ({sub.city})</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={sending}
                  className="px-6 py-3 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-extrabold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  <span>Générer l&apos;Invitation & Valider les Droits</span>
                </button>
              </div>
            </form>
          </div>

          {/* Members & Rights Table */}
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
              Équipe & Permissions Attribuées ({members.length})
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase">
                    <th className="py-3 px-4 rounded-l-xl">Collaborateur</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4 text-center">Rôle</th>
                    <th className="py-3 px-4 text-center">Scope Accès</th>
                    <th className="py-3 px-4 text-center">Permissions</th>
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
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {m.accessScope === 'global' ? 'Global (Toutes Agences)' : `Restreint (${m.allowedSubsidiaryIds.length} agences)`}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="text-[11px] font-bold text-slate-500">
                          {m.permissions ? `${m.permissions.length} autorisations` : 'Toutes'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {m.role !== 'Administrateur Interne' && (
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

          {/* AUDIT TRAIL / HISTORIQUE DES ACTIONS (Point 3) */}
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900">
                <History className="w-5 h-5 text-orange-600" />
                <h3 className="text-sm font-extrabold uppercase tracking-wider">Journal d&apos;Audit Trail & Historique des Collaborateurs</h3>
              </div>
              <span className="text-xs font-bold text-slate-500">{auditLogs.length} événements enregistrés</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase">
                    <th className="py-3 px-4 rounded-l-xl">Auteur de l&apos;Action</th>
                    <th className="py-3 px-4">Description de l&apos;Opération</th>
                    <th className="py-3 px-4 text-center">Module</th>
                    <th className="py-3 px-4 text-right rounded-r-xl">Horodatage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div>
                          <p>{log.userName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{log.userEmail}</p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-800 font-semibold">{log.action}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {log.target}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-500 font-mono">
                        {formatDate(log.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS INVITE MODAL WITH DIRECT EMERGENCY LINK & EXPIRY */}
      {inviteModal.open && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="max-w-md w-full bg-zinc-900 rounded-3xl border border-zinc-800 p-6 space-y-5 text-zinc-100 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-white">Invitation Générée avec Succès !</h3>
              <p className="text-xs text-zinc-400">
                L&apos;invitation et les droits de collaborateur ont été préparés pour <strong className="text-white">{inviteModal.email}</strong>.
              </p>
              <span className="inline-block px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold rounded-full">
                ⏱ Expiration : {inviteModal.expiryText}
              </span>
            </div>

            <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 text-left space-y-2">
              <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider block">
                Lien d&apos;activation direct (Sécurisé {inviteModal.expiryText}) :
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
                <span>Tester l&apos;accès collaborateur</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                type="button"
                onClick={() => setInviteModal({ open: false, email: '', inviteUrl: '', expiryText: '' })}
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
