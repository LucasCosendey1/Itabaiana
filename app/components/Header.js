// app/components/Header.js
'use client';

import { useRouter } from 'next/navigation';
import { removerToken, getToken } from '../utils/helpers';

/**
 * COMPONENTE DE HEADER
 * Exibe título da página e informações do usuário logado
 */
export default function Header({ titulo, mostrarVoltar = false, voltarPara = null }) {
  const router = useRouter();
  const usuario = getToken();

  const handleVoltar = () => {
    if (voltarPara) {
      router.push(voltarPara);
    } else {
      router.back();
    }
  };

  const handleLogout = () => {
    removerToken();
    router.push('/login');
  };

  return (
    <header className="bg-primary text-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        {/* Linha superior - Título e usuário */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            {mostrarVoltar && (
              <button
                onClick={handleVoltar}
                className="text-white hover:text-gray-200 transition-colors"
                aria-label="Voltar"
              >
                <svg 
                  className="w-6 h-6" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M15 19l-7-7 7-7" 
                  />
                </svg>
              </button>
            )}
            <h1 className="text-xl font-bold">{titulo}</h1>
          </div>
          
          {usuario && (
            <button
              onClick={handleLogout}
              className="text-sm hover:text-gray-200 transition-colors flex items-center gap-1"
            >
              <svg 
                className="w-4 h-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
                />
              </svg>
              Sair
            </button>
          )}
        </div>

        {/* Informação do usuário logado */}
        {usuario && (
          <div className="text-xs text-blue-100">
            {usuario.nome} • {usuario.role === 'admin' ? 'Administrador' : 'Operador'}
          </div>
        )}
      </div>
    </header>
  );
}