// app/gerenciar-onibus/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import { verificarAutenticacao } from '../utils/helpers';

/**
 * PÁGINA DE GERENCIAMENTO DE ÔNIBUS
 * Lista todos os ônibus cadastrados com filtros e status
 */
export default function GerenciarOnibusPage() {
  const router = useRouter();
  const [onibus, setOnibus] = useState([]);
  const [onibusFiltrados, setOnibusFiltrados] = useState([]);
  const [carregando, setCarregando] = useState(true);
  
  // Filtros
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos'); // todos, disponivel, manutencao

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
    
    carregarFrota();
  }, [router]);

  useEffect(() => {
    aplicarFiltros();
  }, [busca, filtroStatus, onibus]);

  const carregarFrota = async () => {
    try {
      const response = await fetch('/api/listar-onibus-completo');
      const data = await response.json();

      if (response.ok) {
        setOnibus(data.onibus || []);
        setOnibusFiltrados(data.onibus || []);
      }
    } catch (error) {
      console.error('Erro ao carregar frota:', error);
    } finally {
      setCarregando(false);
    }
  };

  const aplicarFiltros = () => {
    let resultado = [...onibus];

    // Filtro de busca (Placa ou Modelo)
    if (busca.trim()) {
      const termo = busca.toLowerCase();
      resultado = resultado.filter(o => 
        o.placa.toLowerCase().includes(termo) ||
        o.modelo.toLowerCase().includes(termo)
      );
    }

    // Filtro de status (Disponível = true/false)
    if (filtroStatus === 'disponivel') {
      resultado = resultado.filter(o => o.disponivel === true);
    } else if (filtroStatus === 'indisponivel') {
      resultado = resultado.filter(o => o.disponivel === false);
    }

    setOnibusFiltrados(resultado);
  };

  const calcularEstatisticas = () => {
    const total = onibus.length;
    const disponiveis = onibus.filter(o => o.disponivel).length;
    const indisponiveis = total - disponiveis;
    const totalLugares = onibus.reduce((sum, o) => sum + (parseInt(o.capacidade_passageiros) || 0), 0);
    
    return { total, disponiveis, indisponiveis, totalLugares };
  };

  const stats = calcularEstatisticas();

  // --- CORREÇÃO AQUI: Navegação para a rota correta ---
  const irParaDetalhes = (id) => {
    router.push(`/onibus/${id}`);
  };

  if (carregando) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-gray-600">Carregando frota...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header titulo="Gerenciar Frota" mostrarVoltar voltarPara="/cadastrar-onibus" />

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-3xl font-bold text-primary mb-1">{stats.total}</div>
            <div className="text-sm text-gray-600">Total de Veículos</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-3xl font-bold text-green-600 mb-1">{stats.disponiveis}</div>
            <div className="text-sm text-gray-600">Disponíveis</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-3xl font-bold text-red-600 mb-1">{stats.indisponiveis}</div>
            <div className="text-sm text-gray-600">Em Manutenção/Uso</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-3xl font-bold text-blue-600 mb-1">{stats.totalLugares}</div>
            <div className="text-sm text-gray-600">Total de Assentos</div>
          </div>
        </div>

        {/* Filtros e Busca */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Busca */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar Veículo
              </label>
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Placa ou Modelo"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none uppercase"
              />
            </div>

            {/* Filtro Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              >
                <option value="todos">Todos</option>
                <option value="disponivel">Disponível</option>
                <option value="indisponivel">Indisponível</option>
              </select>
            </div>
          </div>
        </div>

        {/* Resultado */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {onibusFiltrados.length} veículo(s) encontrado(s)
          </p>
          <button
            onClick={() => router.push('/novo-onibus')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all text-sm font-medium shadow-sm"
          >
            + Novo Ônibus
          </button>
        </div>

        {/* Lista de Ônibus */}
        {onibusFiltrados.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <p className="text-gray-500 mb-2">Nenhum veículo encontrado</p>
            <p className="text-sm text-gray-400">Ajuste os filtros ou cadastre um novo ônibus</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {onibusFiltrados.map((bus) => (
              <div
                key={bus.id}
                onClick={() => irParaDetalhes(bus.id)} // ADICIONADO: Evento de clique
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-all group cursor-pointer" // ADICIONADO: cursor-pointer
              >
                <div className="flex items-start justify-between">
                  
                  {/* Informações Principais */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold text-xl flex-shrink-0">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-bold text-gray-900 uppercase">
                          {bus.placa}
                        </h3>
                        {bus.disponivel ? (
                          <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                            Disponível
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                            Indisponível
                          </span>
                        )}
                      </div>
                      
                      <div className="text-sm font-medium text-gray-800">
                        {bus.modelo}
                      </div>

                      {/* Informações em Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mt-3">
                        <div>
                          <span className="text-gray-500 block text-xs">Ano</span>
                          <div className="font-medium text-gray-900">{bus.ano || '-'}</div>
                        </div>
                        <div>
                          <span className="text-gray-500 block text-xs">Capacidade</span>
                          <div className="font-medium text-gray-900">{bus.capacidade_passageiros} lug.</div>
                        </div>
                        <div>
                          <span className="text-gray-500 block text-xs">Cor</span>
                          <div className="font-medium text-gray-900">{bus.cor || '-'}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ações (Editar) */}
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation(); // Impede o clique no botão de ativar o clique do card
                        // Aqui você pode manter a rota de edição como preferir, ex:
                        router.push(`/editar-onibus/${bus.id}`);
                      }}
                      className="text-blue-600 hover:bg-blue-50 p-2 rounded transition-colors"
                      title="Editar informações"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
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