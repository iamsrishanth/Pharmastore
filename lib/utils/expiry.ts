export type ExpiryStatus = 'expired' | 'critical' | 'warning' | 'ok';

export interface ExpiryStatusDetails {
  status: ExpiryStatus;
  label: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}

export function getExpiryStatus(expiryDateStr: string): ExpiryStatusDetails {
  const expiry = new Date(expiryDateStr);
  expiry.setHours(23, 59, 59, 999);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffTime < 0) {
    return {
      status: 'expired',
      label: 'Expired',
      colorClass: 'text-red-400',
      bgClass: 'bg-red-500/10',
      borderClass: 'border-red-500/20',
    };
  } else if (diffDays <= 30) {
    return {
      status: 'critical',
      label: `Critical (${diffDays}d)`,
      colorClass: 'text-orange-400',
      bgClass: 'bg-orange-500/10',
      borderClass: 'border-orange-500/20',
    };
  } else if (diffDays <= 90) {
    return {
      status: 'warning',
      label: `Warning (${diffDays}d)`,
      colorClass: 'text-yellow-400',
      bgClass: 'bg-yellow-500/10',
      borderClass: 'border-yellow-500/20',
    };
  } else {
    return {
      status: 'ok',
      label: 'OK',
      colorClass: 'text-emerald-400',
      bgClass: 'bg-emerald-500/10',
      borderClass: 'border-emerald-500/20',
    };
  }
}
