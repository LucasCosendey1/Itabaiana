'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import CardViagem from '../components/CardViagem';
import InputCPF from '../components/InputCPF';
import CalendarioViagens from '../components/CalendarioViagens';
import RelatorioViagens from '../components/RelatorioViagens';
import { verificarAutenticacao, getNomeResumido } from '../utils/helpers';

export default function BuscaPage() {
  const router = useRouter();
  const [montado, setMontado] = useState(false);
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [busca, setBusca] = useState('');
  const [pacientes, setPacientes] = useState([]);
  const [pacienteSelecionado, setPacienteSelecionado] = useState(null);
  const [viagens, setViagens] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [mensagem, setMensagem] = useState('');
  
  // Estados para o calendário e relatório
  const [dataSelecionada, setDataSelecionada] = useState(null);
  const [mostrarRelatorio, setMostrarRelatorio] = useState(false);

  useEffect(() => {
    setMontado(true);
    const autenticado = verificarAutenticacao(router);
    if (autenticado) {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (token) {
        try {
          const usuario = JSON.parse(token);
          if (usuario.role) {
            usuario.role = usuario.role.toLowerCase();
          }
          setUsuarioLogado(usuario);
          
          // ✅ CARREGAR VIAGENS AUTOMATICAMENTE PARA CADA TIPO DE USUÁRIO
          if (usuario.role === 'paciente') {
            buscarViagensUsuario(usuario.cpf, 'paciente');
          } else if (usuario.role === 'motorista') {
            buscarViagensUsuario(usuario.cpf, 'motorista');
          } else if (usuario.role === 'medico') {
            buscarViagensUsuario(usuario.cpf, 'medico');
          }
        } catch (e) {
          console.error("Erro ao ler dados do usuário", e);
        }
      }
    }
  }, [router]);

  // ✅ FUNÇÃO UNIVERSAL PARA BUSCAR VIAGENS (PACIENTE, MOTORISTA OU MÉDICO)
  const buscarViagensUsuario = async (cpf, tipoUsuario) => {
    setBuscando(true);
    setMensagem('');
    try {
      const cpfLimpo = cpf.replace(/\D/g, '');
      let endpoint = '';
      
      // Define o endpoint correto baseado no tipo de usuário
      if (tipoUsuario === 'paciente') {
        endpoint = `/api/paciente/${cpfLimpo}`;
      } else if (tipoUsuario === 'motorista') {
        endpoint = `/api/motorista/${cpfLimpo}/viagens`;
      } else if (tipoUsuario === 'medico') {
        endpoint = `/api/medico/${cpfLimpo}/viagens`;
      }
      
      const response = await fetch(endpoint);
      const data = await response.json();

      if (response.ok) {
        if (tipoUsuario === 'paciente' && data.paciente) {
          setPacienteSelecionado(data.paciente);
          setViagens(data.paciente.viagens || []);
          if (!data.paciente.viagens || data.paciente.viagens.length === 0) {
            setMensagem('Você não possui viagens cadastradas.');
          }
        } else if (tipoUsuario === 'motorista' && data.viagens) {
          setViagens(data.viagens || []);
          if (data.viagens.length === 0) {
            setMensagem('Você não possui viagens atribuídas.');
          }
        } else if (tipoUsuario === 'medico' && data.viagens) {
          setViagens(data.viagens || []);
          if (data.viagens.length === 0) {
            setMensagem('Você não possui consultas agendadas.');
          }
        } else {
          setMensagem('Não foi possível carregar suas viagens.');
        }
      } else {
        setMensagem(data.erro || 'Não foi possível carregar suas viagens.');
      }
    } catch (error) {
      setMensagem('Erro ao conectar com o servidor.');
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
      return; 
    }

    setBuscando(true);

    try {
      const response = await fetch(`/api/buscar-paciente?busca=${encodeURIComponent(busca)}`);
      const data = await response.json();

      if (response.ok) {
        if (data.pacientes && data.pacientes.length > 0) {
          setPacientes(data.pacientes);
          setMensagem(`${data.pacientes.length} paciente(s) encontrado(s).`);
        } else {
          setMensagem('Nenhum paciente encontrado.');
        }
      } else {
        setMensagem(data.erro || 'Erro ao buscar.');
      }
    } catch (error) {
      setMensagem('Erro ao conectar.');
    } finally {
      setBuscando(false);
    }
  };

  const handleSelecionarPaciente = (paciente) => {
    setPacienteSelecionado(paciente);
    setViagens(paciente.viagens || []);
    setPacientes([]);
    setBusca('');
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
    const codigoParaLink = viagem.codigo_viagem || viagem.codigo || viagem.viagem_id;
    if (!codigoParaLink) {
        alert("Erro ao abrir viagem: Código não identificado.");
        return;
    }
    router.push(`/viagem/${codigoParaLink}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleBuscar();
  };

  const handleSelecionarDataCalendario = (data) => {
    setDataSelecionada(data);
    setMostrarRelatorio(true);
  };

  const handleFecharRelatorio = () => {
    setMostrarRelatorio(false);
    setDataSelecionada(null);
  };

  // ✅ FUNÇÃO PARA REDIRECIONAR PARA O PERFIL CORRETO
  const irParaPerfil = () => {
  if (!usuarioLogado) return;
  
  if (usuarioLogado.role === 'paciente') {
    const cpfLimpo = usuarioLogado.cpf.replace(/\D/g, '');
    router.push(`/paciente/${cpfLimpo}`);
  } else if (usuarioLogado.role === 'motorista') {
    // ✅ Vai pelo ID em vez de CPF (porque a página espera ID)
    // O ID do motorista deve estar no token do usuário
    const motoristaId = usuarioLogado.motorista_id || usuarioLogado.id;
    router.push(`/motorista/${motoristaId}`);
  } else if (usuarioLogado.role === 'medico') {
    const medicoId = usuarioLogado.medico_id || usuarioLogado.id;
    router.push(`/medico/${medicoId}`);
  } else if (usuarioLogado.role === 'administrador') {
    const cpfLimpo = usuarioLogado.cpf.replace(/\D/g, '');
    router.push(`/paciente/${cpfLimpo}`);
  }
 else if (usuarioLogado.role === 'medico') {
      router.push(`/medico/${cpfLimpo}`);
    } else if (usuarioLogado.role === 'administrador') {
      router.push(`/paciente/${cpfLimpo}`); // Admin pode ver como paciente ou ter página própria
    }
  };

  // ✅ FUNÇÃO PARA OBTER O TÍTULO CORRETO DA PÁGINA
  const getTituloPagina = () => {
    if (!usuarioLogado) return 'Carregando...';
    
    if (usuarioLogado.role === 'paciente') return 'Minhas Viagens';
    if (usuarioLogado.role === 'motorista') return 'Minhas Viagens como Motorista';
    if (usuarioLogado.role === 'medico') return 'Minhas Consultas Agendadas';
    if (usuarioLogado.role === 'administrador') return 'Buscar Paciente';
    
    return 'Início';
  };

  // ✅ FUNÇÃO PARA OBTER O LABEL DO PERFIL
  const getLabelPerfil = () => {
    if (!usuarioLogado) return 'Perfil';
    
    if (usuarioLogado.role === 'administrador') return 'Ver Perfil';
    return 'Meu Perfil';
  };

  if (!montado) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header titulo={getTituloPagina()} />

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        
        {/* Card de Perfil - ATUALIZADO */}
        {usuarioLogado && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
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
                    {usuarioLogado.role === 'administrador' && 'Administrador'}
                    {usuarioLogado.role === 'paciente' && 'Paciente'}
                    {usuarioLogado.role === 'motorista' && 'Motorista'}
                    {usuarioLogado.role === 'medico' && 'Médico'}
                  </div>
                </div>
              </div>
              <button
                onClick={irParaPerfil}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-all text-sm font-medium shadow-sm"
              >
                {getLabelPerfil()}
              </button>
            </div>
          </div>
        )}

        {/* BARRA DE BUSCA - SÓ PARA ADMINISTRADOR */}
        {usuarioLogado?.role === 'administrador' && !pacienteSelecionado && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar Paciente
            </label>
            <div className="flex gap-3">
              <div className="flex-1">
                <InputCPF
                  value={busca}
                  onChange={setBusca}
                  onKeyDown={handleKeyDown}
                  placeholder="Digite o CPF ou Nome"
                  disabled={buscando}
                />
              </div>
              <button
                onClick={handleBuscar}
                disabled={buscando}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-all font-medium shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {buscando ? 'Buscando...' : 'Buscar'}
              </button>
            </div>
          </div>
        )}

        {/* BOTÕES ADMINISTRATIVOS - SÓ PARA ADMINISTRADOR */}
        {usuarioLogado?.role === 'administrador' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
              Painel Administrativo
            </h3>
            <div className="space-y-3">
              
              <button
                onClick={() => router.push('/gerenciar-viagens')}
                className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Gerenciar Viagens
              </button>

              <button onClick={() => router.push('/cadastrar-paciente')} className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium shadow-md hover:shadow-lg flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                Cadastrar Paciente
              </button>

              <button onClick={() => router.push('/cadastrar-onibus')} className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium shadow-md hover:shadow-lg flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                Cadastrar Veículo
              </button>

              <button onClick={() => router.push('/cadastrar-motorista')} className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium shadow-md hover:shadow-lg flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                Cadastrar Motorista
              </button>

              <button onClick={() => router.push('/cadastrar-medico')} className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium shadow-md hover:shadow-lg flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Cadastrar Médico
              </button>

              <button onClick={() => router.push('/cadastrar-hospital')} className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium shadow-md hover:shadow-lg flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                Cadastrar Unidades de Saúde
              </button>
            </div>
          </div>
        )}

        {/* Mensagens e Loading */}
        {buscando && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 text-center">
            <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-gray-600">Carregando viagens...</p>
          </div>
        )}

        {mensagem && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              <div className="flex-1">
                <p className="text-yellow-800 text-sm">{mensagem}</p>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Pacientes Encontrados - SÓ ADMIN */}
        {pacientes.length > 0 && (
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">Pacientes Encontrados</h2>
              <button onClick={() => setPacientes([])} className="text-sm text-gray-600 hover:text-gray-900">Limpar</button>
            </div>
            {pacientes.map((paciente) => (
              <button
                key={paciente.paciente_id || paciente.id || paciente.cpf}
                onClick={() => handleSelecionarPaciente(paciente)}
                className="w-full bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:border-primary hover:shadow-md transition-all text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {getNomeResumido(paciente.nome_completo).charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{paciente.nome_completo}</div>
                      <div className="text-sm text-gray-600">CPF: {paciente.cpf}</div>
                      <div className="text-xs text-gray-500 mt-1">{paciente.viagens?.length || 0} viagem(ns) cadastrada(s)</div>
                    </div>
                  </div>
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Header do Paciente Selecionado - SÓ ADMIN */}
        {pacienteSelecionado && usuarioLogado?.role === 'administrador' && (
          <div className="bg-gradient-to-r from-primary to-blue-600 text-white rounded-lg shadow-lg p-6 mb-6">
            <button onClick={handleVoltarParaBusca} className="mb-4 flex items-center gap-2 text-blue-100 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Voltar para busca
            </button>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                  {getNomeResumido(pacienteSelecionado.nome_completo).charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-xl mb-1">{pacienteSelecionado.nome_completo}</div>
                  <div className="text-blue-100 text-sm">CPF: {pacienteSelecionado.cpf} • SUS: {pacienteSelecionado.cartao_sus}</div>
                </div>
              </div>
              <button onClick={() => router.push(`/paciente/${pacienteSelecionado.cpf.replace(/\D/g, '')}`)} className="px-4 py-2 bg-white text-primary rounded-lg hover:bg-blue-50 transition-all text-sm font-medium">Ver perfil</button>
            </div>
          </div>
        )}

        {/* Contador de Viagens - PARA TODOS OS USUÁRIOS NÃO-ADMIN */}
        {usuarioLogado?.role !== 'administrador' && viagens.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <div>
                  <div className="font-bold text-gray-900 text-lg">{viagens.length}</div>
                  <div className="text-sm text-gray-600">
                    {usuarioLogado.role === 'paciente' && 'Suas viagens cadastradas'}
                    {usuarioLogado.role === 'motorista' && 'Viagens atribuídas a você'}
                    {usuarioLogado.role === 'medico' && 'Consultas agendadas'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Viagens */}
        {viagens.length > 0 && (
          <div className="mb-6 animate-fadeIn">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {usuarioLogado?.role === 'administrador' && `Viagens Cadastradas (${viagens.length})`}
              {usuarioLogado?.role === 'paciente' && `Suas Viagens (${viagens.length})`}
              {usuarioLogado?.role === 'motorista' && `Suas Viagens como Motorista (${viagens.length})`}
              {usuarioLogado?.role === 'medico' && `Suas Consultas (${viagens.length})`}
            </h2>
            <div className="space-y-4">
              {viagens.map((viagem) => (
                <CardViagem key={viagem.viagem_id} viagem={viagem} onClick={() => handleVerDetalhes(viagem)} />
              ))}
            </div>
          </div>
        )}

        {/* CALENDÁRIO DE VIAGENS - SÓ ADMIN */}
        {usuarioLogado?.role === 'administrador' && (
          <div className="mt-8">
            <CalendarioViagens onSelecionarData={handleSelecionarDataCalendario} />
          </div>
        )}
      </main>

      {/* MODAL DE RELATÓRIO */}
      {mostrarRelatorio && dataSelecionada && (
        <RelatorioViagens 
          data={dataSelecionada} 
          onFechar={handleFecharRelatorio} 
        />
      )}
    </div>
  );
}