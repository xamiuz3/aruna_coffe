'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';

const AdminGuard = dynamic(
  () => import('@/components/AdminGuard').then((mod) => mod.AdminGuard),
  { ssr: false }
);

export default function KasirLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isLoginPage =
    (typeof window !== 'undefined' && window.location.pathname.startsWith('/kasir/login')) ||
    (pathname ? pathname.startsWith('/kasir/login') : false);

  if (isLoginPage) {
    return <>{children}</>;
  }

  return <AdminGuard>{children}</AdminGuard>;
}
