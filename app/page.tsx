// app/page.js
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { estaAutenticado } from './utils/helpers';

/**
 * PÁGINA INICIAL
 * Redireciona para /login ou /busca dependendo da autenticação
 */
export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    if (estaAutenticado()) {
      router.push('/busca');
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700">
      <div className="text-white text-center">
        <div className="inline-block w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-lg">Carregando...</p>
      </div>
    </div>
  );
}