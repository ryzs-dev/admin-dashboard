export const COURIER_SERVICES = {
  Malaysia: [
    {
      value: 'spx',
      label: 'Shopee Express',
      logo: '/images/couriers/shopee.svg', // ✅ remove `/public`
    },
    {
      value: 'dhl',
      label: 'DHL Express',
      logo: '/images/couriers/dhl-logo.png',
    },
    {
      value: 'jnt',
      label: 'J&T Express',
      logo: '/images/couriers/jnt.png',
    },
    {
      value: 'kex',
      label: 'KEX',
      logo: '/images/couriers/kex.png',
    },
    {
      value: 'lex',
      label: 'Lazada Express',
      logo: '/images/couriers/lex.webp',
    },
    {
      value: 'poslaju',
      label: 'Pos Laju',
      logo: '/images/couriers/poslaju.svg',
    },
  ],
  Singapore: [
    {
      value: 'sf_express',
      label: 'SF Express',
      logo: '/images/couriers/sf.webp',
    },
  ],
};

// Couriers a tracking number can be entered for by hand, including ones that
// aren't booked through Parcel Daily.
export const TRACKING_COURIERS = [
  ...COURIER_SERVICES.Malaysia,
  { value: 'flash', label: 'Flash Express', logo: '/images/couriers/flash.png' },
  ...COURIER_SERVICES.Singapore,
];
