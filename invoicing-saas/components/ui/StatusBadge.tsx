import React from 'react';
import { InvoiceStatus } from '@/lib/types/invoice';
import { getStatusConfig } from '@/lib/utils/formatters';

interface StatusBadgeProps {
  status: InvoiceStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const config = getStatusConfig(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border transition-all ${config.bgClass} ${
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-xs'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
      {config.label}
    </span>
  );
};
