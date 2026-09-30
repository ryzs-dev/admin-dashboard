// Phone numbers are stored as bare digits with the country code, e.g.
// "60123456789" or "6591234567". Local forms like "012-345 6789" also show up
// in older imports.
function toInternationalDigits(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (/^0\d{8,10}$/.test(digits)) return `60${digits.slice(1)}`;
  if (/^[3689]\d{7}$/.test(digits)) return `65${digits}`;
  return digits;
}

export function isSingaporePhone(phone?: string | null): boolean {
  return toInternationalDigits(phone ?? '').startsWith('65');
}

export function phoneCountryCode(phone?: string | null): '+60' | '+65' {
  return isSingaporePhone(phone) ? '+65' : '+60';
}

// "+60123456789", for copying into WhatsApp or a courier form.
export function toE164(phone?: string | null): string {
  const digits = toInternationalDigits(phone ?? '');
  return digits ? `+${digits}` : '';
}

// "+60 12-345 6789", "+60 11-2345 6789", "+60 3-1234 5678", "+60 4-123 4567",
// "+60 88-123 456", "+65 9123 4567".
export function formatPhone(phone?: string | null): string {
  const digits = toInternationalDigits(phone ?? '');
  if (!digits) return '';

  if (digits.startsWith('65') && digits.length === 10) {
    const local = digits.slice(2);
    return `+65 ${local.slice(0, 4)} ${local.slice(4)}`;
  }

  if (digits.startsWith('60')) {
    const local = digits.slice(2);
    if (/^1\d{8,9}$/.test(local)) {
      const prefix = local.slice(0, 2);
      const rest = local.slice(2);
      const split = rest.length === 8 ? 4 : 3;
      return `+60 ${prefix}-${rest.slice(0, split)} ${rest.slice(split)}`;
    }
    if (/^[3-9]\d{7,8}$/.test(local)) {
      const areaLength = local.startsWith('8') ? 2 : 1;
      const area = local.slice(0, areaLength);
      const rest = local.slice(areaLength);
      const split = rest.length === 8 ? 4 : 3;
      return `+60 ${area}-${rest.slice(0, split)} ${rest.slice(split)}`;
    }
  }

  return `+${digits}`;
}
