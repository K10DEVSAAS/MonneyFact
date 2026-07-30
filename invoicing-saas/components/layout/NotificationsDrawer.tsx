'use client';

import React from 'react';
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

  if (!isOpen) return null;

  const notifications = isAdmin ? adminNotifications : companyNotifications;
  const markAsRead = isAdmin ? markAdminNotifAsRead : markCompanyNotifAsRead;
  const markAllAsRead = isAdmin ? markAllAdminNotifsAsRead : markAllCompanyNotifsAsRead;
  const deleteNotif = isAdmin ? deleteAdminNotif : deleteCompanyNotif;
  const clearAll = isAdmin ? clearAllAdminNotifs : clearAllCompanyNotifs;

  return (
    <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-fade-in text-slate-900">
      {/* Header */}
      <div className={`p-4 text-white flex items-center justify-between ${isAdmin ? 'bg-zinc-950 border-b border-orange-500/30' : 'bg-slate-900'}`}>
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-orange-500" />
          <span className="font-bold text-xs">
            {isAdmin ? 'Notifications Super Administrateur' : 'Notifications Entreprise'}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-600 font-extrabold text-white">
            {notifications.length}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Action Controls Bar */}
      {notifications.length > 0 && (
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[11px] font-bold">
          <button
            onClick={markAllAsRead}
            className="text-orange-600 hover:underline flex items-center gap-1"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Tout marquer comme lu</span>
          </button>
          <button
            onClick={clearAll}
            className="text-rose-600 hover:underline flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Tout effacer</span>
          </button>
        </div>
      )}

      {/* Notifications List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
        {notifications.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <Bell className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-700">Aucune notification</p>
            <p className="text-[11px] text-slate-400">
              {isAdmin
                ? 'Les inscriptions d\'entreprises et événements système s\'afficheront ici.'
                : 'Vos créations de factures, encaissements et modifications s\'afficheront ici.'}
            </p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-3.5 flex items-start justify-between gap-3 text-xs transition-colors ${
                notif.read ? 'bg-white opacity-70' : 'bg-orange-50/40 border-l-4 border-orange-500'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 shrink-0">
                  {notif.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  {notif.type === 'warning' && <AlertTriangle className="w-4 h-4 text-rose-600" />}
                  {notif.type === 'info' && <Info className="w-4 h-4 text-orange-600" />}
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-slate-900 text-xs">{notif.title}</p>
                  <p className="text-[11px] text-slate-600 leading-snug">{notif.message}</p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {formatDate(notif.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {!notif.read && (
                  <button
                    onClick={() => markAsRead(notif.id)}
                    title="Marquer comme lue"
                    className="p-1 text-slate-400 hover:text-orange-600 rounded"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => deleteNotif(notif.id)}
                  title="Supprimer"
                  className="p-1 text-slate-400 hover:text-rose-600 rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
