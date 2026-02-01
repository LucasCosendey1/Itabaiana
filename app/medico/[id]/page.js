'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '../../components/Header';
import { verificarAutenticacao, formatarData } from '../../utils/helpers';

export default function DetalhesMedicoPage() {
  const router = useRouter();
  const params = useParams();
  
  const [medico, setMedico] = useState(null);
  const [vinculos, setVinculos] = useState([]);
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
      const response = await fetch(`/api/medico/${params.id}`);
      const data = await response.json();

      if (response.ok) {
        setMedico(data.medico);
        setVinculos(data.vinculos || []);
        setViagens(data.viagens || []);
      } else {
        setErro(data.erro || 'Médico não encontrado');
      }
    } catch (error) {
      setErro('Erro de conexão');
    } finally {
      setCarregando(false);
    }
  };

  const handleGerarRelatorio = () => {
    window.print();
  };

  // Separação dos Atendimentos (Futuros vs Passados)
  const atendimentosRealizados = viagens.filter(v => new Date(v.data_viagem) < new Date());
  const atendimentosAgendados = viagens.filter(v => new Date(v.data_viagem) >= new Date());

  if (carregando) return <div className="min-h-screen bg-gray-50 flex justify-center items-center text-gray-500">Carregando...</div>;

  if (erro || !medico) return (
    <div className="min-h-screen bg-gray-50">
      <Header titulo="Erro" mostrarVoltar voltarPara="/gerenciar-medicos" />
      <div className="p-6 text-center text-red-600">{erro}</div>
    </div>
  );

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
        <Header titulo="Perfil do Médico" mostrarVoltar voltarPara="/gerenciar-medicos" />
      </div>

      {/* =================================================================================
          LAYOUT DO RELATÓRIO IMPRESSO (OCULTO NA TELA)
         ================================================================================= */}
      <div className="print-only w-full">
        
        {/* Cabeçalho Azul */}
        <div className="flex flex-col border-b-2 border-blue-900 pb-4 mb-6">
            <div className="text-center mb-6">
                <h2 className="text-xs text-blue-600 uppercase tracking-widest mb-1">RELATÓRIO DE ATENDIMENTOS</h2>
                <h1 className="text-3xl font-black text-blue-900 uppercase">{medico.nome_completo}</h1>
                <p className="text-lg text-blue-800 mt-1 font-bold uppercase">{medico.especializacao}</p>
                <p className="text-sm mt-1 text-gray-600">Documento Gerado em: {new Date().toLocaleDateString()}</p>
            </div>

            {/* Dados Cadastrais e Vínculos */}
            <div className="grid grid-cols-2 gap-8 border-t border-blue-200 pt-4">
                <div>
                    <h3 className="text-xs font-bold text-blue-700 uppercase mb-2 border-b border-blue-100 pb-1">Dados de Contato</h3>
                    <div className="text-sm space-y-1 text-black">
                        <div>
                            <strong>CPF:</strong> {medico.cpf || '-'}
                            <span className="mx-2 text-gray-400">|</span>
                            <span className="text-xs text-gray-700"><strong>CRM:</strong> {medico.crm || '-'}</span>
                        </div>
                        <p><strong>Telefone:</strong> {medico.telefone || '-'}</p>
                        <p><strong>Email:</strong> {medico.email || '-'}</p>
                    </div>
                </div>
                <div>
                    <h3 className="text-xs font-bold text-blue-700 uppercase mb-2 border-b border-blue-100 pb-1">Locais de Atendimento (Vínculos)</h3>
                    <div className="text-sm space-y-1 text-black">
                        {vinculos.length > 0 ? (
                            vinculos.map((v, i) => (
                                <p key={i}>• {v.hospital_nome || v.ubs_nome} <span className="text-xs text-gray-600">({v.dias_atendimento})</span></p>
                            ))
                        ) : (
                            <p className="italic text-gray-500">Sem vínculos cadastrados.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* 1. PRÓXIMOS ATENDIMENTOS (AGENDADOS) */}
        <div className="mb-8">
            <h2 className="text-sm font-bold text-blue-800 uppercase border-b-2 border-blue-800 pb-1 mb-2">
                Próximos Atendimentos / Agendados ({atendimentosAgendados.length})
            </h2>
            {atendimentosAgendados.length === 0 ? (
                <p className="text-xs text-gray-500 italic py-2">Não há atendimentos agendados.</p>
            ) : (
                <table className="w-full text-xs text-left">
                    <thead className="bg-blue-50 text-blue-900 font-bold uppercase">
                        <tr>
                            <th className="py-2 px-2 w-24">Data</th>
                            <th className="py-2 px-2">Paciente</th>
                            <th className="py-2 px-2">Motivo</th>
                            <th className="py-2 px-2 w-20 text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {atendimentosAgendados.map(v => (
                            <tr key={v.id} className="print-row">
                                <td className="py-2 px-2">{formatarData(v.data_viagem)}</td>
                                <td className="py-2 px-2 font-bold">{v.paciente_nome}</td>
                                <td className="py-2 px-2">{v.motivo}</td>
                                <td className="py-2 px-2 text-right">AGENDADO</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>

        {/* 2. HISTÓRICO DE ATENDIMENTOS (REALIZADOS) */}
        <div>
            <h2 className="text-sm font-bold text-gray-700 uppercase border-b-2 border-gray-400 pb-1 mb-2">
                Histórico de Atendimentos Realizados ({atendimentosRealizados.length})
            </h2>
            {atendimentosRealizados.length === 0 ? (
                <p className="text-xs text-gray-500 italic py-2">Nenhum histórico encontrado.</p>
            ) : (
                <table className="w-full text-xs text-left">
                    <thead className="bg-gray-100 text-gray-600 font-bold uppercase">
                        <tr>
                            <th className="py-2 px-2 w-24">Data</th>
                            <th className="py-2 px-2">Paciente</th>
                            <th className="py-2 px-2">Motivo</th>
                            <th className="py-2 px-2 w-20 text-right">Situação</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {atendimentosRealizados.map(v => (
                            <tr key={v.id} className="print-row">
                                <td className="py-2 px-2">{formatarData(v.data_viagem)}</td>
                                <td className="py-2 px-2 font-bold">{v.paciente_nome}</td>
                                <td className="py-2 px-2">{v.motivo}</td>
                                <td className="py-2 px-2 text-right font-bold text-green-700">CONCLUÍDO</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>

        {/* Rodapé Informativo */}
        <div className="mt-8 p-6 border-t-2 border-blue-200 print-bg-blue rounded-lg break-inside-avoid">
            <div className="text-right mb-8 text-blue-900">
                <span className="text-xl font-bold uppercase">TOTAL DE PACIENTES: {viagens.length}</span>
            </div>
            <div className="flex justify-between text-xs text-blue-900 px-4">
                <div className="text-center w-5/12">
                    <p className="font-bold uppercase tracking-wider">Assinatura do Médico</p>
                </div>
                <div className="text-center w-5/12">
                    <p className="font-bold uppercase tracking-wider">Gestão de TFD</p>
                </div>
            </div>
        </div>
      </div>
      {/* FIM DO LAYOUT DE IMPRESSÃO */}


      {/* =================================================================================
          LAYOUT DE TELA (PADRÃO)
         ================================================================================= */}
      <main className="container mx-auto px-4 py-6 max-w-4xl no-print">

        {/* Card Principal */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden mb-6">
          <div onClick={() => setExpandido(!expandido)} className="bg-gradient-to-r from-primary to-blue-600 text-white p-6 cursor-pointer hover:from-primary-dark hover:to-blue-700 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                  {medico.nome_completo.charAt(0)}
                </div>
                <div>
                  <h1 className="text-2xl font-bold mb-1">{medico.nome_completo}</h1>
                  <p className="text-blue-100 text-sm">{medico.especializacao} • CRM {medico.crm}</p>
                </div>
              </div>
              <svg className={`w-6 h-6 transition-transform ${expandido ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>

          <div className={`transition-all duration-300 overflow-hidden ${expandido ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="p-6 space-y-6">
              {/* Dados Pessoais */}
              <div className="border-b border-gray-100 pb-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">Contato e Pessoal</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div><span className="text-gray-500 block">Email</span><span className="font-medium text-gray-900">{medico.email}</span></div>
                  <div><span className="text-gray-500 block">Telefone</span><span className="font-medium text-gray-900">{medico.telefone || '-'}</span></div>
                  <div><span className="text-gray-500 block">CPF</span><span className="font-medium text-gray-900">{medico.cpf}</span></div>
                </div>
              </div>

              {/* Vínculos */}
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">Locais de Atendimento</h3>
                {vinculos.length > 0 ? (
                  <div className="grid gap-3">
                    {vinculos.map((v) => (
                      <div key={v.id} className="bg-blue-50 border border-blue-100 p-3 rounded-lg">
                        <div className="font-bold text-blue-900">{v.hospital_nome || v.ubs_nome}</div>
                        <div className="text-xs text-blue-700 mt-1">{v.atuacao} • {v.dias_atendimento} ({v.horario_atendimento})</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Nenhum vínculo cadastrado.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ✅ BOTÃO GERAR RELATÓRIO (Agora aqui, acima da tabela) */}
        <div className="mb-6 flex justify-end">
          <button
            onClick={handleGerarRelatorio}
            className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium shadow-md flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Imprimir Relatório de Atendimentos
          </button>
        </div>

        {/* Histórico de Pacientes/Viagens vinculadas */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Pacientes Atendidos em Viagens</h2>
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">{viagens.length} Registros</span>
          </div>

          {viagens.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">Nenhuma viagem registrada com este médico responsável.</div>
          ) : (
            <div className="space-y-3">
              {viagens.map((viagem) => (
                <div key={viagem.id} className="border border-gray-200 rounded-lg p-4 hover:border-primary transition-colors cursor-pointer" onClick={() => router.push(`/viagem/${viagem.viagem_id}`)}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-gray-900">{formatarData(viagem.data_viagem)}</div>
                      <div className="text-sm text-gray-600 mt-1">Paciente: <span className="font-medium">{viagem.paciente_nome}</span></div>
                      <div className="text-xs text-gray-500 mt-1">Motivo: {viagem.motivo}</div>
                    </div>
                    <span className="text-xs text-primary font-medium hover:underline">Ver Viagem →</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}