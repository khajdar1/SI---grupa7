'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';

const AUTH_REDIRECT_MESSAGE_KEY = 'authRedirectMessage';

function getFallbackMessage(searchParams: URLSearchParams): string | null {
  if (searchParams.has('unauthorized')) {
    return 'You do not have permission to access that page.';
  }

  if (searchParams.has('redirected')) {
    return 'Please sign in to continue.';
  }

  return null;
}

export function AuthRedirectNotice() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const hasRedirectNotice = searchParams.has('unauthorized') || searchParams.has('redirected');
    const storedMessage = window.sessionStorage.getItem(AUTH_REDIRECT_MESSAGE_KEY);
    if (storedMessage && hasRedirectNotice) {
      window.sessionStorage.removeItem(AUTH_REDIRECT_MESSAGE_KEY);
      setMessage(storedMessage);
      return;
    }

    if (storedMessage) {
      window.sessionStorage.removeItem(AUTH_REDIRECT_MESSAGE_KEY);
    }

    setMessage(getFallbackMessage(searchParams));
  }, [searchParams]);

  if (!message) {
    return null;
  }

  return (
    <div className="mx-auto mt-4 flex w-full max-w-[var(--content-max-width)] items-start gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}
