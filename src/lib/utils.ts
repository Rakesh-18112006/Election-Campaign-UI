import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getRoleBadgeColor(role: string): string {
  const colors: Record<string, string> = {
    MAIN_ADMIN: 'bg-purple-100 text-purple-800 border-purple-200',
    MAYOR: 'bg-blue-100 text-blue-800 border-blue-200',
    SARPANCH: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    WARD_SUPERVISOR: 'bg-amber-100 text-amber-800 border-amber-200',
    WARD_MEMBER: 'bg-green-100 text-green-800 border-green-200',
  };
  return colors[role] || 'bg-gray-100 text-gray-800 border-gray-200';
}

export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    MAIN_ADMIN: 'Main Admin',
    MAYOR: 'Mayor',
    SARPANCH: 'Sarpanch',
    WARD_SUPERVISOR: 'Ward Supervisor',
    WARD_MEMBER: 'Ward Member',
  };
  return labels[role] || role;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    suspended: 'bg-red-100 text-red-800',
    visited: 'bg-green-100 text-green-800',
    not_visited: 'bg-orange-100 text-orange-800',
    assigned: 'bg-blue-100 text-blue-800',
    unassigned: 'bg-gray-100 text-gray-700',
    draft: 'bg-gray-100 text-gray-700',
    paused: 'bg-amber-100 text-amber-800',
    completed: 'bg-green-100 text-green-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
}
