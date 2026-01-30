'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import { verificarAutenticacao } from '../utils/helpers';

export default function CadastrarMotoristaPage() {
  const router = useRouter();
  
  // Estado para os números (começa com --)
  const [stats, setStats] = useState({ total: '--', disponiveis: '--' });

  useEffect(() => {
    const autenticado = verificarAutenticacao(router);
    if (autenticado) {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (token) {
        const usuario = JSON.parse(token);
        if (usuario.role !== 'administrador') {
          router.push('/busca');
          return;
        }
      }
      // ✅ CHAMA A FUNÇÃO DE CARREGAR DADOS
      carregarStats();
    }
  }, [router]);

  // ✅ FUNÇÃO QUE BUSCA E CALCULA OS NÚMEROS
  const carregarStats = async () => {
    try {
      const res = await fetch('/api/listar-motoristas-completo');
      if (res.ok) {
        const data = await res.json();
        const lista = data.motoristas || [];
        
        // Calcula totais
        const total = lista.length;
        const disponiveis = lista.filter(m => m.disponivel && m.ativo).length;

        setStats({ total, disponiveis });
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header titulo="Motoristas" mostrarVoltar voltarPara="/busca" />

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        
        {/* Estatísticas */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-3xl font-bold text-primary mb-1">{stats.total}</div>
            <div className="text-sm text-gray-600">Motoristas Cadastrados</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-3xl font-bold text-green-600 mb-1">{stats.disponiveis}</div>
            <div className="text-sm text-gray-600">Motoristas Disponíveis</div>
          </div>
        </div>

        {/* Opções */}
        <div className="space-y-4">
          
          {/* Gerenciar Motoristas */}
          <button
            onClick={() => router.push('/gerenciar-motoristas')}
            className="w-full bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Gerenciar Motoristas
                  </h3>
                  <p className="text-sm text-gray-600">
                    Ver, editar e gerenciar motoristas cadastrados
                  </p>
                </div>
              </div>
              <svg className="w-6 h-6 text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {/* Adicionar Novo Motorista */}
          <button
            onClick={() => router.push('/adicionar-motorista')}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-md p-6 hover:shadow-lg transition-all group text-white"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-colors">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold mb-1">
                    Adicionar Novo Motorista
                  </h3>
                  <p className="text-sm text-green-100">
                    Cadastrar um novo motorista no sistema
                  </p>
                </div>
              </div>
              <svg className="w-6 h-6 text-white/80 group-hover:text-white group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

        </div>

      </main>
    </div>
  );
}