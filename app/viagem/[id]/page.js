// app/viagem/[id]/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '../../components/Header';
import { buscarViagemPorId, buscarPacientePorCpf, confirmarPresenca } from '../../data/mockData';
import { verificarAutenticacao, formatarData, formatarHora, formatarStatus, getCorStatus } from '../../utils/helpers';

/**
 * PÁGINA DE DETALHES DA VIAGEM
 * Mostra informações completas da viagem e permite confirmar presença
 */
export default function DetalhesViagemPage() {
  const router = useRouter();
  const params = useParams();
  const [viagem, setViagem] = useState(null);
  const [paciente, setPaciente] = useState(null);
  const [confirmando, setConfirmando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState('');

  useEffect(() => {
    verificarAutenticacao(router);

    // Busca dados da viagem
    const viagemEncontrada = buscarViagemPorId(params.id);
    if (viagemEncontrada) {
      setViagem(viagemEncontrada);
      const pacienteEncontrado = buscarPacientePorCpf(viagemEncontrada.cpfPaciente);
      setPaciente(pacienteEncontrado);
    } else {
      router.push('/busca');
    }
  }, [params.id, router]);

  const handleConfirmarPresenca = () => {
    if (viagem.status === 'confirmado') {
      return; // Já confirmado
    }

    setConfirmando(true);

    // Simula delay de processamento
    setTimeout(() => {
      const sucesso = confirmarPresenca(viagem.id);
      if (sucesso) {
        setViagem({ ...viagem, status: 'confirmado' });
        setMensagemSucesso('Presença confirmada com sucesso! ✓');
        setTimeout(() => setMensagemSucesso(''), 3000);
      }
      setConfirmando(false);
    }, 800);
  };

  const handleVerInfoPaciente = () => {
    router.push(`/paciente/${paciente.cpf}`);
  };

  if (!viagem || !paciente) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Carregando...</div>
      </div>
    );
  }

  const statusClass = getCorStatus(viagem.status);
  const podeConfirmar = viagem.status === 'pendente';

  return (
    <div className="min-h-screen bg-gray-50">
      <Header titulo="Detalhes da Viagem" mostrarVoltar voltarPara="/busca" />

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Mensagem de sucesso */}
        {mensagemSucesso && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {mensagemSucesso}
          </div>
        )}

        {/* Card Principal */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden mb-6">
          {/* Cabeçalho com status */}
          <div className="bg-gradient-to-r from-primary to-blue-600 text-white p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold mb-2">
                  {formatarData(viagem.dataViagem)}
                </h1>
                <div className="text-blue-100">
                  ID da viagem: {viagem.id}
                </div>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${statusClass}`}>
                {formatarStatus(viagem.status)}
              </span>
            </div>
          </div>

          {/* Informações do Paciente */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">
              Paciente
            </h2>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white font-bold text-2xl">
                {paciente.nomeCompleto.charAt(0)}
              </div>
              <div>
                <div className="font-semibold text-gray-900 text-lg">
                  {paciente.nomeCompleto}
                </div>
                <div className="text-sm text-gray-600">
                  CPF: {paciente.cpf}
                </div>
                <div className="text-sm text-gray-600">
                  Cartão SUS: {paciente.cartaoSus}
                </div>
              </div>
            </div>
          </div>

          {/* Informações da Viagem */}
          <div className="p-6 space-y-4">
            {/* Motivo */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">
                Motivo da Viagem
              </h3>
              <p className="text-gray-900 font-medium text-lg">
                {viagem.motivo}
              </p>
            </div>

            {/* Médico */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">
                Médico Responsável
              </h3>
              <p className="text-gray-900">
                {viagem.medico}
              </p>
            </div>

            {/* Horários */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">
                  Horário Saída
                </h3>
                <p className="text-primary font-bold text-xl">
                  {formatarHora(viagem.horarioViagem)}
                </p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">
                  Horário Consulta
                </h3>
                <p className="text-primary font-bold text-xl">
                  {formatarHora(viagem.horarioConsulta)}
                </p>
              </div>
            </div>

            {/* Hospital */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">
                Local de Destino
              </h3>
              <div className="flex items-start gap-2 text-gray-900">
                <svg 
                  className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" 
                  />
                </svg>
                <span>{viagem.hospital}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="space-y-3">
          {/* Botão Confirmar Presença */}
          {podeConfirmar && (
            <button
              onClick={handleConfirmarPresenca}
              disabled={confirmando}
              className={`w-full py-4 rounded-lg font-medium transition-all text-white shadow-md hover:shadow-lg ${
                confirmando
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {confirmando ? 'Confirmando...' : '✓ Confirmar Presença'}
            </button>
          )}

          {/* Botão Ver Informações do Paciente */}
          <button
            onClick={handleVerInfoPaciente}
            className="w-full py-4 rounded-lg font-medium transition-all bg-white text-primary border-2 border-primary hover:bg-blue-50"
          >
            📋 Mais Informações do Paciente
          </button>

          {/* Botão Voltar */}
          <button
            onClick={() => router.push('/busca')}
            className="w-full py-4 rounded-lg font-medium transition-all bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            ← Voltar para Busca
          </button>
        </div>
      </main>
    </div>
  );
}