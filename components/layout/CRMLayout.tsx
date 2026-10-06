'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Package,
  LogOut,
  ChevronDown,
  MessageCircle,
  Blocks,
  Banknote,
  Clock,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/providers/auth-providers';

interface CRMLayoutProps {
  children: ReactNode;
}

interface MenuItem {
  id: string;
  label: string;
  icon: typeof LayoutDashboard;
  href: string;
  badge?: string | number;
}

function CRMSidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      href: '/dashboard',
    },
    { id: 'customers', label: 'Customers', icon: Users, href: '/customers' },
    { id: 'orders', label: 'Orders', icon: ShoppingBag, href: '/orders' },
    { id: 'cod', label: 'COD', icon: Banknote, href: '/cod' },
    { id: 'follow-ups', label: 'Follow-ups', icon: Clock, href: '/follow-ups' },
    {
      id: 'inbox',
      label: 'Inbox',
      icon: MessageCircle,
      href: '/inbox',
    },
    { id: 'products', label: 'Products', icon: Package, href: '/products' },
    { id: 'integrations', label: 'Integrations', icon: Blocks, href: '/integrations' },
    // {
    //   id: 'import',
    //   label: 'Import',
    //   icon: FileUp,
    //   href: '/import',
    //   badge: 'NEW',
    // },
    // { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  const getInitials = (email: string) => {
    return email.split('@')[0].slice(0, 2).toUpperCase();
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2.5 px-2 py-2">
          <Image
            src="/brand/lunaa-icon.png"
            alt="Lunaa"
            width={300}
            height={300}
            className="h-7 w-7 shrink-0 brightness-0 invert"
          />
          {!isCollapsed && (
            <div className="flex min-w-0 flex-1 flex-col leading-tight">
              <span className="truncate text-[15px] font-semibold text-white">
                Lunaa Women Care
              </span>
              <span className="truncate text-[11px] uppercase tracking-[0.18em] text-sidebar-foreground/60">
                Back Office
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <Separator className="my-2 bg-sidebar-border" />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    tooltip={item.label}
                    className="h-9 text-sidebar-foreground/75 hover:text-white data-[active=true]:text-white"
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent h-16">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" alt={user?.email || 'User'} />
                    <AvatarFallback className="bg-white/15 text-xs font-medium text-white">
                      {user?.email ? getInitials(user.email) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <>
                      <div className="flex flex-col text-left text-sm">
                        <span className="truncate font-medium">
                          {user?.email?.split('@')[0] || 'User'}
                        </span>
                        <span className="truncate text-xs text-sidebar-foreground/60">
                          {user?.email || 'user@example.com'}
                        </span>
                      </div>
                      <ChevronDown className="ml-auto h-4 w-4" />
                    </>
                  )}
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {/* <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem> */}
                {/* <DropdownMenuSeparator /> */}
                <DropdownMenuItem onClick={signOut} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export default function CRMLayout({ children }: CRMLayoutProps) {
  return (
    <SidebarProvider open onOpenChange={() => {}}>
      <div className="flex w-full">
        <CRMSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-12 items-center px-3 md:hidden">
            <SidebarTrigger />
          </div>
          <main>{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
