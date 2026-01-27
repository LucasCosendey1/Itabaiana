// app/viagem/[id]/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '../../components/Header';
import { verificarAutenticacao, formatarData, formatarHora, formatarStatus, getCorStatus } from '../../utils/helpers';

/**
 * PÁGINA DE DETALHES DA VIAGEM - FOCO NA VIAGEM
 */
export default function DetalhesViagemPage() {
  const router = useRouter();
  const params = useParams();
  const [viagem, setViagem] = useState(null);
  const [pacientes, setPacientes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    verificarAutenticacao(router);
    carregarViagem();
  }, [params.id, router]);

  const carregarViagem = async () => {
    try {
      const response = await fetch(`/api/viagem-detalhes/${params.id}`);
      const data = await response.json();

      console.log('Dados da viagem:', data);

      if (response.ok) {
        setViagem(data.viagem);
        setPacientes(data.pacientes || []);
      } else {
        setErro(data.erro || 'Viagem não encontrada');
      }
    } catch (error) {
      setErro('Erro ao carregar viagem');
      console.error('Erro:', error);
    } finally {
      setCarregando(false);
    }
  };

  const handleAdicionarPaciente = () => {
    router.push(`/adicionar-paciente/${params.id}`);
  };

  const handleVerPaciente = (cpf) => {
    const cpfLimpo = cpf.replace(/\D/g, '');
    router.push(`/paciente/${cpfLimpo}`);
  };

  if (carregando) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Carregando...</div>
      </div>
    );
  }

  if (erro || !viagem) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header titulo="Viagem não encontrada" mostrarVoltar voltarPara="/gerenciar-viagens" />
        <main className="container mx-auto px-4 py-6 max-w-2xl">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {erro || 'Viagem não encontrada'}
          </div>
        </main>
      </div>
    );
  }

  const statusClass = getCorStatus(viagem.status);
  const totalPacientes = pacientes.length;
  const vagasDisponiveis = viagem.numero_vagas - totalPacientes;
  const viagemLotada = vagasDisponiveis <= 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header titulo="Detalhes da Viagem" mostrarVoltar voltarPara="/gerenciar-viagens" />

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        
        {/* Card Principal da Viagem */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden mb-6">


{/* Cabeçalho */}
<div className="bg-gradient-to-r from-primary to-blue-600 text-white p-6">
  <div className="mb-4">
    {/* Data e Horário em destaque */}
    <div className="flex items-center gap-3 mb-3">
      <div>
        <div className="text-xs text-blue-100 uppercase tracking-wide mb-1">
          Data
        </div>
        <div className="text-2xl font-bold">
          {formatarData(viagem.data_viagem)}
        </div>
      </div>
      
      <div className="text-blue-200 text-3xl">•</div>
      
      <div>
        <div className="text-xs text-blue-100 uppercase tracking-wide mb-1">
          Saída
        </div>
        <div className="text-2xl font-bold">
          {formatarHora(viagem.horario_saida)}
        </div>
      </div>
    </div>
    
    <div className="flex items-center justify-between">
      <div className="text-blue-100 text-sm">
        Código: {viagem.codigo_viagem}
      </div>
      <span className={`px-4 py-2 rounded-full text-sm font-medium ${statusClass}`}>
        {formatarStatus(viagem.status)}
      </span>
    </div>
  </div>
</div>


          {/* Informações da Viagem */}
          <div className="p-6 space-y-4">
            
            {/* Horário */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">
                  Horário de Saída
                </h3>
                <p className="text-primary font-bold text-xl">
                  {formatarHora(viagem.horario_saida)}
                </p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">
                  Vagas
                </h3>
                <p className="text-primary font-bold text-xl">
                  {totalPacientes} / {viagem.numero_vagas}
                </p>
                {vagasDisponiveis > 0 ? (
                  <p className="text-xs text-green-600 mt-1">
                    {vagasDisponiveis} disponível{vagasDisponiveis !== 1 ? 'is' : ''}
                  </p>
                ) : (
                  <p className="text-xs text-red-600 mt-1">Lotada</p>
                )}
              </div>
            </div>

            {/* Hospital */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">
                Hospital de Destino
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
                <div>
                  <p className="font-medium">{viagem.hospital_destino}</p>
                  {viagem.endereco_destino && (
                    <p className="text-sm text-gray-600">{viagem.endereco_destino}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Motorista */}
            {viagem.motorista_nome && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                  Motorista
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {viagem.motorista_nome.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {viagem.motorista_nome}
                      </div>
                      {viagem.veiculo_modelo && (
                        <div className="text-sm text-gray-600">
                          {viagem.veiculo_modelo} - {viagem.veiculo_placa}
                        </div>
                      )}
                      {viagem.motorista_telefone && (
                        <div className="text-sm text-gray-600">
                          Tel: {viagem.motorista_telefone}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Ônibus */}
        {viagem.onibus_placa && (
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
              Ônibus
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">
                    Placa: {viagem.onibus_placa}
                  </div>
                  <div className="text-sm text-gray-600">
                    {viagem.onibus_modelo} ({viagem.onibus_ano})
                  </div>
                  <div className="text-sm text-gray-500">
                    {viagem.onibus_capacidade} lugares • {viagem.onibus_cor}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Pacientes */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Pacientes ({totalPacientes})
            </h2>
          </div>

          {pacientes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p>Nenhum paciente cadastrado nesta viagem</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pacientes.map((paciente) => (
                <div
                  key={paciente.paciente_id}
                  onClick={() => handleVerPaciente(paciente.cpf)}
                  className="border border-gray-200 rounded-lg p-4 hover:border-primary hover:shadow-sm transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {paciente.nome_completo.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 truncate">
                        {paciente.nome_completo}
                      </div>
                      <div className="text-sm text-gray-600">
                        CPF: {paciente.cpf}
                      </div>
                      {paciente.motivo && (
                        <div className="text-sm text-gray-500 mt-1 truncate">
                          {paciente.motivo}
                        </div>
                      )}
                    </div>
                    <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Botões de Ação */}
        <div className="space-y-3">
          {/* Botão Adicionar Paciente */}
          <button
            onClick={handleAdicionarPaciente}
            disabled={viagemLotada}
            className={`w-full py-4 rounded-lg font-semibold transition-all ${
              viagemLotada
                ? 'bg-gray-400 cursor-not-allowed text-white'
                : 'bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg'
            }`}
          >
            {viagemLotada ? 'Viagem Lotada' : '+ Adicionar Paciente à Viagem'}
          </button>

          {/* Botão Voltar */}
          <button
            onClick={() => router.push('/gerenciar-viagens')}
            className="w-full py-4 rounded-lg font-medium transition-all bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            Voltar para Gerenciar Viagens
          </button>
        </div>
      </main>
    </div>
  );
}