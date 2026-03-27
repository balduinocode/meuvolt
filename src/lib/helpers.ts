export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

export function formatCep(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`;
}

export function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'agora';
  if (diffMins < 60) return `há ${diffMins} min`;
  if (diffHours < 24) return `há ${diffHours}h`;
  if (diffDays === 1) return 'há 1 dia';
  if (diffDays < 30) return `há ${diffDays} dias`;
  if (diffDays < 365) return `há ${Math.floor(diffDays / 30)} meses`;
  return `há ${Math.floor(diffDays / 365)} anos`;
}

export function haptic(type: 'light' | 'medium' | 'success' | 'error' = 'light') {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    switch (type) {
      case 'light': navigator.vibrate(10); break;
      case 'medium': navigator.vibrate([50, 30, 50]); break;
      case 'success': navigator.vibrate([100, 50, 100, 50, 100]); break;
      case 'error': navigator.vibrate([50, 50, 50]); break;
    }
  }
}

export function getQuoteNumber(number: number, prefix: string = 'ORC'): string {
  return `${prefix}-${new Date().getFullYear()}-${String(number).padStart(4, '0')}`;
}

export function calculateSubtotal(items: { quantity: number; unitPrice: number }[]): number {
  return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
}

export function calculateDiscount(subtotal: number, discountType: 'none' | 'percent' | 'fixed', discountValue: number): number {
  if (discountType === 'percent') return subtotal * (discountValue / 100);
  if (discountType === 'fixed') return discountValue;
  return 0;
}
