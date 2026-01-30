'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import { verificarAutenticacao } from '../utils/helpers';

export default function GerenciarMotoristasPage() {
  const router = useRouter();
  const [motoristas, setMotoristas] = useState([]);
  const [motoristasFiltrados, setMotoristasFiltrados] = useState([]);
  const [carregando, setCarregando] = useState(true);
  
  // Filtros
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroDisponibilidade, setFiltroDisponibilidade] = useState('todos');

  useEffect(() => {
    const autenticado = verificarAutenticacao(router);
    if (autenticado) {
        carregarMotoristas();
    }
  }, [router]);

  useEffect(() => {
    aplicarFiltros();
  }, [busca, filtroStatus, filtroDisponibilidade, motoristas]);

  const carregarMotoristas = async () => {
    try {
      const response = await fetch('/api/listar-motoristas-completo');
      const data = await response.json();

      if (response.ok) {
        setMotoristas(data.motoristas || []);
        setMotoristasFiltrados(data.motoristas || []);
      }
    } catch (error) {
      console.error('Erro ao carregar motoristas:', error);
    } finally {
      setCarregando(false);
    }
  };

  const aplicarFiltros = () => {
    let resultado = [...motoristas];

    if (busca.trim()) {
      const buscaLower = busca.toLowerCase();
      resultado = resultado.filter(m => 
        m.nome_completo.toLowerCase().includes(buscaLower) ||
        m.cpf.includes(busca) ||
        (m.cnh && m.cnh.includes(busca))
      );
    }

    if (filtroStatus !== 'todos') {
      if (filtroStatus === 'ativos') resultado = resultado.filter(m => m.ativo === true);
      else if (filtroStatus === 'inativos') resultado = resultado.filter(m => m.ativo === false);
    }

    if (filtroDisponibilidade !== 'todos') {
        if (filtroDisponibilidade === 'disponiveis') resultado = resultado.filter(m => m.disponivel === true);
        else if (filtroDisponibilidade === 'indisponiveis') resultado = resultado.filter(m => m.disponivel === false);
    }

    setMotoristasFiltrados(resultado);
  };

  // Helper para formatar data
  const formatarData = (dataISO) => {
    if (!dataISO) return '-';
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR');
  };

  // Verifica se a CNH venceu
  const cnhVencida = (dataISO) => {
    if (!dataISO) return false;
    return new Date(dataISO) < new Date();
  };

  if (carregando) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">Carregando...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header titulo="Gerenciar Motoristas" mostrarVoltar voltarPara="/cadastrar-motorista" />

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        
        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Nome, CPF ou CNH"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="todos">Todos</option>
                <option value="ativos">Ativos</option>
                <option value="inativos">Inativos</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Disponibilidade</label>
              <select
                value={filtroDisponibilidade}
                onChange={(e) => setFiltroDisponibilidade(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="todos">Todos</option>
                <option value="disponiveis">Disponíveis</option>
                <option value="indisponiveis">Indisponíveis</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">{motoristasFiltrados.length} motorista(s)</p>
          <button
            onClick={() => router.push('/adicionar-motorista')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm transition-colors"
          >
            + Novo Motorista
          </button>
        </div>

        {motoristasFiltrados.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center border border-gray-200">
            <p className="text-gray-500">Nenhum motorista encontrado.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {motoristasFiltrados.map((motorista) => (
              <div
                key={motorista.motorista_id} 
                onClick={() => {
                   const idFinal = motorista.motorista_id || motorista.id;
                   if (!idFinal) {
                       alert('Erro: ID não encontrado.');
                       return;
                   }
                   router.push(`/motorista/${idFinal}`);
                }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between">
                  
                  {/* Avatar e Informações */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-xl flex-shrink-0">
                      {motorista.nome_completo ? motorista.nome_completo.charAt(0) : '?'}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary transition-colors">
                            {motorista.nome_completo}
                        </h3>
                        
                        {/* Badges de Status (Restaurados do código antigo) */}
                        <div className="flex gap-2">
                            {motorista.ativo ? 
                                <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full font-medium">Ativo</span> : 
                                <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full font-medium">Inativo</span>
                            }
                            {motorista.disponivel ? 
                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-medium">Disponível</span> : 
                                <span className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded-full font-medium">Ocupado</span>
                            }
                        </div>
                      </div>

                      {/* GRID COMPLETO DE INFORMAÇÕES (Restaurado) */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-y-2 gap-x-4 text-sm text-gray-600 mt-3">
                        <div>
                            <span className="text-xs text-gray-400 block uppercase">CPF</span> 
                            <span className="font-medium text-gray-800">{motorista.cpf}</span>
                        </div>
                        <div>
                            <span className="text-xs text-gray-400 block uppercase">CNH</span> 
                            <span className="font-medium text-gray-800">{motorista.cnh}</span>
                        </div>
                        <div>
                            <span className="text-xs text-gray-400 block uppercase">Categoria</span> 
                            <span className="font-medium text-gray-800">{motorista.categoria_cnh}</span>
                        </div>
                        <div>
                            <span className="text-xs text-gray-400 block uppercase">Validade</span> 
                            <span className={`font-medium ${cnhVencida(motorista.validade_cnh) ? 'text-red-600 font-bold' : 'text-green-600'}`}>
                                {formatarData(motorista.validade_cnh)}
                            </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Seta */}
                  <div className="text-gray-400 group-hover:text-primary transition-colors self-center">
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