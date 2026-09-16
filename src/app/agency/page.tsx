'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spin } from 'antd';

export default function AgencyIndexPage() {
  const router = useRouter();

  useEffect(() => {
    let signedIn = false;
    try {
      signedIn = Boolean(localStorage.getItem('agency-demo-session'));
    } catch {
      // localStorage 不可用時一律導向登入頁
    }
    router.replace(signedIn ? '/agency/home' : '/agency/login');
  }, [router]);

  return (
    <div
      data-e2e-id="agency-index-loading"
      style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 240 }}
    >
      <Spin />
    </div>
  );
}
