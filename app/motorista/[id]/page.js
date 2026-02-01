'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '../../components/Header';
import { verificarAutenticacao, formatarData, formatarHora, formatarStatus, getCorStatus } from '../../utils/helpers';

export default function InfoMotoristaPage() {
  const router = useRouter();
  const params = useParams();
  
  const [motorista, setMotorista] = useState(null);
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
      const response = await fetch(`/api/motorista/${params.id}`);
      const data = await response.json();

      if (response.ok) {
        setMotorista(data.motorista);
        setViagens(data.viagens || []);
      } else {
        setErro(data.erro || 'Motorista não encontrado');
      }
    } catch (error) {
      setErro('Erro ao carregar informações do motorista');
    } finally {
      setCarregando(false);
    }
  };

  const handleGerarRelatorio = () => {
    window.print();
  };

  // Função auxiliar para garantir que pegamos o ID correto da viagem
  // Resolve o problema do link "undefined"
  const getIdentificadorViagem = (v) => {
      return v.codigo_viagem || v.codigo || v.id;
  };

  const getStatusBadge = (ativo, disponivel) => {
    if (!ativo) return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">Inativo</span>;
    if (disponivel) return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">Disponível</span>;
    return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">Em Viagem</span>;
  };

  // Separação de Viagens para o Relatório
  // Regra: Pendente/Agendado vai para "Futuras". Concluido/Cancelado ou data passada vai para "Realizadas".
  const viagensAgendadas = viagens.filter(v => (v.status === 'pendente' || v.status === 'agendado'));
  const viagensRealizadas = viagens.filter(v => (v.status === 'concluido' || v.status === 'confirmado' || v.status === 'cancelado'));

  if (carregando) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">Carregando...</div>;
  if (erro || !motorista) return <div className="min-h-screen bg-gray-50 p-6 text-red-600">{erro || 'Erro'}</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-10 print:bg-white print:pb-0">
      
      {/* ESTILOS DE IMPRESSÃO */}
      <style jsx global>{`
        @media print {
          @page { margin: 10mm; size: A4; }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; font-family: Arial, sans-serif; color: #000; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .print-bg-blue { background-color: #eff6ff !important; }
          .print-header-bg { background-color: #2563eb !important; color: white !important; }
          .print-row:nth-child(even) { background-color: #f9fafb !important; }
        }
        .print-only { display: none; }
      `}</style>

      <div className="no-print">
        <Header titulo="Detalhes do Motorista" mostrarVoltar voltarPara="/gerenciar-motoristas" />
      </div>

      {/* =================================================================================
          LAYOUT DO RELATÓRIO IMPRESSO (OCULTO NA TELA)
         ================================================================================= */}
      <div className="print-only w-full">
        
        {/* Cabeçalho Azul */}
        <div className="flex flex-col border-b-2 border-blue-900 pb-4 mb-6">
            <div className="text-center mb-6">
                <h2 className="text-xs text-blue-600 uppercase tracking-widest mb-1">RELATÓRIO DE DESEMPENHO</h2>
                <h1 className="text-3xl font-black text-blue-900 uppercase">{motorista.nome_completo}</h1>
                <p className="text-sm mt-1 text-gray-600">Documento Gerado em: {new Date().toLocaleDateString()}</p>
            </div>

            {/* Dados Cadastrais */}
            <div className="grid grid-cols-2 gap-8 border-t border-blue-200 pt-4">
                <div>
                    <h3 className="text-xs font-bold text-blue-700 uppercase mb-2 border-b border-blue-100 pb-1">Dados Pessoais</h3>
                    <div className="text-sm space-y-1 text-black">
                        <p><strong>Idade:</strong> {motorista.idade || '-'} anos</p>
                        <p><strong>CPF:</strong> {motorista.cpf || '-'}</p>
                        <p><strong>CNH:</strong> {motorista.cnh} (Cat: {motorista.categoria_cnh})</p>
                        <p><strong>Validade CNH:</strong> {formatarData(motorista.validade_cnh)}</p>
                    </div>
                </div>
                <div>
                    <h3 className="text-xs font-bold text-blue-700 uppercase mb-2 border-b border-blue-100 pb-1">Veículo e Contato</h3>
                    <div className="text-sm space-y-1 text-black">
                        <p><strong>Veículo Atual:</strong> {motorista.veiculo_modelo || 'Nenhum'}</p>
                        <p><strong>Placa:</strong> {motorista.veiculo_placa || '-'}</p>
                        <p><strong>Telefone:</strong> {motorista.telefone || '-'}</p>
                        <p><strong>Email:</strong> {motorista.email || '-'}</p>
                    </div>
                </div>
            </div>
        </div>

        {/* 1. VIAGENS FUTURAS / AGENDADAS */}
        <div className="mb-8">
            <h2 className="text-sm font-bold text-blue-800 uppercase border-b-2 border-blue-800 pb-1 mb-2">
                Viagens Agendadas ({viagensAgendadas.length})
            </h2>
            {viagensAgendadas.length === 0 ? (
                <p className="text-xs text-gray-500 italic py-2">Não há viagens agendadas para o futuro.</p>
            ) : (
                <table className="w-full text-xs text-left">
                    <thead className="bg-blue-50 text-blue-900 font-bold uppercase">
                        <tr>
                            <th className="py-2 px-2 w-24">Data</th>
                            <th className="py-2 px-2">Destino</th>
                            <th className="py-2 px-2 w-32">Veículo</th>
                            <th className="py-2 px-2 w-24 text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {viagensAgendadas.map(v => (
                            <tr key={v.id} className="print-row">
                                <td className="py-2 px-2">{formatarData(v.data)} - {formatarHora(v.horario)}</td>
                                <td className="py-2 px-2 font-bold">{v.destino}</td>
                                <td className="py-2 px-2">{v.veiculo || '-'}</td>
                                <td className="py-2 px-2 text-right">{formatarStatus(v.status)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>

        {/* 2. VIAGENS REALIZADAS */}
        <div>
            <h2 className="text-sm font-bold text-gray-700 uppercase border-b-2 border-gray-400 pb-1 mb-2">
                Histórico de Viagens Realizadas ({viagensRealizadas.length})
            </h2>
            {viagensRealizadas.length === 0 ? (
                <p className="text-xs text-gray-500 italic py-2">Nenhuma viagem realizada registrada.</p>
            ) : (
                <table className="w-full text-xs text-left">
                    <thead className="bg-gray-100 text-gray-600 font-bold uppercase">
                        <tr>
                            <th className="py-2 px-2 w-24">Data</th>
                            <th className="py-2 px-2">Destino</th>
                            <th className="py-2 px-2 w-32">Veículo</th>
                            <th className="py-2 px-2 w-24 text-right">Situação</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {viagensRealizadas.map(v => (
                            <tr key={v.id} className="print-row">
                                <td className="py-2 px-2">{formatarData(v.data)}</td>
                                <td className="py-2 px-2">{v.destino}</td>
                                <td className="py-2 px-2">{v.veiculo || '-'}</td>
                                <td className="py-2 px-2 text-right font-bold text-green-700">CONCLUÍDO</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>

        {/* Rodapé Informativo (SEM LINHAS DE ASSINATURA) */}
        <div className="mt-8 p-6 border-t-2 border-blue-200 print-bg-blue rounded-lg break-inside-avoid">
            <div className="text-right mb-8 text-blue-900">
                <span className="text-xl font-bold uppercase">TOTAL GERAL: {viagens.length} VIAGENS</span>
            </div>
            <div className="flex justify-between text-xs text-blue-900 px-4">
                <div className="text-center w-5/12">
                    {/* Linha removida aqui */}
                    <p className="font-bold uppercase tracking-wider">Assinatura do Motorista</p>
                </div>
                <div className="text-center w-5/12">
                    {/* Linha removida aqui */}
                    <p className="font-bold uppercase tracking-wider">Gestão de Frota</p>
                </div>
            </div>
        </div>
      </div>
      {/* FIM DO LAYOUT DE IMPRESSÃO */}


      {/* =================================================================================
          LAYOUT DE TELA (MANTIDO ORIGINAL)
         ================================================================================= */}
      <main className="container mx-auto px-4 py-6 max-w-4xl no-print">

        {/* Botão Gerar Relatório (Acima do histórico) */}
        <div className="mb-6 flex justify-end">
          <button onClick={handleGerarRelatorio} className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium shadow-md flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Imprimir Relatório Completo
          </button>
        </div>

        {/* Card do Motorista (Estilo Paciente) */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden mb-6">
          <div onClick={() => setExpandido(!expandido)} className="bg-gradient-to-r from-blue-700 to-indigo-900 text-white p-6 cursor-pointer hover:from-blue-800 hover:to-indigo-950 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-white font-bold text-2xl border border-white/20">
                  {motorista.nome_completo.charAt(0)}
                </div>
                <div>
                  <h1 className="text-2xl font-bold mb-1">{motorista.nome_completo}</h1>
                  <p className="text-blue-200 text-sm">{expandido ? 'Clique para recolher ficha' : 'Clique para ver detalhes completos'}</p>
                </div>
              </div>
              <svg className={`w-6 h-6 transition-transform ${expandido ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>

          <div className={`transition-all duration-300 overflow-hidden ${expandido ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="p-6 space-y-4">
              <div className="pb-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase">Status Atual</h3>
                    {getStatusBadge(motorista.ativo, motorista.disponivel)}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><span className="text-xs text-gray-500 block">CNH</span><span className="text-gray-900 font-medium text-lg">{motorista.cnh}</span></div>
                    <div><span className="text-xs text-gray-500 block">Categoria</span><span className="text-gray-900 font-medium text-lg">{motorista.categoria_cnh}</span></div>
                    <div><span className="text-xs text-gray-500 block">Validade</span><span className={`font-medium text-lg ${new Date(motorista.validade_cnh) < new Date() ? 'text-red-600' : 'text-green-600'}`}>{formatarData(motorista.validade_cnh)}</span></div>
                </div>
              </div>

              <div className="pb-4 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Contato</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2"><svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg><span className="text-gray-900">{motorista.telefone || 'Não informado'}</span></div>
                    <div className="flex items-center gap-2"><svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg><span className="text-gray-900">{motorista.email}</span></div>
                </div>
              </div>

              {motorista.veiculo_placa && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Veículo Atual</h3>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-gray-200">🚌</div>
                    <div><div className="font-bold text-gray-900">{motorista.veiculo_placa}</div><div className="text-sm text-gray-600">{motorista.veiculo_modelo}</div></div>
                  </div>
                </div>
              )}
            </div>
          </div>
          {!expandido && <div className="p-6 text-center bg-gray-50 border-t border-gray-100"><p className="text-gray-500 text-sm">CNH: {motorista.cnh} ({motorista.categoria_cnh}) • {motorista.telefone}</p></div>}
        </div>

        {/* Histórico de Viagens (Interativo) */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Histórico de Viagens ({viagens.length})</h2>
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">Total</span>
          </div>
          {viagens.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">Nenhuma viagem registrada para este motorista.</div>
          ) : (
            <div className="space-y-3">
              {viagens.map((viagem) => {
                const statusClass = getCorStatus(viagem.status);
                // Correção do BUG do Link: Garante que temos um ID válido
                const codigoCorreto = getIdentificadorViagem(viagem);
                
                return (
                  <div 
                    key={viagem.id} 
                    onClick={() => router.push(`/viagem/${codigoCorreto}`)} 
                    className="border border-gray-200 rounded-lg p-4 hover:border-primary hover:shadow-sm transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                          <div className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                              {formatarData(viagem.data)} <span className="text-gray-400 text-xs font-normal">•</span> {formatarHora(viagem.horario)}
                          </div>
                          <div className="text-sm text-gray-500">Código: {codigoCorreto}</div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusClass}`}>{formatarStatus(viagem.status)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700 mt-3"><svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg><span className="font-medium">Destino:</span> {viagem.destino}</div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1"><svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg><span>Veículo: {viagem.veiculo || 'Não definido'}</span></div>
                    <div className="mt-3 flex justify-end"><span className="text-xs text-primary font-medium group-hover:underline">Ver Detalhes →</span></div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-6">
          <button onClick={() => router.back()} className="w-full py-4 rounded-lg font-medium transition-all bg-gray-100 text-gray-700 hover:bg-gray-200">← Voltar</button>
        </div>

      </main>
    </div>
  );
}