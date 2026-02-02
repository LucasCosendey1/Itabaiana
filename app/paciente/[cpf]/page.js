'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '../../components/Header';
import { verificarAutenticacao, getNomeResumido, formatarData, formatarHora, formatarStatus, getCorStatus } from '../../utils/helpers';

export default function InfoPacientePage() {
  const router = useRouter();
  const params = useParams();
  
  const [paciente, setPaciente] = useState(null);
  const [viagens, setViagens] = useState([]);
  const [expandido, setExpandido] = useState(true);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    verificarAutenticacao(router);
    carregarDados();
  }, [params.cpf, router]);

  const carregarDados = async () => {
    try {
      const cpfDecodificado = decodeURIComponent(params.cpf);
      const response = await fetch(`/api/paciente/${cpfDecodificado}`);
      const data = await response.json();

      if (response.ok) {
        setPaciente(data.paciente);
        setViagens(data.viagens || []);
      } else {
        setErro(data.erro || 'Paciente não encontrado');
      }
    } catch (error) {
      setErro('Erro ao carregar informações');
      console.error('Erro:', error);
    } finally {
      setCarregando(false);
    }
  };

  const handleGerarPDF = () => {
    setExpandido(true);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  if (carregando) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">Carregando...</div>;

  if (erro || !paciente) return (
    <div className="min-h-screen bg-gray-50">
      <Header titulo="Erro" mostrarVoltar voltarPara="/gerenciar-pacientes" />
      <div className="p-6 text-red-600">{erro || 'Paciente não encontrado'}</div>
    </div>
  );

  const nomeResumido = getNomeResumido(paciente.nome_completo);

  return (
    <div className="min-h-screen bg-gray-50 pb-32 print:bg-white print:pb-0 print:pt-0">
      
      {/* CSS Global para Impressão */}
      <style jsx global>{`
        @media print {
          @page { margin: 0; size: auto; }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .print-header-bg { background-color: #2563eb !important; color: white !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Header do Site (Some na impressão) */}
      <div className="no-print">
        <Header titulo="Prontuário" mostrarVoltar voltarPara="/gerenciar-pacientes" />
      </div>

      {/* CABEÇALHO PDF (Aparece só na impressão) */}
      <div className="hidden print:flex print:flex-col print:w-full print-header-bg py-6 px-8 mb-6">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-3xl font-bold text-white uppercase tracking-wide">Prontuário Médico</h1>
                <p className="text-blue-100 text-sm mt-1">Sistema de Gestão de TFD • Município de Itabaiana-PB</p>
            </div>
            <div className="text-right text-white/80 text-xs">
                <p>Gerado em: {new Date().toLocaleDateString()}</p>
                <p>{new Date().toLocaleTimeString()}</p>
            </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6 max-w-5xl print:max-w-full print:p-8">

        {/* CARD PRINCIPAL */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden mb-6 print:shadow-none print:border-none">
          
          {/* Cabeçalho Visual - ALTERADO: Fundo branco na impressão */}
          <div
            onClick={() => setExpandido(!expandido)}
            className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 cursor-pointer print:bg-none print:bg-white print:text-black print:p-0 print:mb-4 print:border-b-2 print:border-gray-300"
          >
            <div className="flex items-center gap-4">
                {/* Avatar (Some no PDF) */}
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-2xl print:hidden">
                  {nomeResumido.charAt(0)}
                </div>
                <div>
                  {/* Nome em preto na impressão */}
                  <h1 className="text-2xl font-bold mb-1 print:text-3xl print:text-black print:uppercase">
                    {paciente.nome_completo}
                  </h1>
                  <div className="flex flex-wrap gap-3 text-blue-100 text-sm print:text-gray-600 print:mt-2 print:font-medium">
                    <span className="flex items-center gap-1"> CPF: {paciente.cpf}</span>
                    <span className="print:hidden">•</span>
                    <span className="flex items-center gap-1"> SUS: {paciente.cartao_sus}</span>
                  </div>
                </div>
            </div>
          </div>

          {/* Conteúdo dos Dados */}
          <div className={`${expandido ? 'block' : 'hidden'} print:block`}>
            <div className="p-6 space-y-8 print:p-0 print:space-y-6">
              
              {/* SEÇÃO 1: DADOS PESSOAIS */}
              <section>
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 border-b pb-1 print:text-blue-600 print:border-blue-200">
                    Dados Pessoais & Filiação
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                    <div>
                        <span className="block text-gray-500 text-xs uppercase">Data de Nascimento</span>
                        <strong className="text-gray-900 text-base">
                            {formatarData(paciente.data_nascimento)} ({paciente.idade} anos)
                        </strong>
                    </div>
                    <div>
                        <span className="block text-gray-500 text-xs uppercase">Sexo</span>
                        <strong className="text-gray-900">{paciente.sexo}</strong>
                    </div>
                    <div>
                        <span className="block text-gray-500 text-xs uppercase">Tipo Sanguíneo</span>
                        <strong className="text-gray-900">
                            {paciente.tipo_sanguineo || 'Não informado'}
                        </strong>
                    </div>
                    <div>
                        <span className="block text-gray-500 text-xs uppercase">Nome da Mãe</span>
                        <strong className="text-gray-900">{paciente.nome_mae}</strong>
                    </div>
                    <div>
                        <span className="block text-gray-500 text-xs uppercase">Nome do Pai</span>
                        <strong className="text-gray-900">{paciente.nome_pai || 'Não declarado'}</strong>
                    </div>
                    <div>
                        <span className="block text-gray-500 text-xs uppercase">Responsável Familiar</span>
                        <strong className="text-gray-900">
                            {paciente.responsavel_familiar ? 'Sim' : 'Não'}
                        </strong>
                    </div>
                </div>
              </section>

              {/* SEÇÃO 2: CONTATO */}
              <section>
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 border-b pb-1 print:text-blue-600 print:border-blue-200">
                    Localização & Contato
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div>
                        <span className="block text-gray-500 text-xs uppercase">Endereço Residencial</span>
                        <strong className="text-gray-900">{paciente.endereco}</strong>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <span className="block text-gray-500 text-xs uppercase">CEP</span>
                            <strong className="text-gray-900">{paciente.cep}</strong>
                        </div>
                        <div>
                            <span className="block text-gray-500 text-xs uppercase">Telefone</span>
                            <strong className="text-gray-900">{paciente.telefone}</strong>
                        </div>
                    </div>
                    <div className="md:col-span-2">
                        <span className="block text-gray-500 text-xs uppercase">E-mail</span>
                        <strong className="text-gray-900">{paciente.email}</strong>
                    </div>
                </div>
              </section>

              {/* SEÇÃO 3: SAÚDE */}
              <section className="bg-blue-50 p-4 rounded-lg border border-blue-100 print:bg-transparent print:border-none print:p-0">
                <h3 className="text-xs font-bold text-blue-500 uppercase mb-3 print:text-blue-600 print:border-b print:border-blue-200 print:pb-1">
                    Vínculo de Saúde (Atenção Básica)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                    <div>
                        <span className="block text-gray-500 text-xs uppercase">Unidade Básica (UBS)</span>
                        <strong className="text-gray-900 text-base">{paciente.ubs_nome || 'Não vinculada'}</strong>
                    </div>
                    <div>
                        <span className="block text-gray-500 text-xs uppercase">Agente Comunitário (ACS)</span>
                        <strong className="text-gray-900">{paciente.agente_nome || 'Não informado'}</strong>
                    </div>
                    <div>
                        <span className="block text-gray-500 text-xs uppercase">Microárea</span>
                        <strong className="text-gray-900">{paciente.microarea || '-'}</strong>
                    </div>
                </div>
              </section>

              {/* SEÇÃO 4: OBSERVAÇÕES */}
              {(paciente.alergias || paciente.observacoes_medicas) && (
                <section>
                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 border-b pb-1 print:text-blue-600 print:border-blue-200">
                        Observações Clínicas Relevantes
                    </h3>
                    <div className="grid grid-cols-1 gap-4 text-sm">
                        {paciente.alergias && (
                            <div className="bg-red-50 p-3 rounded border-l-4 border-red-500 print:bg-transparent print:border-none print:p-0">
                                <span className="block text-red-600 font-bold text-xs uppercase">Alergias</span>
                                <p className="text-gray-900">{paciente.alergias}</p>
                            </div>
                        )}
                        {paciente.observacoes_medicas && (
                            <div className="bg-yellow-50 p-3 rounded border-l-4 border-yellow-400 print:bg-transparent print:border-none print:p-0">
                                <span className="block text-yellow-700 font-bold text-xs uppercase">Outras Observações</span>
                                <p className="text-gray-900">{paciente.observacoes_medicas}</p>
                            </div>
                        )}
                    </div>
                </section>
              )}

            </div>
          </div>
        </div>

        {/* TABELA DE VIAGENS */}
        <div className="mt-8 break-before-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-200 print:text-blue-700 print:border-blue-600">
                Histórico de Viagens ({viagens.length})
            </h2>
            
            {viagens.length === 0 ? (
                <div className="text-center py-8 text-gray-400 border border-dashed rounded-lg print:border-gray-300">
                    Nenhuma viagem registrada para este paciente.
                </div>
            ) : (
                <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-gray-100 text-gray-600 uppercase text-xs print:bg-gray-200 print:text-black">
                        <tr>
                            <th className="px-4 py-3 rounded-tl-lg">Data</th>
                            <th className="px-4 py-3">Código</th>
                            <th className="px-4 py-3">Destino</th>
                            <th className="px-4 py-3">Motivo</th>
                            <th className="px-4 py-3 rounded-tr-lg text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {viagens.map((viagem, index) => (
                            <tr key={viagem.viagem_id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50 print:bg-gray-100'}>
                                <td className="px-4 py-3 font-medium">
                                    {formatarData(viagem.data_viagem)}
                                    <span className="block text-xs text-gray-500">{formatarHora(viagem.horario_saida)}</span>
                                </td>
                                <td className="px-4 py-3 text-gray-600">{viagem.codigo_viagem}</td>
                                <td className="px-4 py-3">{viagem.hospital_destino}</td>
                                <td className="px-4 py-3 text-gray-600 truncate max-w-[150px]">{viagem.motivo}</td>
                                <td className="px-4 py-3 text-center">
                                    <span className={`px-2 py-1 rounded text-xs font-bold border ${
                                        viagem.status_viagem === 'confirmado' ? 'bg-green-100 text-green-800 border-green-200 print:border-black print:text-black print:bg-transparent' : 
                                        viagem.status_viagem === 'cancelado' ? 'bg-red-100 text-red-800 border-red-200 print:border-black print:text-black print:bg-transparent' : 
                                        'bg-yellow-100 text-yellow-800 border-yellow-200 print:border-black print:text-black print:bg-transparent'
                                    }`}>
                                        {formatarStatus(viagem.status_viagem)}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>

        {/* RODAPÉ DO PDF */}
        <div className="hidden print:block mt-16 pt-8 border-t border-black">
            <div className="flex justify-between text-xs text-gray-600">
                <div className="text-center w-1/3">
                    <div className="border-t border-black w-full mb-2"></div>
                    <p>Assinatura do Responsável</p>
                </div>
                <div className="text-center w-1/3">
                    <div className="border-t border-black w-full mb-2"></div>
                    <p>Assinatura do Paciente</p>
                </div>
            </div>
            <p className="text-center mt-8 italic text-[10px]">
                Este documento é um relatório do sistema interno de transporte e não substitui laudos médicos oficiais.
            </p>
        </div>

      </main>

      {/* MOBILE ACTION BAR (FIXED BOTTOM) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] no-print z-50">
        <button
          onClick={handleGerarPDF}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Imprimir / Salvar PDF
        </button>
      </div>

    </div>
  );
}