// app/busca/page.js
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
          if (data.pacientes.length === 1) {
            // Se encontrou apenas 1, seleciona automaticamente
            const paciente = data.pacientes[0];
            setPacienteSelecionado(paciente);
            setViagens(paciente.viagens || []);
            
            if (!paciente.viagens || paciente.viagens.length === 0) {
              setMensagem('Paciente encontrado, mas não há viagens cadastradas.');
            }
          } else {
            // Se encontrou vários, mostra lista para escolher
            setPacientes(data.pacientes);
            setMensagem(`${data.pacientes.length} pacientes encontrados. Selecione um:`);
          }
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
    setPacientes([]);
    
    if (!paciente.viagens || paciente.viagens.length === 0) {
      setMensagem('Paciente selecionado, mas não há viagens cadastradas.');
    } else {
      setMensagem('');
    }
  };

  const handleVerDetalhes = (viagem) => {
    router.push(`/viagem/${viagem.codigo_viagem}`);
  };

  const handleKeyPress = (e) => {
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
        {usuarioLogado?.role !== 'paciente' && (
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
                  onKeyPress={handleKeyPress}
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

              {/* Botão Gerenciar Viagens - Apenas quando não está buscando */}
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

        {/* Lista de pacientes (quando encontra vários) */}
        {pacientes.length > 0 && (
          <div className="space-y-3 mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Selecione o paciente:
            </h2>
            {pacientes.map((paciente) => (
              <div
                key={paciente.cpf}
                onClick={() => handleSelecionarPaciente(paciente)}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:border-primary hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {getNomeResumido(paciente.nome_completo).charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {paciente.nome_completo}
                    </div>
                    <div className="text-sm text-gray-600">
                      CPF: {paciente.cpf}
                    </div>
                    <div className="text-sm text-gray-500">
                      {paciente.viagens?.length || 0} viagem(ns) cadastrada(s)
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Informações do paciente selecionado */}
        {pacienteSelecionado && usuarioLogado?.role !== 'paciente' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {getNomeResumido(pacienteSelecionado.nome_completo).charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">
                    {pacienteSelecionado.nome_completo}
                  </div>
                  <div className="text-sm text-gray-600">
                    CPF: {pacienteSelecionado.cpf}
                  </div>
                </div>
              </div>
              <button
                onClick={() => router.push(`/paciente/${pacienteSelecionado.cpf}`)}
                className="text-sm text-primary hover:text-primary-dark font-medium"
              >
                Ver perfil →
              </button>
            </div>
          </div>
        )}

        {/* Informações do próprio paciente */}
        {pacienteSelecionado && usuarioLogado?.role === 'paciente' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
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
              <button
                onClick={() => router.push(`/paciente/${pacienteSelecionado.cpf}`)}
                className="text-sm text-primary hover:text-primary-dark font-medium"
              >
                Meu perfil →
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
            <p className="text-gray-500 text-lg">
              Digite um nome ou CPF para buscar
            </p>
          </div>
        )}
      </main>
    </div>
  );
}