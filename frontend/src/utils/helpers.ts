export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return 'S/. 0.00';
  return `S/. ${num.toFixed(2)}`;
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateTime(date: string): string {
  return new Date(date).toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getEstadoColor(estado: string): string {
  const colors: Record<string, string> = {
    Pendiente: 'warning',
    Confirmada: 'info',
    CheckIn: 'success',
    CheckOut: 'neutral',
    Cancelada: 'danger',
    Disponible: 'success',
    Ocupada: 'warning',
    Limpieza: 'info',
    Mantenimiento: 'danger',
    Reservada: 'info',
    Preparando: 'warning',
    Completado: 'success',
    Entregado: 'info',
    Facturado: 'neutral',
  };
  return colors[estado] || 'neutral';
}

export function getModuloColor(modulo: string): string {
  const colors: Record<string, string> = {
    Restaurante: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
    Bar: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
    MiniMarket: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400',
  };
  return colors[modulo] || 'badge-neutral';
}

export function getInitials(name: string, lastName?: string): string {
  return `${name?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
}

export function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
