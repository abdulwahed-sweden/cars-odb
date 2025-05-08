import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarSeparator,
  SidebarInset,
} from "@/components/ui/sidebar";
import { GlobalHeader } from '@/components/layout/global-header';
import { LayoutDashboard, Terminal, KeyRound, Settings, LogOut, Bot } from 'lucide-react';
import Image from 'next/image'; // Keep if used for logo, currently Bot icon is used

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'CarDoc',
  description: 'Advanced Vehicle Diagnostics',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <SidebarProvider defaultOpen={true}>
          <Sidebar collapsible="icon" side="left" variant="sidebar">
            <SidebarHeader className="p-4">
              <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
                {/* Placeholder for a logo image if preferred over icon */}
                {/* <Image src="/logo.png" alt="CarDoc Logo" width={32} height={32} data-ai-hint="car diagnostics logo" /> */}
                <Bot className="h-8 w-8 text-accent shrink-0" />
                <h2 className="text-xl font-semibold text-primary group-data-[collapsible=icon]:hidden">CarDoc</h2>
              </div>
            </SidebarHeader>
            <SidebarContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton href="/" tooltip="Dashboard">
                    <LayoutDashboard />
                    <span>Dashboard</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
              <SidebarSeparator />
              <SidebarGroup>
                <SidebarGroupLabel>Developers</SidebarGroupLabel>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton href="/developers/api-docs" tooltip="API Documentation">
                      <Terminal />
                      <span>API Documentation</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton href="/developers/api-tokens" tooltip="API Tokens">
                      <KeyRound />
                      <span>API Tokens</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="mt-auto">
               <SidebarSeparator />
              <SidebarMenu>
                <SidebarMenuItem>
                   <SidebarMenuButton href="#" tooltip="Settings"> {/* Placeholder href */}
                    <Settings />
                    <span>Settings</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton href="#" tooltip="Log Out"> {/* Placeholder href */}
                    <LogOut />
                    <span>Log Out</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarFooter>
          </Sidebar>
          <SidebarInset>
            <GlobalHeader />
            <main className="flex-1 overflow-auto p-4 sm:p-6 bg-secondary/30 dark:bg-background">
                {children}
            </main>
            <footer className="w-full p-4 text-center text-sm text-muted-foreground border-t">
             <p>&copy; {new Date().getFullYear()} CarDoc. Advanced Vehicle Diagnostics.</p>
            </footer>
          </SidebarInset>
        </SidebarProvider>
        <Toaster />
      </body>
    </html>
  );
}
