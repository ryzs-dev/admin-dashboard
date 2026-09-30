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
  Zap,
  User2,
  Radio,
  Book,
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
    {
      id: 'inbox',
      label: 'Inbox',
      icon: MessageCircle,
      href: '/inbox',
    },
    { id: 'products', label: 'Products', icon: Package, href: '/products' },
    { id: 'templates', label: 'Templates', icon: Book, href: '/templates' },
    { id: 'automation', label: 'Automation', icon: Zap, href: '/automation' },
    {
      id: 'segments',
      label: 'Segments',
      icon: User2,
      href: '/segments',
    },
    {
      id: 'broadcasts',
      label: 'Broadcasts',
      icon: Radio,
      href: '/broadcast',
    },
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
        <div className="flex items-center gap-2 px-2 py-1">
          <Image
            src="/brand/lunaa-icon.png"
            alt="Lunaa"
            width={300}
            height={300}
            className="h-6 w-6 shrink-0"
          />
          {!isCollapsed && (
            <div className="flex flex-col flex-1 min-w-0">
              <span className="truncate text-base font-bold">
                Lunaa Women Care
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <Separator className="my-2" />

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
                  <Avatar className="h-4 w-4">
                    <AvatarImage src="" alt={user?.email || 'User'} />
                    <AvatarFallback>
                      {user?.email ? getInitials(user.email) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <>
                      <div className="flex flex-col text-left text-sm">
                        <span className="truncate font-medium">
                          {user?.email?.split('@')[0] || 'User'}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
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
  const pathName = usePathname();
  // Capitalize the header for better readability
  const header = pathName
    .trimStart()
    .split('/')[1]
    ?.replace(/^\w/, (c) => c.toUpperCase());

  return (
    <SidebarProvider>
      <div className="flex w-full">
        <CRMSidebar />

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col">
          {/* Header */}
          <header className="sticky top-0 z-10 flex h-16 w-full items-center gap-4 border-b bg-[#fff8f3] px-6">
            {/* Search Bar */}
            <SidebarTrigger className="shrink-0" />
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-800">{header}</h1>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-2">
              {/* User Menu */}
              {/* <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 gap-2 px-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" alt={user?.email || 'User'} />
                      <AvatarFallback>
                        {user?.email ? getInitials(user.email) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden flex-col items-start text-left text-sm md:flex">
                      <span className="font-medium">
                        {user?.email?.split('@')[0] || 'User'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Admin
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">
                        {user?.email?.split('@')[0] || 'User'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user?.email || 'user@example.com'}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
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
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => {}} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu> */}
            </div>
          </header>

          {/* Main Content */}
          <main>{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
