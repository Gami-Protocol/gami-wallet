import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Truncate a wallet address: 0x7f3a…b29c */
export function shortAddr(addr: string | null | undefined, lead = 6, tail = 4): string {
  if (!addr) return '—';
  if (addr.length <= lead + tail + 1) return addr;
  return `${addr.slice(0, lead)}…${addr.slice(-tail)}`;
}
