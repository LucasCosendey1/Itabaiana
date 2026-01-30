// app/onibus/[id]/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '../../components/Header';
import { verificarAutenticacao, formatarData, formatarHora, formatarStatus, getCorStatus } from '../../utils/helpers';

/**
 * PÁGINA DE DETALHES DO ÔNIBUS
 * Mostra ficha técnica e histórico de viagens do veículo
 * Baseado no layout de Pacientes
 */
export default function DetalhesOnibusPage() {
  const router = useRouter();
  const params = useParams();
  
  const [onibus, setOnibus] = useState(null);
  const [viagens, setViagens] = useState([]);
  const [expandido, setExpandido] = useState(true);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    const autenticado = verificarAutenticacao(router);
    if (autenticado) {
      carregarDados();
    }
  }, [router, params.id]);

  const carregarDados = async () => {
    try {
      // O ID vem da URL (ex: /onibus/1)
      const response = await fetch(`/api/onibus/${params.id}`);
      const data = await response.json();

      if (response.ok) {
        setOnibus(data.onibus);
        setViagens(data.viagens || []);
      } else {
        setErro(data.erro || 'Ônibus não encontrado');
      }
    } catch (error) {
      setErro('Erro ao carregar informações do veículo');
      console.error('Erro:', error);
    } finally {
      setCarregando(false);
    }
  };

  const handleGerarPDF = () => {
    alert('Relatório de manutenção e viagens do veículo será gerado em breve!');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ativo': return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">Operacional</span>;
      case 'manutencao': return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">Em Manutenção</span>;
      default: return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-semibold">Inativo</span>;
    }
  };

  if (carregando) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Carregando dados do veículo...</div>
      </div>
    );
  }

  if (erro || !onibus) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header titulo="Veículo não encontrado" mostrarVoltar voltarPara="/gerenciar-onibus" />
        <main className="container mx-auto px-4 py-6 max-w-2xl">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {erro || 'Ônibus não encontrado'}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header titulo="Detalhes do Veículo" mostrarVoltar voltarPara="/gerenciar-onibus" />

      <main className="container mx-auto px-4 py-6 max-w-4xl">

        {/* Botão Gerar PDF */}
        <div className="mb-6">
          <button
            onClick={handleGerarPDF}
            className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium shadow-md flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Relatório do Veículo
          </button>
        </div>

        {/* Card do Ônibus (Igual ao do Paciente) */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden mb-6">
          
          {/* Cabeçalho Expansível */}
          <div
            onClick={() => setExpandido(!expandido)}
            className="bg-gradient-to-r from-gray-700 to-gray-900 text-white p-6 cursor-pointer hover:from-gray-800 hover:to-black transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-white font-bold text-3xl border border-white/20">
                  🚌
                </div>
                <div>
                  <h1 className="text-2xl font-bold mb-1 uppercase tracking-wider">
                    {onibus.placa}
                  </h1>
                  <p className="text-gray-300 text-sm">
                    {expandido ? 'Clique para recolher ficha técnica' : 'Clique para ver detalhes do veículo'}
                  </p>
                </div>
              </div>
              
              <svg
                className={`w-6 h-6 transition-transform ${expandido ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Conteúdo Expansível */}
          <div
            className={`transition-all duration-300 overflow-hidden ${
              expandido ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="p-6 space-y-4">
              
              {/* Modelo e Marca */}
              <div className="pb-4 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                  Especificações
                </h3>
                <div className="flex items-center justify-between">
                    <p className="text-gray-900 text-lg font-medium">
                    {onibus.modelo} <span className="text-gray-500">• {onibus.marca}</span>
                    </p>
                    {getStatusBadge(onibus.status)}
                </div>
              </div>

              {/* Detalhes Técnicos */}
              <div className="pb-4 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                  Detalhes Técnicos
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <span className="text-xs text-gray-500 block">Ano de Fabricação</span>
                    <span className="text-gray-900 font-medium">{onibus.ano || '-'}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-gray-500 block">Capacidade</span>
                    <span className="text-gray-900 font-medium">{onibus.capacidade_passageiros} passageiros</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-gray-500 block">Cor</span>
                    <span className="text-gray-900 font-medium">{onibus.cor || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Observações */}
              {onibus.observacoes && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                    Observações
                  </h3>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="text-gray-700 text-sm">{onibus.observacoes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Rodapé do Card (visível quando recolhido) */}
          {!expandido && (
            <div className="p-6 text-center bg-gray-50">
              <p className="text-gray-500 text-sm">
                Modelo: {onibus.modelo} • Capacidade: {onibus.capacidade_passageiros} lug.
              </p>
            </div>
          )}
        </div>

        {/* Histórico de Viagens */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              Histórico de Viagens ({viagens.length})
            </h2>
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">
              Total
            </span>
          </div>
          
          {viagens.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              Nenhuma viagem registrada para este veículo.
            </div>
          ) : (
            <div className="space-y-3">
              {viagens.map((viagem) => {
                const statusClass = getCorStatus(viagem.status);
                return (
                  <div
                    key={viagem.id}
                    onClick={() => router.push(`/viagem/${viagem.id}`)}
                    className="border border-gray-200 rounded-lg p-4 hover:border-primary hover:shadow-sm transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                          {formatarData(viagem.data)} 
                          <span className="text-gray-400 text-xs font-normal">•</span> 
                          {formatarHora(viagem.horario)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Código: {viagem.codigo}
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusClass}`}>
                        {formatarStatus(viagem.status)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-700 mt-3">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="font-medium">Destino:</span> {viagem.destino}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>Motorista: {viagem.motorista}</span>
                    </div>
                    
                    <div className="mt-3 flex justify-end">
                         <span className="text-xs text-primary font-medium group-hover:underline">
                            Ver Detalhes →
                         </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Botão Voltar */}
        <div className="mt-6">
          <button
            onClick={() => router.back()}
            className="w-full py-4 rounded-lg font-medium transition-all bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            ← Voltar
          </button>
        </div>

      </main>
    </div>
  );
}