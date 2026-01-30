'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '../../components/Header';
import { verificarAutenticacao, formatarData, formatarHora, formatarStatus } from '../../utils/helpers';

/**
 * PÁGINA DE DETALHES DA VIAGEM
 * Com funcionalidades de edição e Check-in de pacientes
 */
export default function DetalhesViagemPage() {
  const router = useRouter();
  const params = useParams();
  
  // Estados principais
  const [viagem, setViagem] = useState(null);
  const [pacientes, setPacientes] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [confirmando, setConfirmando] = useState(false);
  const [usuarioLogado, setUsuarioLogado] = useState(null);

  // Estados de Edição
  const [modoEdicao, setModoEdicao] = useState(false);
  const [editandoCampo, setEditandoCampo] = useState(null);

  // Estados temporários para formulários de edição
  const [novoMotoristaId, setNovoMotoristaId] = useState('');
  const [novoOnibusId, setNovoOnibusId] = useState('');
  const [novoDestinoId, setNovoDestinoId] = useState('');
  const [novoDestinoNome, setNovoDestinoNome] = useState('');
  const [novoDestinoEndereco, setNovoDestinoEndereco] = useState('');
  const [novaDataViagem, setNovaDataViagem] = useState('');
  const [novoHorarioSaida, setNovoHorarioSaida] = useState('');

  // Dados auxiliares para os selects
  const [motoristas, setMotoristas] = useState([]);
  const [onibus, setOnibus] = useState([]);
  const [ubsList, setUbsList] = useState([]);

  // 3.1. Função de Navegação para o Check-in
  const handleAbrirCheckin = (paciente) => {
    router.push(`/viagem/${params.id}/paciente/${paciente.paciente_id}`);
  };

  useEffect(() => {
    const autenticado = verificarAutenticacao(router);
    if (autenticado) {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (token) {
        setUsuarioLogado(JSON.parse(token));
      }
    }

    if (params?.id) {
      carregarViagem();
      carregarDadosAuxiliares();
    }
  }, [params.id, router]);

  const carregarViagem = async () => {
    try {
      const response = await fetch(`/api/viagem-detalhes/${params.id}`);
      const data = await response.json();

      if (response.ok) {
        setViagem(data.viagem);
        setPacientes(data.pacientes || []);
        setHistorico(data.historico || []);
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

  const carregarDadosAuxiliares = async () => {
    try {
      const [resMotoristas, resOnibus, resUbs] = await Promise.all([
        fetch('/api/listar-motoristas'),
        fetch('/api/listar-onibus'),
        fetch('/api/listar-ubs')
      ]);

      if (resMotoristas.ok) {
        const data = await resMotoristas.json();
        setMotoristas(data.motoristas || []);
      }
      if (resOnibus.ok) {
        const data = await resOnibus.json();
        setOnibus(data.onibus || []);
      }
      if (resUbs.ok) {
        const data = await resUbs.json();
        setUbsList(data.ubs || []);
      }
    } catch (error) {
      console.error('Erro ao carregar dados auxiliares:', error);
    }
  };

  // ============================================
  // FUNÇÕES DE EDIÇÃO (Mantidas do original)
  // ============================================

  const cancelarEdicao = () => {
    setModoEdicao(false);
    setEditandoCampo(null);
    setErro('');
  };

  const formatarHorarioInput = (valor) => {
    const numeros = valor.replace(/\D/g, '');
    if (numeros.length <= 2) return numeros;
    if (numeros.length <= 4) return `${numeros.slice(0, 2)}h${numeros.slice(2)}`;
    return `${numeros.slice(0, 2)}h${numeros.slice(2, 4)}`;
  };

  // --- MOTORISTA ---
  const iniciarEdicaoMotorista = () => {
    setNovoMotoristaId(viagem.motorista_id || '');
    setEditandoCampo('motorista');
    setModoEdicao(true);
  };

  const salvarMotorista = async () => {
    try {
      const response = await fetch(`/api/atualizar-viagem/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motorista_id: novoMotoristaId || null })
      });
      if (response.ok) {
        carregarViagem();
        cancelarEdicao();
      } else {
        const data = await response.json();
        setErro(data.erro || 'Erro ao atualizar motorista');
      }
    } catch (error) {
      setErro('Erro ao conectar com o servidor');
    }
  };

  // --- ÔNIBUS ---
  const iniciarEdicaoOnibus = () => {
    setNovoOnibusId(viagem.onibus_id || '');
    setEditandoCampo('onibus');
    setModoEdicao(true);
  };

  const salvarOnibus = async () => {
    try {
      const onibusSelecionado = onibus.find(o => o.id === parseInt(novoOnibusId));
      const payload = { onibus_id: novoOnibusId || null };
      
      if(onibusSelecionado) {
          payload.numero_vagas = onibusSelecionado.capacidade_passageiros;
      }

      const response = await fetch(`/api/atualizar-viagem/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        carregarViagem();
        cancelarEdicao();
      } else {
        const data = await response.json();
        setErro(data.erro || 'Erro ao atualizar ônibus');
      }
    } catch (error) {
      setErro('Erro ao conectar com o servidor');
    }
  };

  // --- DESTINO ---
  const iniciarEdicaoDestino = () => {
    setNovoDestinoId(viagem.ubs_destino_id || 'outro');
    setNovoDestinoNome(viagem.ubs_destino_nome || viagem.hospital_destino || '');
    setNovoDestinoEndereco(viagem.ubs_destino_endereco || viagem.endereco_destino || '');
    setEditandoCampo('destino');
    setModoEdicao(true);
  };

  const salvarDestino = async () => {
    try {
      let nomeFinal = novoDestinoNome;
      if (novoDestinoId !== 'outro') {
          const ubsSel = ubsList.find(u => u.id === parseInt(novoDestinoId));
          if(ubsSel) nomeFinal = ubsSel.nome;
      }

      const dados = {
        ubs_destino_id: novoDestinoId !== 'outro' ? parseInt(novoDestinoId) : null,
        hospital_destino: nomeFinal,
        endereco_destino: novoDestinoEndereco || null
      };
      
      const response = await fetch(`/api/atualizar-viagem/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      });
      if (response.ok) {
        carregarViagem();
        cancelarEdicao();
      } else {
        const data = await response.json();
        setErro(data.erro || 'Erro ao atualizar destino');
      }
    } catch (error) {
      setErro('Erro ao conectar com o servidor');
    }
  };

  // --- DATA E HORA ---
  const iniciarEdicaoDataHora = () => {
    const dataFormatada = typeof viagem.data_viagem === 'string' 
      ? viagem.data_viagem.split('T')[0] 
      : new Date(viagem.data_viagem).toISOString().split('T')[0];

    setNovaDataViagem(dataFormatada);
    setNovoHorarioSaida(viagem.horario_saida ? viagem.horario_saida.substring(0, 5).replace(':', 'h') : '');
    setEditandoCampo('datahora');
    setModoEdicao(true);
  };

  const salvarDataHora = async () => {
    try {
      const horarioConvertido = novoHorarioSaida.replace('h', ':');
      
      const response = await fetch(`/api/atualizar-viagem/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data_viagem: novaDataViagem,
          horario_saida: horarioConvertido
        })
      });
      if (response.ok) {
        carregarViagem();
        cancelarEdicao();
      } else {
        const data = await response.json();
        setErro(data.erro || 'Erro ao atualizar data/hora');
      }
    } catch (error) {
      setErro('Erro ao conectar com o servidor');
    }
  };

  // --- REMOVER PACIENTE ---
  const removerPacienteViagem = async (pacienteId) => {
    if (!confirm('Tem certeza que deseja remover este paciente da viagem?')) {
      return;
    }
    try {
      const response = await fetch(`/api/remover-paciente-viagem`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          viagem_id: viagem.viagem_id,
          paciente_id: pacienteId
        })
      });
      if (response.ok) {
        carregarViagem();
      } else {
        const data = await response.json();
        setErro(data.erro || 'Erro ao remover paciente');
      }
    } catch (error) {
      setErro('Erro ao conectar com o servidor');
    }
  };

  // --- AÇÕES GERAIS ---
  const handleConfirmarViagem = async () => {
    if (!confirm('Tem certeza que deseja confirmar esta viagem?')) return;
    
    setConfirmando(true);
    try {
      const response = await fetch(`/api/viagem/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'confirmado' })
      });
      
      if (response.ok) {
        carregarViagem();
        alert('Viagem confirmada com sucesso!');
      } else {
        alert('Erro ao confirmar viagem');
      }
    } catch (error) {
      console.error(error);
      alert('Erro de conexão');
    } finally {
      setConfirmando(false);
    }
  };

  const handleAdicionarPaciente = () => {
    router.push(`/adicionar-paciente/${params.id}`);
  };

  const handleBaixarPDF = () => {
    if (viagem && viagem.codigo_viagem) {
      window.open(`/api/gerar-comprovante/${viagem.codigo_viagem}`, '_blank');
    } else {
      alert('Código da viagem não disponível');
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

  const ehAdministrador = usuarioLogado?.role === 'administrador';
  const totalPacientes = pacientes.length;
  const vagasDisponiveis = viagem.numero_vagas - totalPacientes;
  const viagemLotada = vagasDisponiveis <= 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header titulo="Detalhes da Viagem" mostrarVoltar voltarPara="/gerenciar-viagens" />

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        
        {/* Card Principal */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden mb-6">
          
          {/* Cabeçalho do Card (DATA E HORA) */}
          <div className="bg-gradient-to-r from-primary to-blue-600 text-white p-6 relative">
            
            {/* Botão de Editar Data/Hora (Apenas Admin) */}
            {ehAdministrador && !modoEdicao && (
              <button 
                onClick={iniciarEdicaoDataHora}
                className="absolute top-6 right-6 text-blue-100 hover:text-white transition-colors bg-white/10 p-2 rounded-lg"
                title="Editar Data e Hora"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}

            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-blue-100 text-sm font-medium mb-1">CÓDIGO</div>
                <div className="text-2xl font-bold tracking-wider">{viagem.codigo_viagem}</div>
              </div>
              {!editandoCampo && (
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase shadow-sm ${
                  viagem.status === 'confirmado' ? 'bg-green-500 text-white' : 
                  viagem.status === 'cancelado' ? 'bg-red-500 text-white' : 
                  'bg-yellow-400 text-yellow-900'
                }`}>
                  {formatarStatus(viagem.status)}
                </span>
              )}
            </div>

            {editandoCampo === 'datahora' ? (
              <div className="bg-white/10 p-4 rounded-lg mt-2 space-y-3 border border-white/20">
                {/* ... Formulário de edição de data/hora (mantido) ... */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-blue-100 mb-1">Nova Data</label>
                    <input type="date" value={novaDataViagem} onChange={(e) => setNovaDataViagem(e.target.value)} className="w-full px-3 py-2 text-sm rounded text-gray-900 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs text-blue-100 mb-1">Novo Horário</label>
                    <input type="text" value={novoHorarioSaida} onChange={(e) => setNovoHorarioSaida(formatarHorarioInput(e.target.value))} placeholder="00h00" className="w-full px-3 py-2 text-sm rounded text-gray-900 outline-none" />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={salvarDataHora} className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded text-sm font-medium">Salvar</button>
                  <button onClick={cancelarEdicao} className="flex-1 py-2 bg-white/20 hover:bg-white/30 text-white rounded text-sm font-medium">Cancelar</button>
                </div>
              </div>
            ) : (
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
            )}
          </div>

          {/* Informações Detalhadas (Destino e Ocupação) */}
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Card DESTINO */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-gray-500 uppercase">Destino</h3>
                  {ehAdministrador && !modoEdicao && (
                    <button onClick={iniciarEdicaoDestino} className="text-blue-600 hover:text-blue-800" title="Editar Destino">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                  )}
                </div>

                {editandoCampo === 'destino' ? (
                  <div className="space-y-3">
                    <select value={novoDestinoId} onChange={(e) => { setNovoDestinoId(e.target.value); if (e.target.value !== 'outro') setNovoDestinoNome(''); }} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none">
                      <option value="">Selecione...</option>
                      {ubsList.map((ubs) => (<option key={ubs.id} value={ubs.id}>{ubs.nome}</option>))}
                      <option value="outro">Outro (informar manualmente)</option>
                    </select>
                    {novoDestinoId === 'outro' && (
                      <input type="text" value={novoDestinoNome} onChange={(e) => setNovoDestinoNome(e.target.value)} placeholder="Nome do local" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none" />
                    )}
                    <input type="text" value={novoDestinoEndereco} onChange={(e) => setNovoDestinoEndereco(e.target.value)} placeholder="Endereço" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none" />
                    <div className="flex gap-2">
                      <button onClick={salvarDestino} className="flex-1 py-1.5 bg-green-600 text-white rounded text-xs">Salvar</button>
                      <button onClick={cancelarEdicao} className="flex-1 py-1.5 bg-gray-200 text-gray-700 rounded text-xs">Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="font-medium text-gray-900">{viagem.ubs_destino_nome || viagem.hospital_destino}</div>
                    {(viagem.ubs_destino_endereco || viagem.endereco_destino) && (
                       <div className="text-sm text-gray-500 mt-1">{viagem.ubs_destino_endereco || viagem.endereco_destino}</div>
                    )}
                    {viagem.ubs_destino_nome && (
                       <div className="text-xs text-blue-600 mt-1 font-medium">Unidade Básica de Saúde</div>
                    )}
                  </>
                )}
              </div>

              {/* Card OCUPAÇÃO */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
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
                
                {/* 3.3. Indicador de Comparecimento */}
                {totalPacientes > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Comparecimento:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-green-600">
                          {pacientes.filter(p => p.compareceu).length}
                        </span>
                        <span className="text-gray-400">/</span>
                        <span className="font-bold text-gray-900">{totalPacientes}</span>
                      </div>
                    </div>
                    <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 transition-all"
                        style={{ 
                          width: `${(pacientes.filter(p => p.compareceu).length / totalPacientes) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                )}
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
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">Motorista</div>
                      {ehAdministrador && !modoEdicao && (
                        <button onClick={iniciarEdicaoMotorista} className="text-blue-600 hover:text-blue-800" title="Editar Motorista">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                      )}
                    </div>
                    {editandoCampo === 'motorista' ? (
                      <div className="mt-2 space-y-2">
                        <select value={novoMotoristaId} onChange={(e) => setNovoMotoristaId(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none">
                          <option value="">Nenhum motorista</option>
                          {motoristas.map((m) => (<option key={m.id} value={m.id}>{m.nome_completo}</option>))}
                        </select>
                        <div className="flex gap-2">
                          <button onClick={salvarMotorista} className="flex-1 py-1.5 bg-green-600 text-white rounded text-xs">Salvar</button>
                          <button onClick={cancelarEdicao} className="flex-1 py-1.5 bg-gray-200 text-gray-700 rounded text-xs">Cancelar</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="font-medium text-gray-900">{viagem.motorista_nome || 'Não definido'}</div>
                        {viagem.motorista_telefone && <div className="text-xs text-gray-500">{viagem.motorista_telefone}</div>}
                      </>
                    )}
                  </div>
                </div>

                {/* Ônibus */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">Veículo</div>
                      {ehAdministrador && !modoEdicao && (
                        <button onClick={iniciarEdicaoOnibus} className="text-blue-600 hover:text-blue-800" title="Editar Ônibus">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                      )}
                    </div>
                    {editandoCampo === 'onibus' ? (
                      <div className="mt-2 space-y-2">
                        <select value={novoOnibusId} onChange={(e) => setNovoOnibusId(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none">
                          <option value="">Nenhum ônibus</option>
                          {onibus.map((o) => (<option key={o.id} value={o.id}>{o.placa} - {o.modelo}</option>))}
                        </select>
                        <div className="flex gap-2">
                          <button onClick={salvarOnibus} className="flex-1 py-1.5 bg-green-600 text-white rounded text-xs">Salvar</button>
                          <button onClick={cancelarEdicao} className="flex-1 py-1.5 bg-gray-200 text-gray-700 rounded text-xs">Cancelar</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {viagem.onibus_placa ? (
                          <>
                            <div className="font-medium text-gray-900">{viagem.onibus_placa}</div>
                            <div className="text-xs text-gray-500">{viagem.onibus_modelo} {viagem.onibus_cor ? `• ${viagem.onibus_cor}` : ''}</div>
                          </>
                        ) : (
                          <div className="text-sm text-gray-400 italic">Não definido</div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* 3.2. Lista de Pacientes (SUBSTITUÍDA) */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Lista de Passageiros</h2>
          
          {pacientes.length === 0 ? (
            <div className="text-center py-8 text-gray-400 border border-dashed rounded-lg">
              Nenhum paciente cadastrado nesta viagem ainda.
            </div>
          ) : (
            <div className="space-y-3">
              {pacientes.map((paciente) => (
                <div
                  key={paciente.paciente_id}
                  onClick={() => handleAbrirCheckin(paciente)}
                  className={`
                    border rounded-lg p-4 cursor-pointer transition-all
                    ${paciente.compareceu 
                       ? 'bg-green-50 border-green-300 hover:bg-green-100' 
                       : 'bg-white border-gray-200 hover:border-primary hover:shadow-md'
                    }
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-900">
                          {paciente.nome_completo}
                        </h4>
                        {paciente.compareceu && (
                          <span className="flex items-center gap-1 bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                            EMBARCADO
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-600 space-y-0.5">
                        <div>CPF: {paciente.cpf}</div>
                        <div>Cartão SUS: {paciente.cartao_sus}</div>
                      </div>
                      {paciente.motivo && (
                        <div className="mt-2 text-sm text-gray-700">
                          <span className="font-medium">Motivo:</span> {paciente.motivo}
                        </div>
                      )}
                      {paciente.horario_consulta && (
                        <div className="text-xs text-gray-600 mt-1">
                          Consulta: {paciente.horario_consulta.substring(0, 5)}
                        </div>
                      )}
                      {paciente.paciente_ubs_nome && (
                        <div className="text-xs text-gray-500 mt-1">
                          UBS: {paciente.paciente_ubs_nome}
                        </div>
                      )}
                    </div>
                    <div className={`ml-3 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                      ${paciente.compareceu ? 'bg-green-600' : 'bg-gray-200'}
                    `}>
                      {paciente.compareceu ? (
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  {ehAdministrador && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removerPacienteViagem(paciente.paciente_id);
                      }}
                      className="mt-3 text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Remover
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="space-y-3">
          {/* Botão de PDF */}
          <button
            onClick={handleBaixarPDF}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-lg shadow-md transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Baixar Comprovante (PDF)
          </button>

          {/* Botão Confirmar Viagem (apenas se pendente) */}
          {viagem.status === 'pendente' && ehAdministrador && (
            <button
              onClick={handleConfirmarViagem}
              disabled={confirmando}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 rounded-lg shadow-md transition-all flex items-center justify-center gap-2"
            >
              {confirmando ? 'Confirmando...' : 'Confirmar Realização da Viagem'}
            </button>
          )}

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
        </div>

      </main>
    </div>
  );
}