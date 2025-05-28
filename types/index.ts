// types/index.ts - TypeScript definitions for your backend data

export interface Order {
  orderNumber: string;
  orderDate: string;
  fbName: string;
  customerName: string;
  gender?: string;
  paymentMethod: string;
  wash: number;
  femlift30ml: number;
  femlift10ml: number;
  bag: number;
  remark: string;
  packageAmount?: string;
  postage?: string;
  websiteCharges?: string;
  total: number;
  address: string;
  city: string;
  postcode: string;
  state: string;
  phoneNumber: string;
  trackingNumber?: string;
  courierCompany?: string;
  customerType: string;
  cashSaleReceipt?: string;
  agent: string;
}

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: string;
  recentOrders: Order[];
  productCounts: {
    wash: number;
    femlift30ml: number;
    femlift10ml: number;
    bag: number;
  };
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface HealthCheck {
  status: string;
  timestamp: string;
  orders: number;
  uptime: number;
}

// Product interface for potential future use
export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
}
