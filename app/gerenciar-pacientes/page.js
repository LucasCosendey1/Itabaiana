// app/gerenciar-pacientes/page.js
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import { verificarAutenticacao } from '../utils/helpers';

/**
 * PÁGINA DE GERENCIAMENTO DE PACIENTES
 * Lista pacientes com Paginação Local (20 por página)
 */
export default function GerenciarPacientesPage() {
  const router = useRouter();
  
  // ==========================================
  // CONFIGURAÇÕES
  // ==========================================
  const ITENS_POR_PAGINA = 20; // 🔥 Limite ajustado para 20

  // ==========================================
  // ESTADOS
  // ==========================================
  const [todosPacientes, setTodosPacientes] = useState([]); // Base de dados completa (20k)
  
  // Controle de Interface
  const [carregando, setCarregando] = useState(true);
  const [paginaAtual, setPaginaAtual] = useState(1);
  
  // Filtros
  const [busca, setBusca] = useState('');
  const [buscaDebounced, setBuscaDebounced] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroUBS, setFiltroUBS] = useState('todos');
  const [listaUBS, setListaUBS] = useState([]);

  // ==========================================
  // EFEITOS (Side Effects)
  // ==========================================

  // 1. Verificação de Autenticação e Carga Inicial
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

  // 2. Debounce da busca (Otimização para não travar digitando)
  useEffect(() => {
    const timer = setTimeout(() => {
      setBuscaDebounced(busca);
      setPaginaAtual(1); // Volta para a pág 1 se pesquisar
    }, 500);

    return () => clearTimeout(timer);
  }, [busca]);

  // 3. Resetar para página 1 se mudar filtros
  useEffect(() => {
    setPaginaAtual(1);
  }, [filtroStatus, filtroUBS]);

  // 4. Rolar para o topo ao mudar de página
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [paginaAtual]);

  // ==========================================
  // LÓGICA DE DADOS
  // ==========================================

  const carregarPacientes = async () => {
    try {
      setCarregando(true);
      const response = await fetch('/api/listar-pacientes-completo');
      const data = await response.json();

      if (response.ok) {
        setTodosPacientes(data.pacientes || []);
        
        // Extrair lista de UBS única para o filtro
        const ubsMap = new Map();
        data.pacientes.forEach(p => {
          if (p.ubs_id && p.ubs_nome && !ubsMap.has(p.ubs_id)) {
            ubsMap.set(p.ubs_id, { id: p.ubs_id, nome: p.ubs_nome });
          }
        });
        setListaUBS(Array.from(ubsMap.values()));
      }
    } catch (error) {
      console.error('Erro ao carregar pacientes:', error);
      alert('Erro ao carregar a lista de pacientes.');
    } finally {
      setCarregando(false);
    }
  };

  // 5. Filtragem Inteligente (Memoizada)
  // Só recalcula se os dados ou filtros mudarem
  const pacientesFiltradosTotal = useMemo(() => {
    let resultado = todosPacientes;

    // Filtro de Texto
    if (buscaDebounced.trim()) {
      const termo = buscaDebounced.toLowerCase();
      resultado = resultado.filter(p => 
        (p.nome_completo && p.nome_completo.toLowerCase().includes(termo)) ||
        (p.cpf && p.cpf.includes(termo)) ||
        (p.cartao_sus && p.cartao_sus.includes(termo))
      );
    }

    // Filtro de Status
    if (filtroStatus === 'ativos') {
      resultado = resultado.filter(p => p.ativo === true);
    } else if (filtroStatus === 'inativos') {
      resultado = resultado.filter(p => p.ativo === false);
    }

    // Filtro de UBS
    if (filtroUBS !== 'todos') {
      resultado = resultado.filter(p => p.ubs_id === parseInt(filtroUBS));
    }

    return resultado;
  }, [todosPacientes, buscaDebounced, filtroStatus, filtroUBS]);

  // 6. Paginação (O "Corte" dos dados para exibir)
  const pacientesExibidos = useMemo(() => {
    const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
    const fim = inicio + ITENS_POR_PAGINA;
    return pacientesFiltradosTotal.slice(inicio, fim);
  }, [pacientesFiltradosTotal, paginaAtual]);

  // 7. Estatísticas Gerais (Baseado no total carregado)
  const stats = useMemo(() => {
    const ativos = todosPacientes.filter(p => p.ativo).length;
    const totalViagens = todosPacientes.reduce((sum, p) => sum + (parseInt(p.total_viagens) || 0), 0);
    const comACS = todosPacientes.filter(p => p.agente_nome).length;
    return { ativos, totalViagens, comACS };
  }, [todosPacientes]);

  const totalPaginas = Math.ceil(pacientesFiltradosTotal.length / ITENS_POR_PAGINA);

  // ==========================================
  // RENDERIZAÇÃO
  // ==========================================

  if (carregando) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-gray-600">Carregando banco de dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <Header titulo="Gerenciar Pacientes" mostrarVoltar voltarPara="/cadastrar-paciente" />

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        
        {/* CARDS DE ESTATÍSTICAS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-3xl font-bold text-primary mb-1">{todosPacientes.length.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total de Pacientes</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-3xl font-bold text-green-600 mb-1">{stats.ativos.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Pacientes Ativos</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-3xl font-bold text-purple-600 mb-1">{stats.totalViagens.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total de Viagens</div>
          </div>
        </div>

        {/* BARRA DE FILTROS */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 sticky top-4 z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Busca */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Buscar</label>
              <div className="relative">
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Nome, CPF ou Cartão SUS..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="todos">Todos</option>
                <option value="ativos">Apenas Ativos</option>
                <option value="inativos">Apenas Inativos</option>
              </select>
            </div>

            {/* UBS */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">UBS</label>
              <select
                value={filtroUBS}
                onChange={(e) => setFiltroUBS(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="todos">Todas as Unidades</option>
                {listaUBS.map((ubs) => (
                  <option key={ubs.id} value={ubs.id}>{ubs.nome}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* CABEÇALHO DA LISTA E BOTÃO NOVO */}
        <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <p className="text-sm text-gray-600">
            Exibindo <strong>{pacientesExibidos.length}</strong> de <strong>{pacientesFiltradosTotal.length}</strong> resultados
            {buscaDebounced && <span> para "<strong>{buscaDebounced}</strong>"</span>}
          </p>
          <button
            onClick={() => router.push('/adicionar-paciente')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all text-sm font-bold shadow-sm flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Novo Paciente
          </button>
        </div>

        {/* LISTA DE PACIENTES */}
        {pacientesExibidos.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-16 text-center">
             <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             </div>
             <p className="text-lg font-medium text-gray-900">Nenhum paciente encontrado</p>
             <p className="text-gray-500">Tente ajustar os filtros de busca.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pacientesExibidos.map((paciente) => (
              <div
                key={paciente.paciente_id || paciente.cpf}
                onClick={() => router.push(`/paciente/${paciente.cpf.replace(/\D/g, '')}`)}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:border-primary hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1 overflow-hidden">
                    {/* Avatar */}
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg flex-shrink-0 border border-blue-200">
                      {paciente.nome_completo ? paciente.nome_completo.charAt(0) : '?'}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-base font-bold text-gray-900 truncate group-hover:text-primary transition-colors">
                          {paciente.nome_completo}
                        </h3>
                        {/* Tags de Status */}
                        {paciente.ativo ? (
                           <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 uppercase tracking-wide">Ativo</span>
                        ) : (
                           <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 uppercase tracking-wide">Inativo</span>
                        )}
                        {paciente.responsavel_familiar && (
                           <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 uppercase tracking-wide">Responsável</span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-2 gap-x-4 text-xs text-gray-600">
                        <div><span className="text-gray-400 block text-[10px] uppercase">CPF</span> {paciente.cpf}</div>
                        <div><span className="text-gray-400 block text-[10px] uppercase">SUS</span> {paciente.cartao_sus || '-'}</div>
                        <div><span className="text-gray-400 block text-[10px] uppercase">UBS</span> {paciente.ubs_nome || 'Sem UBS'}</div>
                        <div><span className="text-gray-400 block text-[10px] uppercase">Viagens</span> <span className="font-bold">{paciente.total_viagens || 0}</span></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center self-center pl-2 text-gray-300 group-hover:text-primary transition-colors">
                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CONTROLES DE PAGINAÇÃO */}
        {totalPaginas > 1 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 pt-6 border-t border-gray-200">
            
            <div className="text-sm text-gray-500">
              Página <strong>{paginaAtual}</strong> de <strong>{totalPaginas}</strong>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
                disabled={paginaAtual === 1}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 hover:text-primary transition-colors"
              >
                ← Anterior
              </button>
              
              {/* Paginação Numérica Simples */}
              <div className="hidden sm:flex gap-1">
                 {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                    // Lógica para mostrar páginas próximas da atual
                    let pageNum = paginaAtual - 2 + i;
                    if (paginaAtual <= 2) pageNum = i + 1;
                    if (paginaAtual >= totalPaginas - 2) pageNum = totalPaginas - 4 + i;
                    
                    if (pageNum > 0 && pageNum <= totalPaginas) {
                        return (
                            <button
                                key={pageNum}
                                onClick={() => setPaginaAtual(pageNum)}
                                className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-colors ${
                                    paginaAtual === pageNum 
                                    ? 'bg-primary text-white shadow-md' 
                                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                {pageNum}
                            </button>
                        );
                    }
                    return null;
                 })}
              </div>

              <button
                onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
                disabled={paginaAtual === totalPaginas}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 hover:text-primary transition-colors"
              >
                Próxima →
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}