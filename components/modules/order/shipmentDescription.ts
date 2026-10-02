type DescriptionLine = { product: { code?: string | null }; quantity: number };

const TOKEN = /\d+[a-z]+(?:\d+ml)?/gi;

// Codes in the description that aren't products, e.g. free gifts like "1a", "1t", "3sachet".
export function giftCodes(description: string | null | undefined, productCodes: Iterable<string>) {
  const known = new Set([...productCodes].map((code) => code.trim().toLowerCase()));
  return (description ?? '')
    .replace(/\s+/g, '')
    .match(TOKEN)
    ?.filter((token) => !known.has(token.replace(/^\d+/, '').toLowerCase())) ?? [];
}

// Mirrors the server: product codes with quantities, then any gift codes from the old description.
export function buildShipmentDescription(
  lines: DescriptionLine[],
  previous: string | null | undefined,
  productCodes: Iterable<string>
) {
  return (
    lines
      .map((line) => (line.product.code ? `${line.quantity}${line.product.code.trim()}` : ''))
      .join('') + giftCodes(previous, productCodes).join('')
  );
}
