//medico/[id]/page.js
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
        <Header titulo="Perfil do Médico" mostrarVoltar voltarPara="/gerenciar-medicos" />
      </div>

      {/* =================================================================================
          LAYOUT DO RELATÓRIO IMPRESSO (OCULTO NA TELA)
         ================================================================================= */}
      <div className="print-only w-full">
        
        {/* Cabeçalho Azul */}
        <div className="flex flex-col w-full print-header-bg py-6 px-8 mb-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white uppercase tracking-wide">Relatório do Profissional</h1>
                    <p className="text-blue-100 text-sm mt-1">Sistema de Gestão de TFD • Município de Itabaiana-PB</p>
                </div>
                <div className="text-right text-white/80 text-xs">
                    <p>Gerado em: {new Date().toLocaleDateString()}</p>
                    <p>{new Date().toLocaleTimeString()}</p>
                </div>
            </div>
        </div>

        <div className="px-8 pb-8">

            {/* Título Principal (Nome do Médico) */}
            <div className="mb-6 border-b-2 border-gray-200 pb-4">
                <h1 className="text-2xl font-black text-black uppercase mb-1">{medico.nome_completo}</h1>
                <p className="text-gray-600 font-medium uppercase text-sm">
                   Médico • {medico.especializacao}
                </p>
            </div>

            {/* SEÇÃO 1: DADOS PESSOAIS E CONTATO */}
            <section className="mb-8">
                <h3 className="text-xs font-bold text-blue-600 uppercase mb-3 border-b border-blue-200 pb-1">
                    Dados Cadastrais & Contato
                </h3>
                <div className="grid grid-cols-2 gap-6 text-sm">
                    <div>
                        <span className="block text-gray-500 text-xs uppercase">CRM</span>
                        <strong className="text-gray-900">{medico.crm || '-'}</strong>
                    </div>
                    <div>
                        <span className="block text-gray-500 text-xs uppercase">CPF</span>
                        <strong className="text-gray-900">{medico.cpf || '-'}</strong>
                    </div>
                    <div>
                        <span className="block text-gray-500 text-xs uppercase">Telefone</span>
                        <strong className="text-gray-900">{medico.telefone || '-'}</strong>
                    </div>
                    <div>
                        <span className="block text-gray-500 text-xs uppercase">Email</span>
                        <strong className="text-gray-900">{medico.email || '-'}</strong>
                    </div>
                </div>
            </section>

            {/* SEÇÃO 2: VÍNCULOS (HOSPITAIS/UBS) */}
            <section className="mb-8 bg-blue-50 border border-blue-100 rounded-lg p-4">
                 <h3 className="text-xs font-bold text-blue-600 uppercase mb-3 border-b border-blue-200 pb-1">
                    Locais de Atendimento (Vínculos)
                </h3>
                {vinculos.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">Nenhum vínculo cadastrado.</p>
                ) : (
                    <div className="grid grid-cols-1 gap-2">
                        {vinculos.map((v, i) => (
                            <div key={i} className="text-sm flex justify-between items-center border-b border-blue-100 last:border-0 pb-1 last:pb-0">
                                <span className="font-bold text-blue-900">{v.hospital_nome || v.ubs_nome}</span>
                                <span className="text-gray-600 text-xs">{v.atuacao} • {v.dias_atendimento} ({v.horario_atendimento})</span>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* SEÇÃO 3: AGENDA FUTURA */}
            <section className="mb-8 break-inside-avoid">
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 border-b pb-1">
                    Atendimentos Agendados ({atendimentosAgendados.length})
                </h3>
                {atendimentosAgendados.length === 0 ? (
                    <p className="text-sm text-gray-500 italic border border-dashed p-4 text-center rounded">Não há atendimentos futuros agendados.</p>
                ) : (
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                            <tr>
                                <th className="px-3 py-2 border-b w-24">Data</th>
                                <th className="px-3 py-2 border-b">Paciente</th>
                                <th className="px-3 py-2 border-b">Motivo</th>
                                <th className="px-3 py-2 border-b text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {atendimentosAgendados.map((v) => (
                                <tr key={v.id || Math.random()}>
                                    <td className="px-3 py-2 font-medium">{formatarData(v.data_viagem)}</td>
                                    <td className="px-3 py-2 font-bold text-gray-800">{v.paciente_nome}</td>
                                    <td className="px-3 py-2 text-gray-600">{v.motivo}</td>
                                    <td className="px-3 py-2 text-right">
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-blue-600 text-blue-700 uppercase">
                                            AGENDADO
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>

            {/* SEÇÃO 4: HISTÓRICO REALIZADO */}
            <section className="mb-8 break-inside-avoid">
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 border-b pb-1">
                    Histórico de Atendimentos Realizados ({atendimentosRealizados.length})
                </h3>
                {atendimentosRealizados.length === 0 ? (
                    <p className="text-sm text-gray-500 italic border border-dashed p-4 text-center rounded">Nenhum histórico anterior encontrado.</p>
                ) : (
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                            <tr>
                                <th className="px-3 py-2 border-b w-24">Data</th>
                                <th className="px-3 py-2 border-b">Paciente</th>
                                <th className="px-3 py-2 border-b">Motivo</th>
                                <th className="px-3 py-2 border-b text-right">Situação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {atendimentosRealizados.slice(0, 50).map((v) => (
                                <tr key={v.id || Math.random()}>
                                    <td className="px-3 py-2 font-medium">{formatarData(v.data_viagem)}</td>
                                    <td className="px-3 py-2 text-gray-800">{v.paciente_nome}</td>
                                    <td className="px-3 py-2 text-gray-600">{v.motivo}</td>
                                    <td className="px-3 py-2 text-right">
                                        <span className="text-xs font-bold text-green-700 uppercase">
                                            CONCLUÍDO
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
                        <p className="uppercase font-bold">Assinatura do Médico</p>
                        <p>{medico.nome_completo}</p>
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

        {/* Card Principal */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden mb-6">
          <div onClick={() => setExpandido(!expandido)} className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 cursor-pointer hover:from-blue-700 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-2xl border border-white/30">
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

        {/* ✅ BOTÃO GERAR RELATÓRIO */}
        <div className="mb-6 flex justify-end">
          <button
            onClick={handleGerarRelatorio}
            className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium shadow-md flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Imprimir Relatório do Médico
          </button>
        </div>

        {/* Histórico de Pacientes/Viagens vinculadas */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Pacientes Atendidos</h2>
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">{viagens.length} Registros</span>
          </div>

          {viagens.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">Nenhuma viagem registrada.</div>
          ) : (
            <div className="space-y-3">
              {viagens.slice(0, 10).map((viagem) => (
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
              {viagens.length > 10 && <p className="text-center text-xs text-gray-500 mt-2">Exibindo os 10 mais recentes...</p>}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}