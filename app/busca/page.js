// app/busca/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import CardViagem from '../components/CardViagem';
import { verificarAutenticacao, getNomeResumido } from '../utils/helpers';

/**
 * PÁGINA DE BUSCA DE PACIENTE - CONECTADA AO BANCO
 */
export default function BuscaPage() {
  const router = useRouter();
  const [busca, setBusca] = useState('');
  const [pacientes, setPacientes] = useState([]);
  const [pacienteSelecionado, setPacienteSelecionado] = useState(null);
  const [viagens, setViagens] = useState([]);
  const [mensagem, setMensagem] = useState('');
  const [buscando, setBuscando] = useState(false);

  // Verifica autenticação
  useEffect(() => {
    verificarAutenticacao(router);
  }, [router]);

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
        {pacienteSelecionado && (
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
        {!pacienteSelecionado && pacientes.length === 0 && !mensagem && (
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