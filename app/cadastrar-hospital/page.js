// app/cadastrar-hospital/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import { verificarAutenticacao } from '../utils/helpers';

/**
 * PÁGINA PRINCIPAL - GESTÃO DE HOSPITAIS/UBS
 * Menu com duas opções: Gerenciar ou Adicionar
 */
export default function CadastrarHospitalPage() {
  const router = useRouter();

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
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header titulo="Hospitais e UBS" mostrarVoltar voltarPara="/busca" />

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="space-y-6">
          
          {/* Card de Introdução */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  Gestão de Unidade de Saúde
                </h1>
                <p className="text-blue-100 text-sm mt-1">
                  Gerencie unidades de saúde e vincule médicos
                </p>
              </div>
            </div>
          </div>

          {/* Opção 1: Gerenciar Unidades médicas */}
          <div 
            onClick={() => router.push('/gerenciar-hospitais')}
            className="bg-white rounded-lg shadow-sm border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer p-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Gerenciar Unidades de Saúde
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Ver, editar e gerenciar unidades cadastradas
                  </p>
                </div>
              </div>
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          {/* Opção 2: Adicionar Unidades médicas */}
          <div 
            onClick={() => router.push('/adicionar-hospital')}
            className="bg-white rounded-lg shadow-sm border-2 border-gray-200 hover:border-green-500 hover:shadow-lg transition-all cursor-pointer p-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Adicionar Novo Unidade de Saúde
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Cadastrar nova Unidade de Saúde
                  </p>
                </div>
              </div>
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          {/* Estatísticas rápidas */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              Visão Geral
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">--</div>
                <div className="text-xs text-gray-600 mt-1">Unidades médicas</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">--</div>
                <div className="text-xs text-gray-600 mt-1">Médicos Vinculados</div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}