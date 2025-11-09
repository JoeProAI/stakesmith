'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { initPostHog, posthog } from '@/lib/posthog';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    // Initialize PostHog
    initPostHog();
  }, []);

  useEffect(() => {
    // Track page views
    if (pathname && posthog) {
      const url = window.origin + pathname + window.location.search;
      posthog.capture('$pageview', {
        $current_url: url,
      });
    }
  }, [pathname]);

  return <>{children}</>;
}
