// Define the valid courier names
export type CourierName =
  | 'ShopeeXpress'
  | 'FlashExpress'
  | 'JNT'
  | 'Best'
  | 'SFExpress';

// Mapping of courier names to tracking URLs
const courierUrls: Record<CourierName, string> = {
  ShopeeXpress: 'https://shopee.com.my/tracking?trackingNumber=',
  FlashExpress: 'https://www.flashexpress.com/tracking?tracking_number=',
  JNT: 'https://www.jtexpress.my/track?waybill=',
  Best: 'https://www.bestinc.com/track?tracking_number=',
  SFExpress:
    'https://www.sf-express.com/my/en/dynamic_function/waybill/#search/bill-number/',
};

// Function to get courier URL by name
export function getCourierUrl(name: CourierName): string {
  return courierUrls[name];
}
