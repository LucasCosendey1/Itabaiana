// app/hospital/[id]/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '../../components/Header';
import { verificarAutenticacao } from '../../utils/helpers';

export default function DetalhesHospitalPage() {
  const router = useRouter();
  const params = useParams();
  
  const [unidade, setUnidade] = useState(null);
  const [medicos, setMedicos] = useState([]);
  const [pacientes, setPacientes] = useState([]); // Pacientes cadastrados nesta UBS
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
      } else {
        setErro(data.erro || 'Unidade não encontrada');
      }
    } catch (error) {
      setErro('Erro de conexão');
    } finally {
      setCarregando(false);
    }
  };

  if (carregando) return <div className="min-h-screen bg-gray-50 flex justify-center items-center text-gray-500">Carregando...</div>;

  if (erro || !unidade) return (
    <div className="min-h-screen bg-gray-50">
      <Header titulo="Erro" mostrarVoltar voltarPara="/gerenciar-hospitais" />
      <div className="p-6 text-center text-red-600">{erro}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <Header titulo="Detalhes da Unidade" mostrarVoltar voltarPara="/gerenciar-hospitais" />

      <main className="container mx-auto px-4 py-6 max-w-4xl">

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

              {/* Especialidades (Só Hospital) */}
              {unidade.especialidades && (
                  <div className="border-b border-gray-100 pb-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Especialidades</h3>
                    <p className="text-sm text-gray-700">{unidade.especialidades}</p>
                  </div>
              )}

              {/* Médicos Vinculados */}
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">Corpo Clínico</h3>
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

        {/* Estatísticas de Pacientes (Só para UBS) */}
        {unidade.tipo === 'ubs' && (
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900">
                    Pacientes Cadastrados
                    </h2>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">
                    {pacientes.length} Pacientes
                    </span>
                </div>
                {pacientes.length > 0 ? (
                    <div className="text-sm text-gray-600">
                        Esta unidade é referência para {pacientes.length} pacientes no sistema.
                    </div>
                ) : (
                    <div className="text-sm text-gray-500">Nenhum paciente vinculado a esta UBS.</div>
                )}
            </div>
        )}

      </main>
    </div>
  );
}