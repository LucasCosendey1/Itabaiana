//onibus/[id]/route.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '../../components/Header';
import { verificarAutenticacao, formatarData, formatarHora, formatarStatus, getCorStatus } from '../../utils/helpers';

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
    setCarregando(true);
    setErro('');

    try {
      const response = await fetch(`/api/onibus/${params.id}`);
      const data = await response.json();

      if (response.ok) {
        setOnibus(data.onibus);
        setViagens(data.viagens || []);
      } else {
        setErro(data.erro || 'Erro ao buscar dados do veículo');
      }
    } catch (error) {
      console.error('Erro de conexão:', error);
      setErro('Erro ao conectar com o servidor.');
    } finally {
      setCarregando(false);
    }
  };

  const handleGerarRelatorio = () => {
    window.print();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ativo': return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">Operacional</span>;
      case 'manutencao': return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">Em Manutenção</span>;
      default: return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-semibold">Inativo</span>;
    }
  };

  if (carregando) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 font-medium">Carregando dados...</p>
        </div>
    </div>
  );

  if (erro) return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center justify-center">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 mb-4 max-w-md text-center">
            <p className="font-bold">Ops!</p>
            <p>{erro}</p>
        </div>
        <button onClick={() => router.back()} className="text-blue-600 hover:underline">Voltar</button>
    </div>
  );

  if (!onibus) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-10 print:bg-white print:pb-0 print:pt-0">
      
      {/* ESTILOS DE IMPRESSÃO */}
      <style jsx global>{`
        @media print {
          @page { margin: 0; size: auto; }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; font-family: Arial, sans-serif; }
          .print-header-bg { background-color: #2563eb !important; color: white !important; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .break-inside-avoid { page-break-inside: avoid; }
        }
        .print-only { display: none; }
      `}</style>

      <div className="no-print">
         <Header titulo="Detalhes do Veículo" mostrarVoltar voltarPara="/gerenciar-onibus" />
      </div>

      {/* =================================================================================
          LAYOUT DO RELATÓRIO IMPRESSO (OCULTO NA TELA)
         ================================================================================= */}
      <div className="print-only w-full">
        
        {/* Cabeçalho Azul */}
        <div className="flex flex-col w-full print-header-bg py-6 px-8 mb-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white uppercase tracking-wide">Ficha do Veículo</h1>
                    <p className="text-blue-100 text-sm mt-1">Sistema de Gestão de TFD • Município de Itabaiana-PB</p>
                </div>
                <div className="text-right text-white/80 text-xs">
                    <p>Gerado em: {new Date().toLocaleDateString()}</p>
                    <p>{new Date().toLocaleTimeString()}</p>
                </div>
            </div>
        </div>

        <div className="px-8 pb-8">

            {/* Título Principal (Placa) */}
            <div className="mb-6 border-b-2 border-gray-200 pb-4 flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-black uppercase mb-1 tracking-wider">{onibus.placa}</h1>
                    <p className="text-gray-600 font-medium uppercase text-sm">
                       {onibus.modelo} • {onibus.marca}
                    </p>
                </div>
                <div className={`px-4 py-1 border-2 font-bold uppercase text-sm rounded ${
                    onibus.status === 'ativo' ? 'border-green-600 text-green-700' : 
                    onibus.status === 'manutencao' ? 'border-yellow-600 text-yellow-700' : 
                    'border-gray-400 text-gray-600'
                }`}>
                    {onibus.status === 'ativo' ? 'OPERACIONAL' : onibus.status === 'manutencao' ? 'EM MANUTENÇÃO' : 'INATIVO'}
                </div>
            </div>

            {/* SEÇÃO 1: DADOS TÉCNICOS */}
            <section className="mb-8">
                <h3 className="text-xs font-bold text-blue-600 uppercase mb-3 border-b border-blue-200 pb-1">
                    Especificações Técnicas
                </h3>
                <div className="grid grid-cols-3 gap-6 text-sm">
                    <div>
                        <span className="block text-gray-500 text-xs uppercase">Capacidade</span>
                        <strong className="text-gray-900 text-lg">{onibus.capacidade_passageiros} Passageiros</strong>
                    </div>
                    <div>
                        <span className="block text-gray-500 text-xs uppercase">Ano Fab.</span>
                        <strong className="text-gray-900">{onibus.ano || '-'}</strong>
                    </div>
                    <div>
                        <span className="block text-gray-500 text-xs uppercase">Cor</span>
                        <strong className="text-gray-900 uppercase">{onibus.cor || '-'}</strong>
                    </div>
                    <div className="col-span-3">
                         <span className="block text-gray-500 text-xs uppercase">Observações</span>
                         <p className="text-gray-800 italic border-l-2 border-gray-300 pl-2 mt-1">
                            {onibus.observacoes || 'Nenhuma observação registrada.'}
                         </p>
                    </div>
                </div>
            </section>

            {/* SEÇÃO 2: HISTÓRICO DE VIAGENS (ATUALIZADO COM NOVAS COLUNAS) */}
            <section className="mb-8 break-inside-avoid">
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 border-b pb-1">
                    Histórico de Viagens Realizadas ({viagens.length})
                </h3>
                {viagens.length === 0 ? (
                    <p className="text-sm text-gray-500 italic border border-dashed p-4 text-center rounded">Nenhuma viagem registrada para este veículo.</p>
                ) : (
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                            <tr>
                                <th className="px-2 py-2 border-b w-20">Data</th>
                                <th className="px-2 py-2 border-b">Destino</th>
                                <th className="px-2 py-2 border-b w-56">Motorista (Detalhes)</th>
                                <th className="px-2 py-2 border-b text-center w-16">Pax.</th>
                                <th className="px-2 py-2 border-b text-right w-24">Situação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {viagens.map((v) => (
                                <tr key={v.id || Math.random()}>
                                    <td className="px-2 py-2 font-medium align-top">
                                        {formatarData ? formatarData(v.data_viagem) : v.data_viagem}
                                        <div className="text-[10px] text-gray-500">{v.codigo || v.codigo_viagem}</div>
                                    </td>
                                    <td className="px-2 py-2 font-bold text-gray-800 align-top">{v.hospital_destino}</td>
                                    
                                    {/* COLUNA MOTORISTA DETALHADA */}
                                    <td className="px-2 py-2 text-gray-600 align-top">
                                        <div className="font-bold text-black">{v.motorista_nome || 'Não definido'}</div>
                                        <div className="text-[10px] mt-0.5">
                                            {v.motorista_cnh && <span>CNH: {v.motorista_cnh}</span>}
                                            {v.motorista_telefone && <span className="block">Tel: {v.motorista_telefone}</span>}
                                        </div>
                                    </td>

                                    {/* COLUNA PASSAGEIROS */}
                                    <td className="px-2 py-2 text-center align-top font-medium">
                                        {v.total_passageiros || v.numero_vagas_ocupadas || '-'}
                                    </td>

                                    <td className="px-2 py-2 text-right align-top">
                                        <span className={`text-[10px] font-bold uppercase ${
                                            v.status === 'cancelado' ? 'text-red-700' : 
                                            v.status === 'concluido' ? 'text-green-700' :
                                            'text-blue-700'
                                        }`}>
                                            {formatarStatus ? formatarStatus(v.status) : v.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>

            {/* RODAPÉ DO PDF */}
            <div className="mt-16 pt-8 border-t border-black break-inside-avoid">
                <div className="flex justify-between text-xs text-gray-600">
                    <div className="text-center w-1/3">
                        <div className="border-t border-black w-full mb-2"></div>
                        <p className="uppercase font-bold">Responsável pela Frota</p>
                        <p>Visto / Carimbo</p>
                    </div>
                    <div className="text-center w-1/3">
                        <div className="border-t border-black w-full mb-2"></div>
                        <p className="uppercase font-bold">Gestão TFD</p>
                        <p>Município de Itabaiana-PB</p>
                    </div>
                </div>
            </div>

        </div>
      </div>
      {/* FIM DO LAYOUT DE IMPRESSÃO */}


      {/* =================================================================================
          LAYOUT DE TELA (PADRÃO)
         ================================================================================= */}
      <main className="container mx-auto px-4 py-6 max-w-4xl no-print">

        {/* Botão Relatório */}
        <div className="mb-6 flex justify-end">
          <button
            onClick={handleGerarRelatorio}
            className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium shadow-md flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            Imprimir Relatório do Veículo
          </button>
        </div>

        {/* Card do Ônibus */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden mb-6">
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
                  <h1 className="text-2xl font-bold mb-1 uppercase tracking-wider">{onibus.placa}</h1>
                  <p className="text-gray-300 text-sm">{expandido ? 'Clique para recolher ficha técnica' : 'Clique para ver detalhes'}</p>
                </div>
              </div>
              <svg className={`w-6 h-6 transition-transform ${expandido ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>

          <div className={`transition-all duration-300 overflow-hidden ${expandido ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="p-6 space-y-6">
              <div className="pb-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-gray-900 text-xl font-bold">{onibus.modelo}</p>
                        <p className="text-gray-500 font-medium">{onibus.marca}</p>
                    </div>
                    {getStatusBadge(onibus.status)}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="space-y-1">
                    <span className="text-xs text-gray-500 block">Ano</span>
                    <span className="text-gray-900 font-bold text-lg">{onibus.ano || '-'}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-gray-500 block">Capacidade</span>
                    <span className="text-gray-900 font-bold text-lg">{onibus.capacidade_passageiros || 0} lug.</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-gray-500 block">Cor</span>
                    <span className="text-gray-900 font-bold text-lg capitalize">{onibus.cor || '-'}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-gray-500 block">ID do Sistema</span>
                    <span className="text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded text-sm">#{onibus.id}</span>
                  </div>
              </div>

              {onibus.observacoes && (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                  <p className="text-gray-700 text-sm italic">"{onibus.observacoes}"</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Histórico de Viagens (TELA) */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                Histórico de Viagens
                </h2>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">
                {viagens.length} Registros
                </span>
            </div>
            
            {viagens.length === 0 ? (
                <div className="text-center py-12 px-4 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <p>Nenhuma viagem registrada para este veículo no banco de dados.</p>
                </div>
            ) : (
                <div className="space-y-4">
                {viagens.map((viagem) => {
                    const statusClass = getCorStatus ? getCorStatus(viagem.status) : '';
                    
                    return (
                    <div
                        key={viagem.id}
                        onClick={() => router.push(`/viagem/${viagem.id}`)}
                        className="border border-gray-200 rounded-xl p-5 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group bg-white"
                    >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
                        <div>
                            <div className="font-bold text-gray-900 text-lg flex items-center gap-2">
                                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-sm font-mono">
                                {formatarData ? formatarData(viagem.data_viagem) : viagem.data_viagem}
                            </span>
                            <span className="text-gray-300">|</span>
                            {formatarHora ? formatarHora(viagem.horario_saida) : viagem.horario_saida}
                            </div>
                            <div className="text-xs text-gray-400 font-mono mt-1">
                            COD: {viagem.codigo || viagem.codigo_viagem || `#${viagem.id}`}
                            </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold text-center w-fit ${statusClass}`}>
                            {formatarStatus ? formatarStatus(viagem.status) : viagem.status}
                        </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                <span className="font-medium text-gray-500">Destino:</span>
                                <span className="font-semibold">{viagem.hospital_destino || 'Não informado'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                <span className="font-medium text-gray-500">Motorista:</span>
                                <span>{viagem.motorista_nome || 'Não informado'}</span>
                            </div>
                        </div>
                        
                        <div className="mt-4 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-xs text-blue-600 font-bold flex items-center gap-1">
                                Ver Detalhes da Viagem
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </span>
                        </div>
                    </div>
                    );
                })}
                </div>
            )}
        </div>

      </main>
    </div>
  );
}