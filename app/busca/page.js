// app/busca/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import InputCPF from '../components/InputCPF';
import CardViagem from '../components/CardViagem';
import { buscarPacientePorCpf, buscarPacientesPorNome, buscarViagensPorCpf } from '../data/mockData';
import { verificarAutenticacao, getNomeResumido } from '../utils/helpers';

/**
 * PÁGINA DE BUSCA DE PACIENTE
 * Permite buscar por nome ou CPF e listar viagens
 */
export default function BuscaPage() {
  const router = useRouter();
  const [busca, setBusca] = useState('');
  const [pacienteEncontrado, setPacienteEncontrado] = useState(null);
  const [viagens, setViagens] = useState([]);
  const [mensagem, setMensagem] = useState('');
  const [buscando, setBuscando] = useState(false);

  // Verifica autenticação
  useEffect(() => {
    verificarAutenticacao(router);
  }, [router]);

  // Detecta o tipo de busca baseado no conteúdo
  const getTipoBusca = () => {
    const buscarLimpa = busca.trim();
    // Se tiver apenas números, pontos ou traços, é CPF
    if (buscarLimpa.match(/^[\d.\-]+$/)) {
      return 'cpf';
    }
    // Caso contrário, é nome
    return 'nome';
  };

  const handleBuscar = () => {
    setMensagem('');
    setPacienteEncontrado(null);
    setViagens([]);

    if (!busca.trim()) {
      setMensagem('Digite um nome ou CPF para buscar');
      return;
    }

    setBuscando(true);

    // Simula delay de busca (para parecer mais realista)
    setTimeout(() => {
      let paciente = null;
      const tipoBusca = getTipoBusca();

      // Busca por CPF
      if (tipoBusca === 'cpf') {
        paciente = buscarPacientePorCpf(busca);
      } 
      // Busca por nome
      else {
        const pacientes = buscarPacientesPorNome(busca);
        if (pacientes.length > 0) {
          paciente = pacientes[0]; // Pega o primeiro resultado
        }
      }

      if (paciente) {
        setPacienteEncontrado(paciente);
        const viagensPaciente = buscarViagensPorCpf(paciente.cpf);
        setViagens(viagensPaciente);

        if (viagensPaciente.length === 0) {
          setMensagem('Paciente encontrado, mas não há viagens cadastradas.');
        }
      } else {
        setMensagem('Nenhum paciente encontrado com esse ' + (tipoBusca === 'cpf' ? 'CPF' : 'nome'));
      }

      setBuscando(false);
    }, 500);
  };

  const handleVerDetalhes = (viagem) => {
    router.push(`/viagem/${viagem.id}`);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleBuscar();
    }
  };

  const tipoBuscaAtual = getTipoBusca();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header titulo="Buscar Paciente" />

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Card de Busca */}
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
              <p className="text-xs text-gray-500 mt-2">
                {tipoBuscaAtual === 'cpf' ? '📋 Buscando por CPF' : '👤 Buscando por nome'}
              </p>
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
          </div>
        </div>

        {/* Mensagem de feedback */}
        {mensagem && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-6">
            {mensagem}
          </div>
        )}

        {/* Informações do paciente encontrado */}
        {pacienteEncontrado && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg">
                {getNomeResumido(pacienteEncontrado.nomeCompleto).charAt(0)}
              </div>
              <div>
                <div className="font-semibold text-gray-900">
                  {pacienteEncontrado.nomeCompleto}
                </div>
                <div className="text-sm text-gray-600">
                  CPF: {pacienteEncontrado.cpf}
                </div>
              </div>
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
                  key={viagem.id}
                  viagem={viagem}
                  onClick={() => handleVerDetalhes(viagem)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Estado vazio */}
        {!pacienteEncontrado && !mensagem && (
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