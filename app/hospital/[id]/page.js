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

  // Separação de Viagens para o Relatório
  const viagensRealizadas = viagens.filter(v => v.status === 'concluido' || new Date(v.data_viagem) < new Date());
  const viagensAgendadas = viagens.filter(v => v.status === 'agendado' || (v.status === 'pendente' && new Date(v.data_viagem) >= new Date()));

  if (carregando) return <div className="min-h-screen bg-gray-50 flex justify-center items-center text-gray-500">Carregando...</div>;

  if (erro || !unidade) return (
    <div className="min-h-screen bg-gray-50">
      <Header titulo="Erro" mostrarVoltar voltarPara="/gerenciar-hospitais" />
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
        <Header titulo="Detalhes da Unidade" mostrarVoltar voltarPara="/gerenciar-hospitais" />
      </div>

      {/* =================================================================================
          LAYOUT DO RELATÓRIO IMPRESSO (OCULTO NA TELA)
         ================================================================================= */}
      <div className="print-only w-full">
        
        {/* Cabeçalho Azul */}
        <div className="flex flex-col border-b-2 border-blue-900 pb-4 mb-6">
            <div className="text-center mb-6">
                <h2 className="text-xs text-blue-600 uppercase tracking-widest mb-1">RELATÓRIO DE UNIDADE DE SAÚDE</h2>
                <h1 className="text-3xl font-black text-blue-900 uppercase">{unidade.nome}</h1>
                <p className="text-lg text-blue-800 mt-1 font-bold uppercase">{unidade.tipo === 'hospital' ? 'Hospital / Clínica' : 'Unidade Básica de Saúde (UBS)'}</p>
                <p className="text-sm mt-1 text-gray-600">Documento Gerado em: {new Date().toLocaleDateString()}</p>
            </div>

            {/* Dados da Unidade */}
            <div className="grid grid-cols-2 gap-8 border-t border-blue-200 pt-4">
                <div>
                    <h3 className="text-xs font-bold text-blue-700 uppercase mb-2 border-b border-blue-100 pb-1">Informações Gerais</h3>
                    <div className="text-sm space-y-1 text-black">
                        <p><strong>Endereço:</strong> {unidade.endereco || '-'}</p>
                        <p><strong>CEP:</strong> {unidade.cep || '-'}</p>
                        <p><strong>Telefone:</strong> {unidade.telefone || '-'}</p>
                        <p><strong>CNPJ:</strong> {unidade.cnpj || '-'}</p>
                    </div>
                </div>
                <div>
                    <h3 className="text-xs font-bold text-blue-700 uppercase mb-2 border-b border-blue-100 pb-1">Gestão e Capacidade</h3>
                    <div className="text-sm space-y-1 text-black">
                        <p><strong>Responsável:</strong> {unidade.responsavel || '-'}</p>
                        <p><strong>Horário:</strong> {unidade.horario_funcionamento || '-'}</p>
                        <p><strong>Total Médicos:</strong> {medicos.length}</p>
                        <p><strong>Total Viagens Recebidas:</strong> {viagens.length}</p>
                        <p><strong>Total Pacientes Cadastrados:</strong> {pacientes.length}</p>
                    </div>
                </div>
            </div>
        </div>

        {/* 1. CORPO CLÍNICO */}
        <div className="mb-8">
            <h2 className="text-sm font-bold text-blue-800 uppercase border-b-2 border-blue-800 pb-1 mb-2">
                Corpo Clínico Vinculado ({medicos.length})
            </h2>
            {medicos.length === 0 ? (
                <p className="text-xs text-gray-500 italic py-2">Nenhum médico vinculado.</p>
            ) : (
                <table className="w-full text-xs text-left">
                    <thead className="bg-blue-50 text-blue-900 font-bold uppercase">
                        <tr>
                            <th className="py-2 px-2">Nome do Médico</th>
                            <th className="py-2 px-2">CRM</th>
                            <th className="py-2 px-2">Especialização</th>
                            <th className="py-2 px-2 text-center">Viagens</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {medicos.map((m, i) => (
                            <tr key={i} className="print-row">
                                <td className="py-2 px-2 font-bold">{m.nome_completo}</td>
                                <td className="py-2 px-2">{m.crm || '-'}</td>
                                <td className="py-2 px-2">{m.especializacao || '-'}</td>
                                <td className="py-2 px-2 text-center">{ (m.total_agendadas || 0) + (m.total_realizadas || 0) }</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>

        {/* 2. PACIENTES CADASTRADOS (NOVO) */}
        {pacientes.length > 0 && (
            <div className="mb-8">
                <h2 className="text-sm font-bold text-blue-800 uppercase border-b-2 border-blue-800 pb-1 mb-2">
                    Pacientes Cadastrados ({pacientes.length})
                </h2>
                <table className="w-full text-xs text-left">
                    <thead className="bg-blue-50 text-blue-900 font-bold uppercase">
                        <tr>
                            <th className="py-2 px-2">Nome do Paciente</th>
                            <th className="py-2 px-2 w-32">CPF</th>
                            <th className="py-2 px-2 w-40">Cartão SUS</th>
                            <th className="py-2 px-2 w-32">Contato</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {pacientes.map((p, i) => (
                            <tr key={p.id || i} className="print-row">
                                <td className="py-2 px-2 font-bold">{p.nome_completo}</td>
                                <td className="py-2 px-2">{p.cpf || '-'}</td>
                                <td className="py-2 px-2">{p.cartao_sus || '-'}</td>
                                <td className="py-2 px-2">{p.telefone || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

        {/* 3. HISTÓRICO DE VIAGENS */}
        <div>
            <h2 className="text-sm font-bold text-gray-700 uppercase border-b-2 border-gray-400 pb-1 mb-2">
                Histórico de Viagens Recebidas ({viagens.length})
            </h2>
            {viagens.length === 0 ? (
                <p className="text-xs text-gray-500 italic py-2">Nenhuma viagem registrada para este destino.</p>
            ) : (
                <table className="w-full text-xs text-left">
                    <thead className="bg-gray-100 text-gray-600 font-bold uppercase">
                        <tr>
                            <th className="py-2 px-2 w-24">Data</th>
                            <th className="py-2 px-2 w-24">Código</th>
                            <th className="py-2 px-2">Motorista</th>
                            <th className="py-2 px-2 w-20 text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {viagens.slice(0, 30).map(v => ( 
                            <tr key={v.viagem_id} className="print-row">
                                <td className="py-2 px-2">{formatarData(v.data_viagem)}</td>
                                <td className="py-2 px-2">{v.codigo_viagem}</td>
                                <td className="py-2 px-2">{v.motorista_nome || 'N/D'}</td>
                                <td className="py-2 px-2 text-right">{formatarStatus(v.status)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
            {viagens.length > 30 && <p className="text-[10px] text-gray-500 mt-2 text-right">* Exibindo apenas as últimas 30 viagens.</p>}
        </div>

        {/* Rodapé Informativo */}
        <div className="mt-8 p-6 border-t-2 border-blue-200 print-bg-blue rounded-lg break-inside-avoid">
            <div className="text-right mb-8 text-blue-900">
                <span className="text-xl font-bold uppercase">TOTAL DE REGISTROS: {pacientes.length + viagens.length}</span>
            </div>
            <div className="flex justify-between text-xs text-blue-900 px-4">
                <div className="text-center w-5/12">
                    <p className="font-bold uppercase tracking-wider">Gestão de Unidades</p>
                </div>
                <div className="text-center w-5/12">
                    <p className="font-bold uppercase tracking-wider">Coordenação TFD</p>
                </div>
            </div>
        </div>
      </div>
      {/* FIM DO LAYOUT DE IMPRESSÃO */}


      {/* =================================================================================
          LAYOUT DE TELA (PADRÃO)
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

        {/* Histórico de Viagens (NOVA SEÇÃO) */}
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
                        // Garantir código da viagem para o link
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

        {/* Estatísticas de Pacientes (Só para UBS) - Mantido */}
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