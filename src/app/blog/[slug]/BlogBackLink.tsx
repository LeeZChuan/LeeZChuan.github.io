'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface BlogBackLinkProps {
  label: string;
  className: string;
}

function getBlogReturnPath(from: string | null) {
  if (!from) return '/blog';
  if (from === '/blog' || from.startsWith('/blog?')) return from;
  return '/blog';
}

export default function BlogBackLink({ label, className }: BlogBackLinkProps) {
  const searchParams = useSearchParams();
  const href = getBlogReturnPath(searchParams.get('from'));

  return (
    <Link href={href} className={className}>
      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M19 12H5M12 5l-7 7 7 7"/>
      </svg>
      {label}
    </Link>
  );
}
