// app/cadastrar-medico/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import { verificarAutenticacao } from '../utils/helpers';

export default function CadastrarMedicoPage() {
  const router = useRouter();
  const [stats, setStats] = useState({ total: '--' });

  useEffect(() => {
    const autenticado = verificarAutenticacao(router);
    if (autenticado) {
      carregarStats();
    }
  }, [router]);

  const carregarStats = async () => {
    try {
      const res = await fetch('/api/listar-medicos-completo');
      if (res.ok) {
        const data = await res.json();
        setStats({ total: data.medicos?.length || 0 });
      }
    } catch (error) {
      console.error('Erro stats médicos');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header titulo="Médicos" mostrarVoltar voltarPara="/busca" />

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        
        {/* Estatísticas */}
        <div className="grid grid-cols-1 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center justify-between">
            <div>
                <div className="text-3xl font-bold text-primary mb-1">{stats.total}</div>
                <div className="text-sm text-gray-600">Médicos Cadastrados</div>
            </div>

          </div>
        </div>

        {/* Opções */}
        <div className="space-y-4">
          
          {/* Gerenciar Médicos */}
          <button
            onClick={() => router.push('/gerenciar-medicos')}
            className="w-full bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Gerenciar Médicos
                  </h3>
                  <p className="text-sm text-gray-600">
                    Ver e editar lista de profissionais
                  </p>
                </div>
              </div>
              <svg className="w-6 h-6 text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {/* Adicionar Novo Médico */}
          <button
            onClick={() => router.push('/adicionar-medico')}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-md p-6 hover:shadow-lg transition-all group text-white"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-colors">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold mb-1">
                    Adicionar Médico
                  </h3>
                  <p className="text-sm text-green-100">
                    Cadastrar novo profissional e vínculos
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