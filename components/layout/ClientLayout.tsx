"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AuthProvider } from "@/components/providers/AuthProvider";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Public routes that don't require authentication
    const publicRoutes = ['/login', '/signup', '/password-reset', '/auth'];
    
    // Check if current route is public
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
    
    // If not a public route and not root, check authentication
    if (!isPublicRoute && pathname !== '/') {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        router.push('/auth/signin');
      }
    }
  }, [pathname, router]);

  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
