'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import { verificarAutenticacao } from '../utils/helpers';

export default function GerenciarMedicosPage() {
  const router = useRouter();
  const [medicos, setMedicos] = useState([]);
  const [medicosFiltrados, setMedicosFiltrados] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    const autenticado = verificarAutenticacao(router);
    if (autenticado) {
        carregarLista();
    }
  }, [router]);

  useEffect(() => {
    if (busca.trim()) {
      const termo = busca.toLowerCase();
      const filtrados = medicos.filter(m => 
        m.nome_completo.toLowerCase().includes(termo) ||
        m.crm.toLowerCase().includes(termo) ||
        m.especializacao.toLowerCase().includes(termo)
      );
      setMedicosFiltrados(filtrados);
    } else {
      setMedicosFiltrados(medicos);
    }
  }, [busca, medicos]);

  const carregarLista = async () => {
    try {
      const response = await fetch('/api/listar-medicos-completo');
      const data = await response.json();
      if (response.ok) {
        setMedicos(data.medicos || []);
        setMedicosFiltrados(data.medicos || []);
      }
    } catch (error) {
      console.error('Erro ao carregar médicos:', error);
    } finally {
      setCarregando(false);
    }
  };

  if (carregando) {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-gray-600">Carregando médicos...</p>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header titulo="Gerenciar Médicos" mostrarVoltar voltarPara="/cadastrar-medico" />

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        
        {/* Busca */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Buscar Médico</label>
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Nome, CRM ou Especialização"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
          />
        </div>

        {/* Cabeçalho da Lista */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">{medicosFiltrados.length} médico(s) encontrado(s)</p>
          <button 
            onClick={() => router.push('/adicionar-medico')} 
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors shadow-sm"
          >
            + Novo Médico
          </button>
        </div>

        {/* Lista de Cards */}
        {medicosFiltrados.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center border border-gray-200">
            <p className="text-gray-500">Nenhum médico encontrado.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {medicosFiltrados.map((medico) => (
              <div 
                key={medico.id}
                onClick={() => {
                  // 🔍 DEBUG PARA VERIFICAR O ID
                  console.log('Clicou no médico:', medico.nome_completo);
                  console.log('ID do médico:', medico.id);

                  if (!medico.id) {
                    alert('ERRO: Médico sem ID. Verifique a API.');
                    return;
                  }
                  
                  router.push(`/medico/${medico.id}`);
                }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md hover:border-primary transition-all cursor-pointer group relative"
              >
                <div className="flex items-center gap-4">
                  {/* Ícone com Inicial (Padrão do Sistema) */}
                  <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-xl flex-shrink-0 border border-blue-100">
                    {medico.nome_completo ? medico.nome_completo.charAt(0) : '?'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary transition-colors truncate">
                      {medico.nome_completo}
                    </h3>
                    
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-gray-600 mt-1">
                      <span className="flex items-center gap-1">
                          CRM: <span className="font-medium text-gray-800">{medico.crm || 'N/A'}</span>
                      </span>
                      <span className="text-gray-300 hidden sm:inline">|</span>
                      <span className="text-primary font-medium bg-blue-50 px-2 py-0.5 rounded">
                        {medico.especializacao || 'Geral'}
                      </span>
                    </div>
                  </div>

                  {/* Seta indicativa */}
                  <div className="text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}