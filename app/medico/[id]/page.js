// app/medico/[id]/page.js
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
    alert('Relatório de atendimentos do médico será gerado em breve!');
  };

  if (carregando) return <div className="min-h-screen bg-gray-50 flex justify-center items-center text-gray-500">Carregando...</div>;

  if (erro || !medico) return (
    <div className="min-h-screen bg-gray-50">
      <Header titulo="Erro" mostrarVoltar voltarPara="/gerenciar-medicos" />
      <div className="p-6 text-center text-red-600">{erro}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <Header titulo="Perfil do Médico" mostrarVoltar voltarPara="/gerenciar-medicos" />

      <main className="container mx-auto px-4 py-6 max-w-4xl">

        {/* Botão Gerar Relatório */}
        <div className="mb-6">
          <button
            onClick={handleGerarRelatorio}
            className="w-full md:w-auto px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-medium shadow-md flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Relatório de Atendimentos
          </button>
        </div>

        {/* Card Principal */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden mb-6">
          
          {/* Cabeçalho Expansível (Padrão Azul) */}
          <div
            onClick={() => setExpandido(!expandido)}
            className="bg-gradient-to-r from-primary to-blue-600 text-white p-6 cursor-pointer hover:from-primary-dark hover:to-blue-700 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                  {medico.nome_completo.charAt(0)}
                </div>
                <div>
                  <h1 className="text-2xl font-bold mb-1">{medico.nome_completo}</h1>
                  <p className="text-blue-100 text-sm">
                    {medico.especializacao} • CRM {medico.crm}
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
              
              {/* Dados Pessoais */}
              <div className="border-b border-gray-100 pb-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">Contato e Pessoal</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 block">Email</span>
                    <span className="font-medium text-gray-900">{medico.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Telefone</span>
                    <span className="font-medium text-gray-900">{medico.telefone || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">CPF</span>
                    <span className="font-medium text-gray-900">{medico.cpf}</span>
                  </div>
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
                        <div className="text-xs text-blue-700 mt-1">
                          {v.atuacao} • {v.dias_atendimento} ({v.horario_atendimento})
                        </div>
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

        {/* Histórico de Pacientes/Viagens vinculadas */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              Pacientes Atendidos em Viagens
            </h2>
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">
              {viagens.length} Registros
            </span>
          </div>

          {viagens.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
              Nenhuma viagem registrada com este médico responsável.
            </div>
          ) : (
            <div className="space-y-3">
              {viagens.map((viagem) => (
                <div key={viagem.id} className="border border-gray-200 rounded-lg p-4 hover:border-primary transition-colors cursor-pointer" onClick={() => router.push(`/viagem/${viagem.viagem_id}`)}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-gray-900">
                        {formatarData(viagem.data_viagem)}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Paciente: <span className="font-medium">{viagem.paciente_nome}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Motivo: {viagem.motivo}
                      </div>
                    </div>
                    <span className="text-xs text-primary font-medium hover:underline">
                      Ver Viagem →
                    </span>
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