import crypto from 'crypto';

export function generateUniqueCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `H${timestamp}${random}`;
}

export function generateSKU(categoryId: number, productId: number): string {
  const cat = categoryId.toString().padStart(3, '0');
  const prod = productId.toString().padStart(5, '0');
  return `SKU-${cat}-${prod}`;
}

export function formatCurrency(amount: number): string {
  return `S/. ${amount.toFixed(2)}`;
}

export function calcularImpuesto(subtotal: number, tasa: number = 0.18): number {
  return subtotal * tasa;
}

export function calcularTotal(subtotal: number, impuesto: number): number {
  return subtotal + impuesto;
}

export function sanitizeString(str: string): string {
  return str.trim().replace(/[<>]/g, '');
}

export function paginate(page: number = 1, limit: number = 20): { offset: number; limit: number } {
  const p = Math.max(1, page);
  const l = Math.min(100, Math.max(1, limit));
  return { offset: (p - 1) * l, limit: l };
}
