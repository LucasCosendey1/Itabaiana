// app/viagem/[id]/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '../../components/Header';
import { verificarAutenticacao, formatarData, formatarHora, formatarStatus } from '../../utils/helpers';

/**
 * PÁGINA DE DETALHES DA VIAGEM
 */
export default function DetalhesViagemPage() {
  const router = useRouter();
  const params = useParams();
  const [viagem, setViagem] = useState(null);
  const [pacientes, setPacientes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [usuarioLogado, setUsuarioLogado] = useState(null);

  useEffect(() => {
    const autenticado = verificarAutenticacao(router);
    if (autenticado) {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (token) {
        const usuario = JSON.parse(token);
        setUsuarioLogado(usuario);
      }
    }
    
    if (params?.id) {
      carregarViagem();
    }
  }, [params.id, router]);

  const carregarViagem = async () => {
    try {
      const response = await fetch(`/api/viagem-detalhes/${params.id}`);
      const data = await response.json();

      if (response.ok) {
        setViagem(data.viagem);
        setPacientes(data.pacientes || []);
      } else {
        setErro(data.erro || 'Viagem não encontrada');
      }
    } catch (error) {
      setErro('Erro ao carregar viagem');
      console.error('Erro:', error);
    } finally {
      setCarregando(false);
    }
  };

  const handleAdicionarPaciente = () => {
    router.push(`/adicionar-paciente/${params.id}`);
  };

  const handleVerPaciente = (cpf) => {
    const cpfLimpo = cpf.replace(/\D/g, '');
    router.push(`/paciente/${cpfLimpo}`);
  };

  // ADMINISTRADOR: Baixa lista completa de passageiros
  const handleBaixarListaCompleta = () => {
    if (viagem && viagem.codigo_viagem) {
      window.open(`/api/gerar-comprovante-viagem/${viagem.codigo_viagem}`, '_blank');
    } else {
      alert('Código da viagem não disponível');
    }
  };

  // PACIENTE: Baixa apenas SEU comprovante
  const handleBaixarMeuComprovante = () => {
    if (viagem && viagem.codigo_viagem && usuarioLogado && usuarioLogado.cpf) {
      const cpfLimpo = usuarioLogado.cpf.replace(/\D/g, '');
      window.open(`/api/gerar-comprovante-paciente/${viagem.codigo_viagem}/${cpfLimpo}`, '_blank');
    } else {
      alert('Dados insuficientes para gerar comprovante');
    }
  };

  // ADMINISTRADOR: Baixa comprovante de UM paciente específico
  const handleBaixarComprovantePaciente = (cpf) => {
    if (viagem && viagem.codigo_viagem && cpf) {
      const cpfLimpo = cpf.replace(/\D/g, '');
      window.open(`/api/gerar-comprovante-paciente/${viagem.codigo_viagem}/${cpfLimpo}`, '_blank');
    } else {
      alert('Dados insuficientes');
    }
  };

  if (carregando) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Carregando informações...</div>
      </div>
    );
  }

  if (erro || !viagem) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header titulo="Viagem não encontrada" mostrarVoltar voltarPara="/gerenciar-viagens" />
        <main className="container mx-auto px-4 py-6 max-w-2xl">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {erro || 'Viagem não encontrada'}
          </div>
          <button
            onClick={() => router.push('/gerenciar-viagens')}
            className="mt-4 text-blue-600 hover:underline"
          >
            Voltar para lista
          </button>
        </main>
      </div>
    );
  }

  const totalPacientes = pacientes.length;
  const vagasDisponiveis = viagem.numero_vagas - totalPacientes;
  const viagemLotada = vagasDisponiveis <= 0;
  const ehAdministrador = usuarioLogado?.role === 'administrador';
  const ehPaciente = usuarioLogado?.role === 'paciente';

  // Verifica se o usuário logado está nesta viagem
  const pacienteLogadoNaViagem = ehPaciente ? pacientes.find(p => {
    const cpfPaciente = p.cpf.replace(/\D/g, '');
    const cpfLogado = usuarioLogado.cpf.replace(/\D/g, '');
    return cpfPaciente === cpfLogado;
  }) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        titulo="Detalhes da Viagem" 
        mostrarVoltar 
        voltarPara={ehAdministrador ? "/gerenciar-viagens" : "/busca"} 
      />

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        
        {/* Card Principal */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden mb-6">
          
          {/* Cabeçalho do Card */}
          <div className="bg-gradient-to-r from-primary to-blue-600 text-white p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-blue-100 text-sm font-medium mb-1">CÓDIGO</div>
                <div className="text-2xl font-bold tracking-wider">{viagem.codigo_viagem}</div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase shadow-sm ${
                viagem.status === 'confirmado' ? 'bg-green-500 text-white' : 
                viagem.status === 'cancelado' ? 'bg-red-500 text-white' : 
                'bg-yellow-400 text-yellow-900'
              }`}>
                {formatarStatus(viagem.status)}
              </span>
            </div>

            <div className="flex items-center gap-6 mt-2">
              <div>
                <div className="text-blue-100 text-xs uppercase mb-1">Data</div>
                <div className="text-xl font-semibold">{formatarData(viagem.data_viagem)}</div>
              </div>
              <div className="w-px h-10 bg-blue-400/30"></div>
              <div>
                <div className="text-blue-100 text-xs uppercase mb-1">Saída</div>
                <div className="text-xl font-semibold">{formatarHora(viagem.horario_saida)}</div>
              </div>
            </div>
          </div>

          {/* Informações Detalhadas */}
          <div className="p-6 space-y-6">
            
            {/* Destino e Vagas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Destino</h3>
                <div className="font-medium text-gray-900">
                  {viagem.ubs_destino_nome || viagem.hospital_destino}
                </div>
                {(viagem.ubs_destino_endereco || viagem.endereco_destino) && (
                   <div className="text-sm text-gray-500 mt-1">{viagem.ubs_destino_endereco || viagem.endereco_destino}</div>
                )}
                {viagem.ubs_destino_nome && (
                   <div className="text-xs text-blue-600 mt-1 font-medium">Unidade Básica de Saúde</div>
                )}
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Ocupação</h3>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold text-gray-900">{totalPacientes}</span>
                  <span className="text-sm text-gray-500 mb-1">/ {viagem.numero_vagas} vagas</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className={`h-2 rounded-full ${viagemLotada ? 'bg-red-500' : 'bg-green-500'}`} 
                    style={{ width: `${Math.min((totalPacientes / viagem.numero_vagas) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Motorista e Ônibus */}
            <div className="border-t border-gray-100 pt-4">
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Logística
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Motorista */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Motorista</div>
                    <div className="font-medium text-gray-900">{viagem.motorista_nome || 'Não definido'}</div>
                    {viagem.motorista_telefone && (
                      <div className="text-xs text-gray-500">{viagem.motorista_telefone}</div>
                    )}
                  </div>
                </div>

                {/* Ônibus */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Veículo</div>
                    {viagem.onibus_placa ? (
                      <>
                        <div className="font-medium text-gray-900">{viagem.onibus_placa}</div>
                        <div className="text-xs text-gray-500">
                          {viagem.onibus_modelo} {viagem.onibus_cor ? `• ${viagem.onibus_cor}` : ''}
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-gray-400 italic">Não definido</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Lista de Pacientes */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            {ehAdministrador ? 'Lista de Passageiros' : 'Informações da Viagem'}
          </h2>
          
          {pacientes.length === 0 ? (
            <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              Nenhum paciente adicionado a esta viagem.
            </div>
          ) : ehAdministrador ? (
            // ADMINISTRADOR: Vê TODOS os pacientes com botão individual
            <div className="space-y-3">
              {pacientes.map((paciente) => (
                <div 
                  key={paciente.paciente_id || Math.random()}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-blue-300 hover:bg-blue-50 transition-all group"
                >
                  <div 
                    onClick={() => handleVerPaciente(paciente.cpf)}
                    className="flex items-center gap-3 flex-1 cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                      {paciente.nome_completo?.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 group-hover:text-primary">
                        {paciente.nome_completo}
                      </div>
                      <div className="text-xs text-gray-500">
                        CPF: {paciente.cpf} • Sexo: {paciente.sexo || '-'}
                      </div>
                      {paciente.paciente_ubs_nome && (
                         <div className="text-xs text-gray-400 mt-0.5">UBS: {paciente.paciente_ubs_nome}</div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleBaixarComprovantePaciente(paciente.cpf)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-all flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    PDF
                  </button>
                </div>
              ))}
            </div>
          ) : pacienteLogadoNaViagem ? (
            // PACIENTE: Vê apenas SEUS dados
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xl">
                  {pacienteLogadoNaViagem.nome_completo?.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{pacienteLogadoNaViagem.nome_completo}</div>
                  <div className="text-sm text-gray-600">Você está cadastrado nesta viagem</div>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">CPF:</span> {pacienteLogadoNaViagem.cpf}</div>
                <div><span className="font-medium">Sexo:</span> {pacienteLogadoNaViagem.sexo || 'Não informado'}</div>
                {pacienteLogadoNaViagem.motivo && (
                  <div><span className="font-medium">Motivo:</span> {pacienteLogadoNaViagem.motivo}</div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Você não está cadastrado nesta viagem.
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="space-y-3">
          {/* BOTÕES DE COMPROVANTE */}
          {ehAdministrador ? (
            // ADMINISTRADOR: Botão de lista completa
            <button
              onClick={handleBaixarListaCompleta}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-lg shadow-md transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Baixar Lista Completa (PDF)
            </button>
          ) : pacienteLogadoNaViagem ? (
            // PACIENTE: Botão do SEU comprovante
            <button
              onClick={handleBaixarMeuComprovante}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-lg shadow-md transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Baixar Meu Comprovante (PDF)
            </button>
          ) : null}

          {/* BOTÕES DE AÇÃO - APENAS ADMINISTRADOR */}
          {ehAdministrador && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleAdicionarPaciente}
                disabled={viagemLotada}
                className={`w-full font-semibold py-3 rounded-lg shadow-sm border transition-all ${
                  viagemLotada 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' 
                    : 'bg-white text-primary border-primary hover:bg-primary hover:text-white'
                }`}
              >
                {viagemLotada ? 'Lotada' : '+ Add Passageiro'}
              </button>
              
              <button
                onClick={() => router.push('/gerenciar-viagens')}
                className="w-full bg-white text-gray-700 font-semibold py-3 rounded-lg shadow-sm border border-gray-300 hover:bg-gray-50 transition-all"
              >
                Voltar
              </button>
            </div>
          )}

          {/* BOTÃO VOLTAR - PACIENTE */}
          {ehPaciente && (
            <button
              onClick={() => router.push('/busca')}
              className="w-full bg-white text-gray-700 font-semibold py-3 rounded-lg shadow-sm border border-gray-300 hover:bg-gray-50 transition-all"
            >
              Voltar
            </button>
          )}
        </div>

      </main>
    </div>
  );
}