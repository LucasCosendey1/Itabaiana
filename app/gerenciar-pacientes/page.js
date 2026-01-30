// app/gerenciar-pacientes/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import { verificarAutenticacao } from '../utils/helpers';

/**
 * PÁGINA DE GERENCIAMENTO DE PACIENTES
 * Lista todos os pacientes cadastrados
 */
export default function GerenciarPacientesPage() {
  const router = useRouter();
  const [pacientes, setPacientes] = useState([]);
  const [pacientesFiltrados, setPacientesFiltrados] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos'); // todos, ativos, inativos
  const [filtroUBS, setFiltroUBS] = useState('todos');
  const [listaUBS, setListaUBS] = useState([]);

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
    
    carregarPacientes();
  }, [router]);

  useEffect(() => {
    aplicarFiltros();
  }, [busca, filtroStatus, filtroUBS, pacientes]);

  const carregarPacientes = async () => {
    try {
      const response = await fetch('/api/listar-pacientes-completo');
      const data = await response.json();

      if (response.ok) {
        setPacientes(data.pacientes || []);
        setPacientesFiltrados(data.pacientes || []);
        
        // Extrair lista única de UBS
        const ubsUnicas = [...new Set(
          data.pacientes
            .filter(p => p.ubs_nome)
            .map(p => ({ id: p.ubs_id, nome: p.ubs_nome }))
            .map(ubs => JSON.stringify(ubs))
        )].map(ubs => JSON.parse(ubs));
        
        setListaUBS(ubsUnicas);
      }
    } catch (error) {
      console.error('Erro ao carregar pacientes:', error);
    } finally {
      setCarregando(false);
    }
  };

  const aplicarFiltros = () => {
    let resultado = [...pacientes];

    // Filtro de busca (nome, CPF, Cartão SUS)
    if (busca.trim()) {
      const buscaLower = busca.toLowerCase();
      resultado = resultado.filter(p => 
        p.nome_completo.toLowerCase().includes(buscaLower) ||
        p.cpf.includes(busca) ||
        (p.cartao_sus && p.cartao_sus.includes(busca))
      );
    }

    // Filtro de status
    if (filtroStatus === 'ativos') {
      resultado = resultado.filter(p => p.ativo === true);
    } else if (filtroStatus === 'inativos') {
      resultado = resultado.filter(p => p.ativo === false);
    }

    // Filtro de UBS
    if (filtroUBS !== 'todos') {
      resultado = resultado.filter(p => p.ubs_id === parseInt(filtroUBS));
    }

    setPacientesFiltrados(resultado);
  };

  const formatarData = (data) => {
    if (!data) return '';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  const calcularEstatisticas = () => {
    const ativos = pacientes.filter(p => p.ativo).length;
    const totalViagens = pacientes.reduce((sum, p) => sum + (parseInt(p.total_viagens) || 0), 0);
    const comAgenteComunitario = pacientes.filter(p => p.agente_nome).length;
    const responsaveisFamiliares = pacientes.filter(p => p.responsavel_familiar).length;
    
    return { ativos, totalViagens, comAgenteComunitario, responsaveisFamiliares };
  };

  const stats = calcularEstatisticas();

  if (carregando) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-gray-600">Carregando pacientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header titulo="Gerenciar Pacientes" mostrarVoltar voltarPara="/cadastrar-paciente" />

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-3xl font-bold text-primary mb-1">{pacientes.length}</div>
            <div className="text-sm text-gray-600">Total de Pacientes</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-3xl font-bold text-green-600 mb-1">{stats.ativos}</div>
            <div className="text-sm text-gray-600">Pacientes Ativos</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-3xl font-bold text-purple-600 mb-1">{stats.totalViagens}</div>
            <div className="text-sm text-gray-600">Total de Viagens</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-3xl font-bold text-blue-600 mb-1">{stats.comAgenteComunitario}</div>
            <div className="text-sm text-gray-600">Com ACS Vinculado</div>
          </div>
        </div>

        {/* Filtros e Busca */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Busca */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar
              </label>
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Nome, CPF ou Cartão SUS"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
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
                <option value="ativos">Ativos</option>
                <option value="inativos">Inativos</option>
              </select>
            </div>

            {/* Filtro UBS */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                UBS
              </label>
              <select
                value={filtroUBS}
                onChange={(e) => setFiltroUBS(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              >
                <option value="todos">Todas as UBS</option>
                {listaUBS.map((ubs) => (
                  <option key={ubs.id} value={ubs.id}>
                    {ubs.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Resultado */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {pacientesFiltrados.length} paciente(s) encontrado(s)
          </p>
          <button
            onClick={() => router.push('/adicionar-paciente')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all text-sm font-medium"
          >
            + Novo Paciente
          </button>
        </div>

        {/* Lista de Pacientes */}
        {pacientesFiltrados.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-gray-500 mb-2">Nenhum paciente encontrado</p>
            <p className="text-sm text-gray-400">Ajuste os filtros ou cadastre um novo paciente</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pacientesFiltrados.map((paciente) => (
              <div
                key={paciente.paciente_id}
                onClick={() => router.push(`/paciente/${paciente.cpf.replace(/\D/g, '')}`)}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  
                  {/* Informações Principais */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-xl flex-shrink-0">
                      {paciente.nome_completo.charAt(0)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {paciente.nome_completo}
                        </h3>
                        
                        {/* Badges de Status */}
                        <div className="flex items-center gap-2">
                          {paciente.ativo ? (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                              Ativo
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                              Inativo
                            </span>
                          )}
                          
                          {paciente.responsavel_familiar && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                              Resp. Familiar
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Informações em Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">CPF:</span>
                          <div className="font-medium text-gray-900">{paciente.cpf}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Cartão SUS:</span>
                          <div className="font-medium text-gray-900">{paciente.cartao_sus}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Idade:</span>
                          <div className="font-medium text-gray-900">{paciente.idade} anos</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Sexo:</span>
                          <div className="font-medium text-gray-900">{paciente.sexo || '-'}</div>
                        </div>
                      </div>

                      {/* UBS e ACS */}
                      {(paciente.ubs_nome || paciente.agente_nome) && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            {paciente.ubs_nome && (
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                                </svg>
                                <span className="text-gray-600">UBS:</span>
                                <span className="font-medium text-gray-900">{paciente.ubs_nome}</span>
                              </div>
                            )}
                            {paciente.agente_nome && (
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                </svg>
                                <span className="text-gray-600">ACS:</span>
                                <span className="font-medium text-gray-900">{paciente.agente_nome}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Estatísticas de Viagens */}
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          <div>
                            <span className="font-semibold text-gray-900">{paciente.total_viagens || 0}</span> viagens
                          </div>
                          {parseInt(paciente.viagens_pendentes) > 0 && (
                            <div>
                              <span className="font-semibold text-yellow-600">{paciente.viagens_pendentes}</span> pendentes
                            </div>
                          )}
                          {parseInt(paciente.viagens_concluidas) > 0 && (
                            <div>
                              <span className="font-semibold text-green-600">{paciente.viagens_concluidas}</span> concluídas
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Seta */}
                  <svg className="w-6 h-6 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}