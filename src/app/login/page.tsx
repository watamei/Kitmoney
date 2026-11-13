'use client';

import { useRouter } from 'next/navigation';
import LoginPage from '@/components/LoginPage';

export default function LoginRoutePage() {
  const router = useRouter();

  const handleLoginSuccess = () => {
    router.push('/');
    router.refresh();
  };

  return <LoginPage onLoginSuccess={handleLoginSuccess} />;
}
