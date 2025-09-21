/* eslint-disable @typescript-eslint/no-explicit-any */
// components/layout/CRMLayout.tsx
"use client";

import { useState, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  MessageCircle,
  BarChart3,
  Settings,
  Search,
  Bell,
  User,
  Menu,
  Package,
  Zap,
  ChevronDown,
  ChevronLeft,
} from "lucide-react";

interface CRMLayoutProps {
  children: ReactNode;
}

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  href: string;
  badge?: string | number;
}

export default function CRMLayout({ children }: CRMLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifications] = useState(3);
  const pathname = usePathname();
  const router = useRouter();

  const menuItems: MenuItem[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/" },
    { id: "customers", label: "Customers", icon: Users, href: "/customers" },
    { id: "orders", label: "Orders", icon: ShoppingBag, href: "/orders" },
    {
      id: "conversations",
      label: "Inbox",
      icon: MessageCircle,
      href: "/conversations",
    },
    { id: "campaigns", label: "Campaigns", icon: Zap, href: "/campaigns" },
    { id: "products", label: "Products", icon: Package, href: "/products" },
    { id: "packages", label: "Packages", icon: Package, href: "/packages" },
    {
      id: "analytics",
      label: "Analytics",
      icon: BarChart3,
      href: "/analytics",
    },
    { id: "settings", label: "Settings", icon: Settings, href: "/settings" },
  ];

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  const getPageTitle = () => {
    const currentItem = menuItems.find((item) => isActive(item.href));
    return currentItem?.label || "Dashboard";
  };

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-30 ${
          sidebarOpen ? "w-64" : "w-20"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {sidebarOpen && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">L</span>
              </div>
              <span className="font-bold text-xl text-gray-800">LUNAA CRM</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {sidebarOpen ? (
              <ChevronLeft className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-6">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.href)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-200 hover:bg-blue-50 hover:border-r-2 hover:border-blue-500 group ${
                isActive(item.href)
                  ? "bg-blue-50 border-r-2 border-blue-500 text-blue-700"
                  : "text-gray-600 hover:text-blue-700"
              }`}
            >
              <item.icon
                className={`h-5 w-5 ${
                  isActive(item.href)
                    ? "text-blue-600"
                    : "text-gray-500 group-hover:text-blue-600"
                }`}
              />
              {sidebarOpen && (
                <>
                  <span className="flex-1 font-medium">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        item.badge === "NEW"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div
        className={`flex-1 transition-all duration-300 ${
          sidebarOpen ? "ml-64" : "ml-20"
        }`}
      >
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-800">
                {getPageTitle()}
              </h1>
              <div className="hidden md:flex items-center bg-gray-100 rounded-lg px-3 py-2">
                <Search className="h-4 w-4 text-gray-400 mr-2" />
                <input
                  type="text"
                  placeholder="Search customers, orders, products..."
                  className="bg-transparent text-sm text-gray-600 placeholder-gray-400 border-none outline-none w-80"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="h-5 w-5" />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {notifications}
                  </span>
                )}
              </button>

              <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-100 transition-colors">
                <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-800">
                    Admin User
                  </p>
                  <p className="text-xs text-gray-500">admin@lunaa.com</p>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main
          className="p-6 overflow-auto"
          style={{ height: "calc(100vh - 80px)" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
