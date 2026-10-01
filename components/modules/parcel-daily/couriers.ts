export type CourierInfo = {
  code: string;
  label: string;
  logo?: string;
};

// Codes match Parcel Daily's `serviceProvider` values (see /couriers and the
// `<code>Price` fields in its quotes).
const CATALOG: Record<string, Omit<CourierInfo, 'code'>> = {
  spx: { label: 'Shopee Express', logo: '/images/couriers/shopee.svg' },
  spxpromo: { label: 'Shopee Express (promo)', logo: '/images/couriers/shopee.svg' },
  jnt: { label: 'J&T Express', logo: '/images/couriers/jnt.png' },
  jntcargo: { label: 'J&T Cargo', logo: '/images/couriers/jnt.png' },
  dhl: { label: 'DHL eCommerce', logo: '/images/couriers/dhl-logo.png' },
  kex: { label: 'KEX Express', logo: '/images/couriers/kex.png' },
  lex: { label: 'Lazada Express', logo: '/images/couriers/lex.webp' },
  poslaju: { label: 'Pos Laju', logo: '/images/couriers/poslaju.svg' },
  flash: { label: 'Flash Express', logo: '/images/couriers/flash.png' },
  ninjavan: { label: 'Ninja Van' },
  citylink: { label: 'City-Link Express' },
  best: { label: 'Best Express' },
  bestcargo: { label: 'Best Cargo' },
  lineclear: { label: 'Line Clear Express' },
  teleport: { label: 'Teleport' },
  redly: { label: 'Redly' },
  aramex: { label: 'Aramex' },
  fedex: { label: 'FedEx' },
  sfexd: { label: 'SF Express', logo: '/images/couriers/sf.webp' },
  sfeconomy: { label: 'SF Economy', logo: '/images/couriers/sf.webp' },
};

// Values saved on older tracking records.
const ALIASES: Record<string, string> = {
  shopeexpress: 'spx',
  shopee_express: 'spx',
  'shopee express': 'spx',
  'j&t express': 'jnt',
  'flash express': 'flash',
  'sf express': 'sfexd',
  sf_express: 'sfexd',
};

export function courierInfo(code?: string | null, fallbackLabel?: string): CourierInfo {
  const raw = (code ?? '').trim();
  const key = ALIASES[raw.toLowerCase()] ?? raw.toLowerCase();
  const entry = CATALOG[key];
  return {
    code: entry ? key : raw,
    label: entry?.label ?? fallbackLabel ?? raw,
    logo: entry?.logo,
  };
}

export function courierLabel(code?: string | null) {
  return code ? courierInfo(code).label : '';
}

// Same links the WhatsApp tracking message uses.
const TRACKING_URLS: Record<string, (n: string) => string> = {
  spx: (n) => `https://spx.com.my/track?tracking_number=${n}`,
  jnt: (n) => `https://www.jtexpress.my/index/query/gzquery.html?billcode=${n}`,
  dhl: (n) => `https://www.dhl.com/my-en/home/tracking.html?tracking-id=${n}`,
  poslaju: (n) => `https://www.pos.com.my/v2/track-trace?trackNo=${n}`,
  flash: (n) => `https://www.flashexpress.my/fle/tracking?trackNumber=${n}`,
  ninjavan: (n) => `https://www.ninjavan.co/en-my/tracking?id=${n}`,
  citylink: (n) => `https://www.citylinkexpress.com/tracking-result/?track0=${n}`,
  kex: (n) => `https://www.tracking.my/kex/${n}`,
  lineclear: (n) => `https://www.tracking.my/lineclear/${n}`,
  aramex: (n) => `https://www.tracking.my/aramex/${n}`,
  lex: (n) => `https://www.tracking.my/lex/${n}`,
  best: (n) => `https://www.tracking.my/best/${n}`,
  sfexd: (n) =>
    `https://www.sf-international.com/us/en/dynamic_function/waybill/#search/bill-number/${n}`,
  sfeconomy: (n) =>
    `https://www.sf-international.com/us/en/dynamic_function/waybill/#search/bill-number/${n}`,
};

export function courierTrackingUrl(code?: string | null, trackingNumber?: string | null) {
  if (!code || !trackingNumber) return undefined;
  const build = TRACKING_URLS[courierInfo(code).code];
  return build?.(encodeURIComponent(trackingNumber.trim()));
}

const codes = (list: string[]) => list.map((code) => courierInfo(code));

// Couriers Parcel Daily serves from our Penang pickup address, used where a
// live quote isn't available (bulk shipping, manual tracking).
export const BOOKABLE_COURIERS = {
  Malaysia: codes(['spx', 'jnt', 'dhl', 'kex', 'poslaju', 'ninjavan', 'citylink', 'best', 'lineclear', 'lex']),
  Singapore: codes(['aramex', 'ninjavan', 'sfexd', 'sfeconomy']),
};

export const TRACKING_COURIERS: CourierInfo[] = [
  ...BOOKABLE_COURIERS.Malaysia,
  courierInfo('flash'),
  ...BOOKABLE_COURIERS.Singapore.filter((c) => c.code !== 'ninjavan'),
];
