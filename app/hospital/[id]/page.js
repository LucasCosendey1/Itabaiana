//app/hospital/[id]/page.js

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '../../components/Header';
import { verificarAutenticacao, formatarData, formatarHora, formatarStatus, getCorStatus } from '../../utils/helpers';

export default function DetalhesHospitalPage() {
  const router = useRouter();
  const params = useParams();
  
  const [unidade, setUnidade] = useState(null);
  const [medicos, setMedicos] = useState([]);
  const [pacientes, setPacientes] = useState([]); // Pacientes cadastrados nesta unidade
  const [viagens, setViagens] = useState([]); // Histórico de viagens
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
      const response = await fetch(`/api/hospital/${params.id}`);
      const data = await response.json();

      if (response.ok) {
        setUnidade(data.unidade);
        setMedicos(data.medicos || []);
        setPacientes(data.pacientes || []);
        setViagens(data.viagens || []); 
      } else {
        setErro(data.erro || 'Unidade não encontrada');
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

  if (carregando) return <div className="min-h-screen bg-gray-50 flex justify-center items-center text-gray-500">Carregando...</div>;

  if (erro || !unidade) return (
    <div className="min-h-screen bg-gray-50">
      <Header titulo="Erro" mostrarVoltar voltarPara="/gerenciar-hospitais" />
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
        <Header titulo="Detalhes da Unidade" mostrarVoltar voltarPara="/gerenciar-hospitais" />
      </div>

      {/* =================================================================================
          LAYOUT DO RELATÓRIO IMPRESSO (ESTILO PRONTUÁRIO)
         ================================================================================= */}
      <div className="print-only w-full">
        
        {/* Cabeçalho Azul (Estilo Prontuário) */}
        <div className="flex flex-col w-full print-header-bg py-6 px-8 mb-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white uppercase tracking-wide">Relatório de Unidade</h1>
                    <p className="text-blue-100 text-sm mt-1">Sistema de Gestão de TFD • Município de Itabaiana-PB</p>
                </div>
                <div className="text-right text-white/80 text-xs">
                    <p>Gerado em: {new Date().toLocaleDateString()}</p>
                    <p>{new Date().toLocaleTimeString()}</p>
                </div>
            </div>
        </div>

        <div className="px-8 pb-8">
            
            {/* Título Principal da Unidade */}
            <div className="mb-6 border-b-2 border-gray-200 pb-4">
                <h1 className="text-2xl font-black text-black uppercase mb-1">{unidade.nome}</h1>
                <p className="text-gray-600 font-medium uppercase text-sm">
                    {unidade.tipo === 'hospital' ? '🏥 Hospital / Clínica Especializada' : '🩺 Unidade Básica de Saúde (UBS)'}
                </p>
            </div>

            {/* SEÇÃO 1: DADOS GERAIS */}
            <section className="mb-8">
                <h3 className="text-xs font-bold text-blue-600 uppercase mb-3 border-b border-blue-200 pb-1">
                    Informações Institucionais & Contato
                </h3>
                <div className="grid grid-cols-2 gap-6 text-sm">
                    <div>
                        <span className="block text-gray-500 text-xs uppercase">Endereço Completo</span>
                        <strong className="text-gray-900">{unidade.endereco || '-'}</strong>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <span className="block text-gray-500 text-xs uppercase">Telefone</span>
                            <strong className="text-gray-900">{unidade.telefone || '-'}</strong>
                        </div>
                        <div>
                            <span className="block text-gray-500 text-xs uppercase">CEP</span>
                            <strong className="text-gray-900">{unidade.cep || '-'}</strong>
                        </div>
                    </div>
                    <div>
                        <span className="block text-gray-500 text-xs uppercase">CNPJ</span>
                        <strong className="text-gray-900">{unidade.cnpj || 'Não informado'}</strong>
                    </div>
                    <div>
                        <span className="block text-gray-500 text-xs uppercase">Responsável Técnico / Administrativo</span>
                        <strong className="text-gray-900">{unidade.responsavel || 'Não informado'}</strong>
                    </div>
                    <div className="col-span-2">
                        <span className="block text-gray-500 text-xs uppercase">Horário de Funcionamento</span>
                        <strong className="text-gray-900">{unidade.horario_funcionamento || '-'}</strong>
                    </div>
                </div>
            </section>

            {/* SEÇÃO 2: ESTATÍSTICAS RÁPIDAS (BOX AZUL) */}
            <section className="mb-8 bg-blue-50 border border-blue-100 rounded-lg p-4">
                 <h3 className="text-xs font-bold text-blue-600 uppercase mb-3 border-b border-blue-200 pb-1">
                    Resumo Operacional
                </h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <span className="block text-gray-500 text-xs uppercase">Corpo Clínico</span>
                        <strong className="text-xl text-blue-800">{medicos.length}</strong>
                    </div>
                    <div>
                        <span className="block text-gray-500 text-xs uppercase">Pacientes Vinculados</span>
                        <strong className="text-xl text-blue-800">{pacientes.length}</strong>
                    </div>
                    <div>
                        <span className="block text-gray-500 text-xs uppercase">Total de Viagens</span>
                        <strong className="text-xl text-blue-800">{viagens.length}</strong>
                    </div>
                </div>
            </section>

            {/* SEÇÃO 3: CORPO CLÍNICO */}
            <section className="mb-8 break-inside-avoid">
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 border-b pb-1">
                    Corpo Clínico Vinculado
                </h3>
                {medicos.length === 0 ? (
                    <p className="text-sm text-gray-500 italic border border-dashed p-4 text-center rounded">Nenhum médico vinculado a esta unidade.</p>
                ) : (
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                            <tr>
                                <th className="px-3 py-2 border-b">Nome do Médico</th>
                                <th className="px-3 py-2 border-b">CRM</th>
                                <th className="px-3 py-2 border-b">Especialização</th>
                                <th className="px-3 py-2 border-b text-center">Atendimentos</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {medicos.map((m, i) => (
                                <tr key={i}>
                                    <td className="px-3 py-2 font-bold text-gray-800">{m.nome_completo}</td>
                                    <td className="px-3 py-2 text-gray-600">{m.crm || '-'}</td>
                                    <td className="px-3 py-2 text-gray-600">{m.especializacao || '-'}</td>
                                    <td className="px-3 py-2 text-center font-medium">{(m.total_agendadas || 0) + (m.total_realizadas || 0)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>

            {/* SEÇÃO 4: HISTÓRICO DE VIAGENS RECENTES */}
            <section className="mb-8 break-inside-avoid">
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 border-b pb-1">
                    Histórico Recente de Viagens (Últimas 30)
                </h3>
                {viagens.length === 0 ? (
                    <p className="text-sm text-gray-500 italic border border-dashed p-4 text-center rounded">Nenhuma viagem registrada.</p>
                ) : (
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                            <tr>
                                <th className="px-3 py-2 border-b w-24">Data</th>
                                <th className="px-3 py-2 border-b w-24">Cód.</th>
                                <th className="px-3 py-2 border-b">Motorista</th>
                                <th className="px-3 py-2 border-b text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {viagens.slice(0, 30).map((v) => (
                                <tr key={v.viagem_id}>
                                    <td className="px-3 py-2 font-medium">{formatarData(v.data_viagem)}</td>
                                    <td className="px-3 py-2 text-gray-500">{v.codigo_viagem}</td>
                                    <td className="px-3 py-2">{v.motorista_nome || 'Não definido'}</td>
                                    <td className="px-3 py-2 text-right">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                                            v.status === 'concluido' ? 'border-green-600 text-green-700' :
                                            v.status === 'cancelado' ? 'border-red-600 text-red-700' :
                                            'border-yellow-600 text-yellow-700'
                                        }`}>
                                            {formatarStatus(v.status)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>

            {/* RODAPÉ DO PDF (ASSINATURAS) */}
            <div className="mt-16 pt-8 border-t border-black break-inside-avoid">
                <div className="flex justify-between text-xs text-gray-600">
                    <div className="text-center w-1/3">
                        <div className="border-t border-black w-full mb-2"></div>
                        <p className="uppercase font-bold">Diretor/Responsável da Unidade</p>
                        <p>{unidade.nome}</p>
                    </div>
                    <div className="text-center w-1/3">
                        <div className="border-t border-black w-full mb-2"></div>
                        <p className="uppercase font-bold">Coordenação TFD</p>
                        <p>Município de Itabaiana-PB</p>
                    </div>
                </div>
                <p className="text-center mt-8 italic text-[10px] text-gray-400">
                    Relatório gerado automaticamente pelo sistema de gestão. Válido para conferência interna.
                </p>
            </div>

        </div>
      </div>
      {/* FIM DO LAYOUT DE IMPRESSÃO */}


      {/* =================================================================================
          LAYOUT DE TELA (PADRÃO - Mantido conforme original, apenas ajustes técnicos)
         ================================================================================= */}
      <main className="container mx-auto px-4 py-6 max-w-4xl no-print">

        {/* Botão Gerar Relatório (Acima do conteúdo) */}
        <div className="mb-6 flex justify-end">
          <button
            onClick={handleGerarRelatorio}
            className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium shadow-md flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Imprimir Relatório da Unidade
          </button>
        </div>

        {/* Card Principal */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden mb-6">
          <div
            onClick={() => setExpandido(!expandido)}
            className={`bg-gradient-to-r text-white p-6 cursor-pointer transition-all ${
                unidade.tipo === 'hospital' ? 'from-purple-700 to-indigo-800 hover:from-purple-800' : 'from-blue-600 to-cyan-700 hover:from-blue-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-3xl border border-white/30">
                  {unidade.tipo === 'hospital' ? '🏥' : '🩺'}
                </div>
                <div>
                  <h1 className="text-2xl font-bold mb-1">{unidade.nome}</h1>
                  <p className="text-white/80 text-sm flex items-center gap-2">
                    {unidade.tipo === 'hospital' ? 'Hospital' : 'Unidade Básica de Saúde'}
                    <span className="w-1 h-1 bg-white rounded-full"></span>
                    {unidade.telefone}
                  </p>
                </div>
              </div>
              <svg className={`w-6 h-6 transition-transform ${expandido ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <div className={`transition-all duration-300 overflow-hidden ${expandido ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="p-6 space-y-6">
              
              {/* Informações Gerais */}
              <div className="border-b border-gray-100 pb-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">Informações Gerais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 block">Endereço</span>
                    <span className="font-medium text-gray-900">{unidade.endereco}</span>
                    <div className="text-gray-500 text-xs mt-1">CEP: {unidade.cep}</div>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Responsável</span>
                    <span className="font-medium text-gray-900">{unidade.responsavel || '-'}</span>
                  </div>
                  {unidade.cnpj && (
                    <div>
                        <span className="text-gray-500 block">CNPJ</span>
                        <span className="font-medium text-gray-900">{unidade.cnpj}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500 block">Horário</span>
                    <span className="font-medium text-gray-900">{unidade.horario_funcionamento || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Corpo Clínico */}
              <div>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-gray-400 uppercase">Corpo Clínico</h3>
                    <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2 py-1 rounded-full">{medicos.length} Médicos</span>
                </div>
                {medicos.length > 0 ? (
                  <div className="grid gap-3">
                    {medicos.map((m) => (
                      <div key={m.id} 
                           className="bg-gray-50 border border-gray-200 p-3 rounded-lg flex justify-between items-center cursor-pointer hover:border-primary transition-colors"
                           onClick={() => router.push(`/medico/${m.medico_id}`)}
                      >
                        <div>
                            <div className="font-bold text-gray-900">{m.nome_completo}</div>
                            <div className="text-xs text-gray-600 mt-1">
                            {m.atuacao} • {m.dias_atendimento || 'Dias n/d'}
                            </div>
                        </div>
                        <div className="text-xs text-gray-400">Ver Perfil →</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Nenhum médico vinculado.</p>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* Histórico de Viagens (TELA) */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Histórico de Viagens</h2>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">{viagens.length} Viagens</span>
            </div>

            {viagens.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    Nenhuma viagem registrada para esta unidade.
                </div>
            ) : (
                <div className="space-y-3">
                    {viagens.map((viagem) => {
                        const codigoViagem = viagem.codigo_viagem || viagem.codigo || viagem.viagem_id;
                        const statusClass = getCorStatus(viagem.status);

                        return (
                            <div key={viagem.viagem_id} 
                                 className="border border-gray-200 rounded-lg p-4 hover:border-primary hover:shadow-sm transition-all cursor-pointer group"
                                 onClick={() => router.push(`/viagem/${codigoViagem}`)}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <div className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                                            {formatarData(viagem.data_viagem)} 
                                            <span className="text-gray-400 text-xs font-normal">•</span> 
                                            {formatarHora(viagem.horario_saida)}
                                        </div>
                                        <div className="text-sm text-gray-500">Cód: {viagem.codigo_viagem}</div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusClass}`}>
                                        {formatarStatus(viagem.status)}
                                    </span>
                                </div>
                                
                                <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                    <span>Motorista: <span className="font-medium text-gray-800">{viagem.motorista_nome || 'N/D'}</span></span>
                                </div>
                                <div className="mt-3 flex justify-end"><span className="text-xs text-primary font-medium group-hover:underline">Ver Detalhes →</span></div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>

        {/* Estatísticas de Pacientes (TELA - Só para UBS) */}
        {unidade.tipo === 'ubs' && (
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900">Pacientes Cadastrados</h2>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">{pacientes.length} Pacientes</span>
                </div>
                {pacientes.length > 0 ? (
                    <div className="text-sm text-gray-600">Esta unidade é referência para {pacientes.length} pacientes no sistema.</div>
                ) : (
                    <div className="text-sm text-gray-500">Nenhum paciente vinculado a esta UBS.</div>
                )}
            </div>
        )}

      </main>
    </div>
  );
}