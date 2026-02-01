'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import CardViagem from '../components/CardViagem';
import { verificarAutenticacao, getNomeResumido } from '../utils/helpers';

/**
 * PÁGINA DE BUSCA DE PACIENTE - CONECTADA AO BANCO
 * Administradores: podem buscar qualquer paciente
 * Pacientes: veem apenas suas próprias viagens
 */
export default function BuscaPage() {
  const router = useRouter();
  const [busca, setBusca] = useState('');
  const [pacientes, setPacientes] = useState([]);
  const [pacienteSelecionado, setPacienteSelecionado] = useState(null);
  const [viagens, setViagens] = useState([]);
  const [mensagem, setMensagem] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [usuarioLogado, setUsuarioLogado] = useState(null);

  // Verifica autenticação e tipo de usuário
  useEffect(() => {
    const autenticado = verificarAutenticacao(router);
    if (autenticado) {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (token) {
        const usuario = JSON.parse(token);
        setUsuarioLogado(usuario);
        
        // Se for paciente, busca automaticamente suas viagens
        if (usuario.role === 'paciente') {
          buscarMinhasViagens(usuario.cpf);
        }
      }
    }
  }, [router]);

  const buscarMinhasViagens = async (cpf) => {
    setBuscando(true);
    console.log('Buscando viagens para CPF:', cpf);
    
    try {
      const response = await fetch(`/api/buscar-paciente?busca=${encodeURIComponent(cpf)}`);
      const data = await response.json();

      console.log('Resposta da API:', data);

      if (response.ok && data.pacientes && data.pacientes.length > 0) {
        const paciente = data.pacientes[0];
        console.log('Paciente encontrado:', paciente);
        
        setPacienteSelecionado(paciente);
        setViagens(paciente.viagens || []);
        
        if (!paciente.viagens || paciente.viagens.length === 0) {
          setMensagem('Você ainda não tem viagens cadastradas.');
        } else {
          console.log(`${paciente.viagens.length} viagens encontradas`);
        }
      } else {
        console.error('Erro na resposta:', data);
        setMensagem(data.erro || 'Não foi possível carregar suas viagens. Verifique se você está cadastrado como paciente.');
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
      setMensagem('Erro ao conectar com o servidor. Tente novamente.');
    } finally {
      setBuscando(false);
    }
  };

  const handleBuscar = async () => {
    setMensagem('');
    setPacientes([]);
    setPacienteSelecionado(null);
    setViagens([]);

    if (!busca.trim()) {
      setMensagem('Digite um nome ou CPF para buscar');
      return;
    }

    setBuscando(true);

    try {
      const response = await fetch(`/api/buscar-paciente?busca=${encodeURIComponent(busca)}`);
      const data = await response.json();

      if (response.ok) {
        if (data.pacientes && data.pacientes.length > 0) {
          // SEMPRE mostra a lista de pacientes, nunca seleciona automaticamente
          setPacientes(data.pacientes);
          setMensagem(`${data.pacientes.length} paciente(s) encontrado(s). Clique em um para ver as viagens:`);
        } else {
          setMensagem('Nenhum paciente encontrado com esse nome ou CPF');
        }
      } else {
        setMensagem(data.erro || 'Erro ao buscar paciente');
      }
    } catch (error) {
      setMensagem('Erro ao conectar com o servidor');
      console.error('Erro:', error);
    } finally {
      setBuscando(false);
    }
  };

  const handleSelecionarPaciente = (paciente) => {
    setPacienteSelecionado(paciente);
    setViagens(paciente.viagens || []);
    setPacientes([]); // Limpa a lista de pacientes
    setBusca(''); // Limpa o campo de busca
    
    if (!paciente.viagens || paciente.viagens.length === 0) {
      setMensagem('Este paciente não possui viagens cadastradas.');
    } else {
      setMensagem('');
    }
  };

  const handleVoltarParaBusca = () => {
    setPacienteSelecionado(null);
    setViagens([]);
    setMensagem('');
    setBusca('');
  };

  const handleVerDetalhes = (viagem) => {
    // ✅ CORREÇÃO: Agora usa o CÓDIGO (V008) para padronizar a navegação
    // Se a API não mandar 'codigo_viagem', tenta 'codigo', senão usa o ID como último recurso
    const codigoParaLink = viagem.codigo_viagem || viagem.codigo || viagem.viagem_id;
    
    if (!codigoParaLink) {
        console.error("Erro: Código da viagem não encontrado no objeto:", viagem);
        alert("Erro ao abrir viagem: Código não identificado.");
        return;
    }

    router.push(`/viagem/${codigoParaLink}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleBuscar();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header titulo={usuarioLogado?.role === 'paciente' ? 'Minhas Viagens' : 'Buscar Paciente'} />

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Card de Perfil do Usuário Logado */}
        {usuarioLogado && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Foto genérica com inicial */}
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-md">
                  {usuarioLogado.nome?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-lg">
                    {usuarioLogado.nome}
                  </div>
                  <div className="text-sm text-gray-600">
                    CPF: {usuarioLogado.cpf}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 uppercase font-medium">
                    {usuarioLogado.role === 'administrador' ? 'Administrador' : 'Paciente'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => router.push(`/paciente/${usuarioLogado.cpf.replace(/\D/g, '')}`)}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-all text-sm font-medium shadow-sm"
              >
                {usuarioLogado.role === 'administrador' ? 'Ver Perfil' : 'Meus Dados'}
              </button>
            </div>
          </div>
        )}

        {/* Card de Busca - Apenas para administradores */}
        {usuarioLogado?.role !== 'paciente' && !pacienteSelecionado && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="space-y-4">
              {/* Input de busca */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar por Nome ou CPF
                </label>
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Digite o nome ou CPF do paciente"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                />
              </div>

              {/* Botão de buscar */}
              <button
                onClick={handleBuscar}
                disabled={buscando}
                className={`w-full py-3 rounded-lg font-medium transition-all ${
                  buscando
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : 'bg-primary hover:bg-primary-dark text-white shadow-md hover:shadow-lg'
                }`}
              >
                {buscando ? 'Buscando...' : 'Buscar Paciente'}
              </button>

              {/* Botões adicionais - Apenas quando não está buscando */}
              {!busca && !pacienteSelecionado && (
                <>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-2 bg-white text-gray-500">ou</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => router.push('/gerenciar-viagens')}
                    className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium shadow-md hover:shadow-lg"
                  >
                    Gerenciar Viagens
                  </button>
                  
                  <button
                    onClick={() => router.push('/cadastrar-paciente')}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Cadastrar Paciente
                  </button>

                  <button
                    onClick={() => router.push('/cadastrar-onibus')}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Cadastrar Veículo
                  </button>
                  <button
                  onClick={() => router.push('/cadastrar-motorista')}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Cadastrar Motorista
                </button>

                <button
                  onClick={() => router.push('/cadastrar-medico')}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Cadastrar Médico
                </button>

                <button
                  onClick={() => router.push('/cadastrar-hospital')}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Cadastrar Unidades médicas
                </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Mensagem de carregamento para pacientes */}
        {usuarioLogado?.role === 'paciente' && buscando && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 text-center">
            <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-gray-600">Carregando suas viagens...</p>
          </div>
        )}

        {/* Mensagem de feedback */}
        {mensagem && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="text-yellow-800 text-sm">{mensagem}</p>
                {usuarioLogado?.role === 'paciente' && (
                  <button
                    onClick={() => buscarMinhasViagens(usuarioLogado.cpf)}
                    className="mt-3 text-sm text-primary hover:text-primary-dark font-medium"
                  >
                    Tentar novamente
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Lista de pacientes encontrados (SEMPRE mostra quando houver resultados) */}
        {pacientes.length > 0 && (
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {pacientes.length} paciente(s) encontrado(s)
              </h2>
              <button
                onClick={() => setPacientes([])}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Limpar busca
              </button>
            </div>
            {pacientes.map((paciente) => (
              <div
                key={paciente.cpf}
                onClick={() => handleSelecionarPaciente(paciente)}
                className="bg-white border-2 border-gray-200 rounded-lg p-5 hover:border-primary hover:shadow-lg transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-14 h-14 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md group-hover:scale-110 transition-transform">
                      {getNomeResumido(paciente.nome_completo).charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 text-lg mb-1">
                        {paciente.nome_completo}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 2a1 1 0 00-1 1v1a1 1 0 002 0V3a1 1 0 00-1-1zM4 4h3a3 3 0 006 0h3a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm2.5 7a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm2.45 4a2.5 2.5 0 10-4.9 0h4.9zM12 9a1 1 0 100 2h3a1 1 0 100-2h-3zm-1 4a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" clipRule="evenodd" />
                          </svg>
                          CPF: {paciente.cpf}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                          </svg>
                          SUS: {paciente.cartao_sus}
                        </span>
                      </div>
                      <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {paciente.viagens?.length || 0} viagem(ns)
                      </div>
                    </div>
                  </div>
                  <svg className="w-6 h-6 text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Informações do paciente selecionado (para pacientes logados) */}
        {pacienteSelecionado && usuarioLogado?.role === 'paciente' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg">
                {getNomeResumido(pacienteSelecionado.nome_completo).charAt(0)}
              </div>
              <div>
                <div className="font-semibold text-gray-900">
                  Olá, {getNomeResumido(pacienteSelecionado.nome_completo)}!
                </div>
                <div className="text-sm text-gray-600">
                  Suas viagens cadastradas
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Informações do paciente selecionado (para administradores) */}
        {pacienteSelecionado && usuarioLogado?.role === 'administrador' && (
          <div className="bg-gradient-to-r from-primary to-blue-600 text-white rounded-lg shadow-lg p-6 mb-6">
            <button
              onClick={handleVoltarParaBusca}
              className="mb-4 flex items-center gap-2 text-blue-100 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Voltar para busca
            </button>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                  {getNomeResumido(pacienteSelecionado.nome_completo).charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-xl mb-1">
                    {pacienteSelecionado.nome_completo}
                  </div>
                  <div className="text-blue-100 text-sm">
                    CPF: {pacienteSelecionado.cpf} • SUS: {pacienteSelecionado.cartao_sus}
                  </div>
                </div>
              </div>
              <button
                onClick={() => router.push(`/paciente/${pacienteSelecionado.cpf.replace(/\D/g, '')}`)}
                className="px-4 py-2 bg-white text-primary rounded-lg hover:bg-blue-50 transition-all text-sm font-medium"
              >
                Ver perfil completo →
              </button>
            </div>
          </div>
        )}

        {/* Lista de viagens */}
        {viagens.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Viagens Cadastradas ({viagens.length})
            </h2>
            <div className="space-y-4">
              {viagens.map((viagem) => (
                <CardViagem
                  key={viagem.viagem_id}
                  viagem={viagem}
                  onClick={() => handleVerDetalhes(viagem)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Estado vazio */}
        {!pacienteSelecionado && pacientes.length === 0 && !mensagem && !buscando && usuarioLogado?.role !== 'paciente' && (
          <div className="text-center py-12">
            <svg
              className="w-24 h-24 text-gray-300 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <p className="text-gray-500 text-lg mb-2">
              Digite um nome ou CPF para buscar
            </p>
            <p className="text-gray-400 text-sm">
              Exemplo: "Lucas" ou "010.101.010-10"
            </p>
          </div>
        )}
      </main>
    </div>
  );
}