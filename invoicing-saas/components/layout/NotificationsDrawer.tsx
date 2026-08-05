'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell, CheckCheck, Trash2, X, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { useAppStore } from '@/lib/store/appStore';
import { useAuth } from '@/lib/auth/authContext';
import { formatDate } from '@/lib/utils/formatters';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'super_admin';
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    companyNotifications,
    adminNotifications,
    markCompanyNotifAsRead,
    markAllCompanyNotifsAsRead,
    deleteCompanyNotif,
    clearAllCompanyNotifs,
    markAdminNotifAsRead,
    markAllAdminNotifsAsRead,
    deleteAdminNotif,
    clearAllAdminNotifs,
  } = useAppStore();

  if (!isOpen || !mounted || typeof window === 'undefined') return null;

  const notifications = isAdmin ? adminNotifications : companyNotifications;
  const markAsRead = isAdmin ? markAdminNotifAsRead : markCompanyNotifAsRead;
  const markAllAsRead = isAdmin ? markAllAdminNotifsAsRead : markAllCompanyNotifsAsRead;
  const deleteNotif = isAdmin ? deleteAdminNotif : deleteCompanyNotif;
  const clearAll = isAdmin ? clearAllAdminNotifs : clearAllCompanyNotifs;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex justify-end bg-slate-950/60 backdrop-blur-xs animate-fade-in font-sans">
      <div className="w-full max-w-sm bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
        
        {/* Header */}
        <div className={`p-5 text-white flex items-center justify-between shrink-0 ${isAdmin ? 'bg-[#0B0F17] border-b border-indigo-500/30' : 'bg-slate-950'}`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-xs text-white">
                {isAdmin ? 'Notifications Super Admin' : 'Notifications Entreprise'}
              </h3>
              <p className="text-[10px] text-slate-400">Centre d&apos;alertes en temps réel</p>
            </div>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-orange-600 font-black text-white ml-1">
              {notifications.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-800/60 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Controls Bar */}
        {notifications.length > 0 && (
          <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[11px] font-extrabold shrink-0">
            <button
              onClick={markAllAsRead}
              className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Tout marquer comme lu</span>
            </button>
            <button
              onClick={clearAll}
              className="text-rose-600 hover:text-rose-700 flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Tout effacer</span>
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
          {notifications.length === 0 ? (
            <div className="py-20 px-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Bell className="w-6 h-6" />
              </div>
              <p className="text-sm font-extrabold text-slate-900">Aucune notification</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                {isAdmin
                  ? 'Les inscriptions d\'entreprises, paiements et alertes de sécurité s\'afficheront immédiatement ici.'
                  : 'Vos créations de factures, encaissements et activités d\'équipe s\'afficheront ici en temps réel.'}
              </p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 rounded-2xl transition-all flex items-start justify-between gap-3 text-xs mb-1.5 ${
                  notif.read ? 'bg-white opacity-75 border border-transparent' : 'bg-orange-50/60 border border-orange-200/80 shadow-2xs'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5 shrink-0">
                    {notif.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    {notif.type === 'warning' && <AlertTriangle className="w-4 h-4 text-rose-600" />}
                    {notif.type === 'info' && <Info className="w-4 h-4 text-indigo-600" />}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <p className="font-extrabold text-slate-900 text-xs truncate">{notif.title}</p>
                    <p className="text-[11px] text-slate-600 leading-relaxed">{notif.message}</p>
                    <p className="text-[10px] text-slate-400 font-mono pt-1">
                      {formatDate(notif.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {!notif.read && (
                    <button
                      onClick={() => markAsRead(notif.id)}
                      title="Marquer comme lue"
                      className="p-1 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotif(notif.id)}
                    title="Supprimer"
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
