'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import { verificarAutenticacao } from '../utils/helpers';

/**
 * PÁGINA DE CRIAÇÃO DE VIAGEM - FLUXO SIMPLIFICADO (2 ETAPAS)
 * Etapa 1: Informações Gerais
 * Etapa 2: Passageiros (com destino integrado)
 */
export default function CriarViagemPage() {
  const router = useRouter();
  
  // Controle de etapas (AGORA SÓ 1 e 2)
  const [etapaAtual, setEtapaAtual] = useState(1);
  
  // ETAPA 1: Informações básicas da viagem
  const [ubsDestinoId, setUbsDestinoId] = useState('');
  const [enderecoUbsDestino, setEnderecoUbsDestino] = useState('');
  const [nomeUbsOutro, setNomeUbsOutro] = useState('');
  
  const [dataViagem, setDataViagem] = useState('');
  const [horarioSaida, setHorarioSaida] = useState('');
  const [numeroVagas, setNumeroVagas] = useState('');
  const [motoristaId, setMotoristaId] = useState('');
  const [onibusId, setOnibusId] = useState('');
  
  // ETAPA 2: Pacientes (Destino integrado aqui)
  const [pacientes, setPacientes] = useState([]);
  const [mostrarFormPaciente, setMostrarFormPaciente] = useState(false);
  
  // Busca de paciente
  const [buscaPaciente, setBuscaPaciente] = useState('');
  const [pacientesBusca, setPacientesBusca] = useState([]);
  const [pacienteSelecionado, setPacienteSelecionado] = useState(null);
  const [buscandoPaciente, setBuscandoPaciente] = useState(false);
  
  // Formulário de adicionar paciente
  const [motivoPaciente, setMotivoPaciente] = useState('');
  const [horarioConsulta, setHorarioConsulta] = useState('');
  const [medicoId, setMedicoId] = useState('');
  const [vaiAcompanhado, setVaiAcompanhado] = useState(false);
  const [nomeAcompanhante, setNomeAcompanhante] = useState('');
  const [buscarEmCasa, setBuscarEmCasa] = useState(false);
  const [enderecoColeta, setEnderecoColeta] = useState('');
  const [horarioColeta, setHorarioColeta] = useState('');
  const [observacoesColeta, setObservacoesColeta] = useState('');
  const [vagasOcupadas, setVagasOcupadas] = useState(0);

  // CAMPOS DE DESTINO DO PACIENTE (Antiga Etapa 2 integrada)
  const [nomeParada, setNomeParada] = useState('');
  const [enderecoParada, setEnderecoParada] = useState('');
  const [horarioParada, setHorarioParada] = useState('');
  const [observacoesParada, setObservacoesParada] = useState('');
  
  // Dados auxiliares
  const [motoristas, setMotoristas] = useState([]);
  const [onibus, setOnibus] = useState([]);
  const [ubsList, setUbsList] = useState([]);
  const [medicos, setMedicos] = useState([]);
  
  // Estados de controle
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [criando, setCriando] = useState(false);

  useEffect(() => {
    const autenticado = verificarAutenticacao(router);
    if (autenticado) {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (token) {
        const usuario = JSON.parse(token);
        if (usuario.role !== 'administrador') {
          router.push('/busca');
          return;
        }
      }
    }
    
    
    carregarDados();
  }, [router]);

  useEffect(() => {
    const total = pacientes.reduce((acc, pac) => {
      return acc + (pac.vai_acompanhado ? 2 : 1);
    }, 0);
    setVagasOcupadas(total);
  }, [pacientes]);

  const carregarDados = async () => {
    try {
      const [resUbs, resMotoristas, resOnibus, resMedicos] = await Promise.all([
        fetch('/api/listar-ubs'),
        fetch('/api/listar-motoristas'),
        fetch('/api/listar-onibus'),
        fetch('/api/listar-medicos')
      ]);

      if (resUbs.ok) {
        const dataUbs = await resUbs.json();
        setUbsList(dataUbs.ubs || []);
      }

      if (resMotoristas.ok) {
        const dataMotoristas = await resMotoristas.json();
        setMotoristas(dataMotoristas.motoristas || []);
      }

      if (resOnibus.ok) {
        const dataOnibus = await resOnibus.json();
        setOnibus(dataOnibus.onibus || []);
      }

      if (resMedicos.ok) {
        const dataMedicos = await resMedicos.json();
        setMedicos(dataMedicos.medicos || []);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  // ============================================
  // FUNÇÕES DE FORMATAÇÃO
  // ============================================
  
  const formatarHorario = (valor) => {
    const numeros = valor.replace(/\D/g, '');
    if (numeros.length <= 2) {
      return numeros;
    } else if (numeros.length <= 4) {
      return `${numeros.slice(0, 2)}h${numeros.slice(2)}`;
    }
    return `${numeros.slice(0, 2)}h${numeros.slice(2, 4)}`;
  };

  const handleOnibusChange = (e) => {
    const selectedId = e.target.value;
    setOnibusId(selectedId);
    
    if (selectedId) {
      const onibusSelecionado = onibus.find(o => o.id === parseInt(selectedId));
      if (onibusSelecionado) {
        setNumeroVagas(onibusSelecionado.capacidade_passageiros.toString());
      }
    } else {
      setNumeroVagas('');
    }
  };

  // ============================================
  // ETAPA 1: VALIDAÇÃO E NAVEGAÇÃO
  // ============================================
  
  const validarEtapa1 = () => {
    if (!dataViagem || !horarioSaida) {
      setErro('Preencha data e horário de saída');
      return false;
    }

    if (!ubsDestinoId) {
      setErro('Selecione a cidade de destino');
      return false;
    }

    if (ubsDestinoId === 'outro' && !nomeUbsOutro) {
      setErro('Informe o nome do local de destino');
      return false;
    }

    if (!numeroVagas || parseInt(numeroVagas) < 1) {
      setErro('Número de vagas deve ser maior que zero');
      return false;
    }

    const regexHorario = /^\d{2}h\d{2}$/;
    if (!regexHorario.test(horarioSaida)) {
      setErro('Horário deve estar no formato 10h00');
      return false;
    }

    return true;
  };

  const avancarParaEtapa2 = () => {
    setErro('');
    if (validarEtapa1()) {
      setEtapaAtual(2);
      window.scrollTo(0, 0);
    }
  };

  const voltarParaEtapa1 = () => {
    setEtapaAtual(1);
    window.scrollTo(0, 0);
  };

  // ============================================
  // ETAPA 2: BUSCAR E ADICIONAR PACIENTE
  // ============================================
  
  const buscarPaciente = async () => {
    if (!buscaPaciente.trim()) {
      setErro('Digite CPF ou nome do paciente');
      return;
    }

    setBuscandoPaciente(true);
    setErro('');

    try {
      const response = await fetch(`/api/buscar-paciente?busca=${encodeURIComponent(buscaPaciente)}`);
      const data = await response.json();

      if (response.ok && data.pacientes && data.pacientes.length > 0) {
        setPacientesBusca(data.pacientes);
      } else {
        setErro('Nenhum paciente encontrado');
        setPacientesBusca([]);
      }
    } catch (error) {
      setErro('Erro ao buscar paciente');
      console.error('Erro:', error);
    } finally {
      setBuscandoPaciente(false);
    }
  };

  const selecionarPacienteDaBusca = (paciente) => {
    if (pacientes.find(p => p.paciente_id === paciente.paciente_id)) {
      setErro('Este paciente já está na viagem');
      return;
    }

    setPacienteSelecionado(paciente);
    setMostrarFormPaciente(true);
    setPacientesBusca([]);
    setBuscaPaciente('');
    setErro('');
    
    // Resetar campos
    setBuscarEmCasa(false);
    setEnderecoColeta(paciente.endereco || '');
    // Pré-preencher nome do destino se houver motivo
    setNomeParada(''); 
  };


const adicionarPacienteAViagem = () => {
  if (!pacienteSelecionado) {
    setErro('Selecione um paciente');
    return;
  }

  if (!motivoPaciente) {
    setErro('Informe o motivo da viagem');
    return;
  }

  if (!nomeParada) {
    setErro('Informe o nome do destino do paciente');
    return;
  }

  if (vaiAcompanhado && !nomeAcompanhante) {
    setErro('Informe o nome do acompanhante');
    return;
  }

  // ✅ VALIDAÇÃO DE VAGAS - Considera acompanhante
  const vagasNecessarias = vaiAcompanhado ? 2 : 1;
  const vagasRestantes = parseInt(numeroVagas) - vagasOcupadas;
  
  if (vagasRestantes < vagasNecessarias) {
    setErro(`Vagas insuficientes. Necessário: ${vagasNecessarias} vaga(s), disponível: ${vagasRestantes} vaga(s).`);
    return;
  }

  // Criar parada temporária para este paciente
  const paradaTemp = {
    id: Date.now() + Math.random(),
    ordem: pacientes.length + 1,
    nome: nomeParada,
    endereco: enderecoParada,
    horario: horarioParada,
    observacoes: observacoesParada
  };

  const novoPaciente = {
    id: Date.now(),
    paciente_id: pacienteSelecionado.paciente_id,
    cpf: pacienteSelecionado.cpf,
    nome: pacienteSelecionado.nome_completo,
    telefone: pacienteSelecionado.telefone,
    endereco_cadastro: pacienteSelecionado.endereco,
    motivo: motivoPaciente,
    horario_consulta: horarioConsulta,
    medico_id: medicoId || null,
    vai_acompanhado: vaiAcompanhado,
    nome_acompanhante: vaiAcompanhado ? nomeAcompanhante : null,
    buscar_em_casa: buscarEmCasa,
    endereco_coleta: enderecoColeta || null,
    parada_coleta_id: paradaTemp.id,
    parada_destino: paradaTemp,
    horario_coleta: horarioColeta || null,
    observacoes_coleta: observacoesColeta || null
  };

  setPacientes([...pacientes, novoPaciente]);
  
  limparFormPaciente();
  limparFormParada();
  
  setMostrarFormPaciente(false);
  setPacienteSelecionado(null);
  setErro('');
};

  const removerPaciente = (id) => {
    setPacientes(pacientes.filter(p => p.id !== id));
  };

  const limparFormPaciente = () => {
    setMotivoPaciente('');
    setHorarioConsulta('');
    setMedicoId('');
    setVaiAcompanhado(false);
    setNomeAcompanhante('');
    setBuscarEmCasa(false);
    setEnderecoColeta('');
    setHorarioColeta('');
    setObservacoesColeta('');
  };

  const limparFormParada = () => {
    setNomeParada('');
    setEnderecoParada('');
    setHorarioParada('');
    setObservacoesParada('');
  };

  // ============================================
  // FINALIZAR E CRIAR VIAGEM
  // ============================================
  
  const finalizarCriacaoViagem = async () => {
    if (pacientes.length === 0) {
      setErro('Adicione pelo menos um paciente à viagem');
      return;
    }

    setCriando(true);
    setErro('');

    try {
      // 1. Criar viagem
      const horarioSaidaConvertido = horarioSaida.replace('h', ':');
      
      const dadosViagem = {
        // ✅ Se for cidade pré-definida, usa o valor do select. Se for "outro", usa o digitado
        hospital_destino: ubsDestinoId === 'outro' ? nomeUbsOutro : ubsDestinoId,
        endereco_destino: enderecoUbsDestino || null,
        ubs_destino_id: null, // ✅ Sempre null agora, pois não é mais UBS
        data_viagem: dataViagem,
        horario_saida: horarioSaidaConvertido,
        numero_vagas: parseInt(numeroVagas),
        motorista_id: motoristaId || null,
        onibus_id: onibusId || null
      };

      const responseViagem = await fetch('/api/criar-viagem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosViagem),
      });

      // ✅ CORREÇÃO: Nome diferente para não conflitar com o estado 'dataViagem'
      const respostaCriacao = await responseViagem.json();

      if (!responseViagem.ok) {
        throw new Error(respostaCriacao.erro || 'Erro ao criar viagem');
      }

      const viagemId = respostaCriacao.viagem.id;

      // 2. Criar paradas únicas (extrair dos pacientes)
      const paradasUnicas = [];
      const mapParadasIds = {}; // Mapeia ID temporário -> ID real do banco

      // Agrupar destinos únicos para não criar duplicados se for o mesmo lugar
      pacientes.forEach(pac => {
        if (pac.parada_destino) {
          const jaExiste = paradasUnicas.find(p => 
             p.nome === pac.parada_destino.nome && 
             p.endereco === pac.parada_destino.endereco
          );
          
          if (!jaExiste) {
            paradasUnicas.push({
              ...pac.parada_destino,
              ordem: paradasUnicas.length + 1 // Reordenar sequencialmente
            });
          }
        }
      });

      // Criar paradas no banco
      for (const parada of paradasUnicas) {
        const horarioParadaConvertido = parada.horario ? parada.horario.replace('h', ':') : null;
        
        const responseParada = await fetch('/api/criar-parada', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            viagem_id: viagemId,
            ordem: parada.ordem,
            nome_parada: parada.nome,
            endereco_parada: parada.endereco || null,
            horario_parada: horarioParadaConvertido,
            observacoes: parada.observacoes || null
          }),
        });

        const dataParada = await responseParada.json();
        
        if (responseParada.ok) {
          // Mapear todos os pacientes que usavam essa parada (pelo nome/endereço)
          pacientes.forEach(pac => {
            if (pac.parada_destino && 
                pac.parada_destino.nome === parada.nome && 
                pac.parada_destino.endereco === parada.endereco) {
              mapParadasIds[pac.parada_destino.id] = dataParada.parada.id;
            }
          });
        }
      }

      // 3. Adicionar pacientes
      for (const paciente of pacientes) {
        const horarioConsultaConvertido = paciente.horario_consulta ? paciente.horario_consulta.replace('h', ':') : null;
        const horarioColetaConvertido = paciente.horario_coleta ? paciente.horario_coleta.replace('h', ':') : null;
        
        // Converter ID temporário de parada para ID real
        // Se tiver parada_destino, usamos o ID mapeado. Se não, null.
        const paradaColetaIdReal = paciente.parada_destino 
          ? mapParadasIds[paciente.parada_destino.id] 
          : null;

        await fetch('/api/adicionar-paciente-viagem', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            viagem_id: viagemId,
            paciente_id: paciente.paciente_id,
            motivo: paciente.motivo,
            horario_consulta: horarioConsultaConvertido,
            medico_id: paciente.medico_id,
            vai_acompanhado: paciente.vai_acompanhado,
            nome_acompanhante: paciente.nome_acompanhante,
            buscar_em_casa: paciente.buscar_em_casa,
            endereco_coleta: paciente.endereco_coleta,
            parada_coleta_id: paradaColetaIdReal,
            horario_coleta: horarioColetaConvertido,
            observacoes_coleta: paciente.observacoes_coleta
          }),
        });
      }

      setSucesso('Viagem criada com sucesso!');
      setTimeout(() => {
        router.push('/gerenciar-viagens');
      }, 2000);

    } catch (error) {
      setErro(error.message || 'Erro ao criar viagem');
      console.error('Erro:', error);
    } finally {
      setCriando(false);
    }
  };

  // ============================================
  // RENDERIZAÇÃO
  // ============================================

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header titulo="Criar Nova Viagem" mostrarVoltar voltarPara="/gerenciar-viagens" />

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        
        {/* PROGRESS BAR - Agora só 2 etapas */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-medium ${etapaAtual >= 1 ? 'text-primary' : 'text-gray-400'}`}>
              Informações
            </span>
            <span className={`text-xs font-medium ${etapaAtual >= 2 ? 'text-primary' : 'text-gray-400'}`}>
              Passageiros
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className={`h-2 flex-1 rounded-full ${etapaAtual >= 1 ? 'bg-primary' : 'bg-gray-300'}`}></div>
            <div className={`h-2 flex-1 rounded-full ${etapaAtual >= 2 ? 'bg-primary' : 'bg-gray-300'}`}></div>
          </div>
        </div>

        {/* ============================================ */}
        {/* ETAPA 1: INFORMAÇÕES DA VIAGEM */}
        {/* ============================================ */}
        {etapaAtual === 1 && (
          <div className="space-y-6">
            
            {/* Destino da Viagem */}
<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
  <h3 className="text-sm font-semibold text-gray-700 mb-4">
    Destino da Viagem
  </h3>
  <div className="space-y-4">
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-2">
        Selecione a Cidade *
      </label>
      <select
        value={ubsDestinoId}
        onChange={(e) => {
          setUbsDestinoId(e.target.value);
          if (e.target.value !== 'outro') {
            setNomeUbsOutro('');
          }
        }}
        className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
      >
        <option value="">Selecione...</option>
        <option value="João Pessoa">João Pessoa</option>
        <option value="Mamanguape">Mamanguape</option>
        <option value="Campina Grande">Campina Grande</option>
        <option value="Guarabira">Guarabira</option>
        <option value="Patos">Patos</option>
        <option value="Cajazeiras">Cajazeiras</option>
        <option value="Sousa">Sousa</option>
        <option value="outro">Outro (informar manualmente)</option>
      </select>
    </div>

    {ubsDestinoId === 'outro' && (
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">
          Nome da Cidade *
        </label>
        <input
          type="text"
          value={nomeUbsOutro}
          onChange={(e) => setNomeUbsOutro(e.target.value)}
          placeholder="Ex: Monteiro, Princesa Isabel..."
          className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
        />
      </div>
    )}

    <div>
      <label className="block text-xs font-medium text-gray-600 mb-2">
        Endereço do local de partida (Opcional)
      </label>
      <input
        type="text"
        value={enderecoUbsDestino}
        onChange={(e) => setEnderecoUbsDestino(e.target.value)}
        placeholder="Ex: Hospital Regional, UBS Central, Clínica..."
        className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
      />
      <p className="text-xs text-gray-500 mt-1">
        Opcional: Informe o local específico dentro da cidade
      </p>
    </div>
  </div>
</div>

            {/* Data e Horário */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">
                Data e Horário
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">
                    Data *
                  </label>
                  <input
                    type="date"
                    value={dataViagem}
                    onChange={(e) => setDataViagem(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">
                    Saída *
                  </label>
                  <input
                    type="text"
                    value={horarioSaida}
                    onChange={(e) => setHorarioSaida(formatarHorario(e.target.value))}
                    placeholder="07h00"
                    maxLength={5}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Ônibus e Motorista */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">
                Veículo e Motorista
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">
                    Ônibus
                  </label>
                  <select
                    value={onibusId}
                    onChange={handleOnibusChange}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  >
                    <option value="">Selecione...</option>
                    {onibus.map((bus) => (
                      <option key={bus.id} value={bus.id}>
                        {bus.placa} - {bus.modelo} ({bus.capacidade_passageiros} lugares)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">
                    Vagas *
                  </label>
                  <input
                    type="number"
                    value={numeroVagas}
                    onChange={(e) => setNumeroVagas(e.target.value)}
                    min="1"
                    placeholder="Número de vagas"
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">
                    Motorista
                  </label>
                  <select
                    value={motoristaId}
                    onChange={(e) => setMotoristaId(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  >
                    <option value="">Selecione...</option>
                    {motoristas.map((motorista) => (
                      <option key={motorista.id} value={motorista.id}>
                        {motorista.nome_completo}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {erro && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {erro}
              </div>
            )}

            <button
              type="button"
              onClick={avancarParaEtapa2}
              className="w-full py-4 bg-primary text-white rounded-lg hover:bg-primary-dark transition-all font-semibold shadow-md"
            >
              Próximo: Adicionar Passageiros →
            </button>
          </div>
        )}

        {/* ============================================ */}
        {/* ETAPA 2: PACIENTES */}
        {/* ============================================ */}
        {etapaAtual === 2 && (
          <div className="space-y-6">
            
            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                Adicione os pacientes que vão participar desta viagem. É obrigatório adicionar pelo menos um paciente.
              </p>
            </div>

            {/* Lista de Pacientes */}
            {pacientes.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700">
                  Pacientes Cadastrados ({pacientes.length} pessoa{pacientes.length !== 1 ? 's' : ''} • {vagasOcupadas}/{numeroVagas} vagas)
                </h3>
                
                {pacientes.map((pac) => {
                  const destino = pac.parada_destino;
                  
                  return (
                    <div key={pac.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          {/* Nome e CPF */}
                          <div className="font-semibold text-gray-900 text-sm">{pac.nome}</div>
                          <div className="text-xs text-gray-500">{pac.cpf}</div>
                          <div className="text-xs text-gray-600 mt-1">{pac.motivo}</div>
                          
                          {/* Destino - DESTACADO */}
                          {destino && (
                            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="flex items-start gap-2">
                                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <div className="flex-1">
                                  <div className="text-xs font-bold text-blue-800">DESTINO</div>
                                  <div className="text-sm font-semibold text-blue-900">{destino.nome}</div>
                                  {destino.endereco && (
                                    <div className="text-xs text-blue-700 mt-1">{destino.endereco}</div>
                                  )}
                                  {destino.horario && (
                                    <div className="text-xs text-blue-600 mt-1">⏰ Horário: {destino.horario}</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Acompanhante - CORREÇÃO VISUAL AQUI */}
                          {pac.vai_acompanhado && (
                            <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                              👥 {pac.nome_acompanhante} (2 vagas)
                            </div>
                          )}
                          
                          {/* Coleta */}
                          {pac.buscar_em_casa && (
                            <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                              🏠 Buscar em: {pac.endereco_coleta}
                            </div>
                          )}
                        </div>
                        
                        {/* Botão Remover */}
                        <button
                          type="button"
                          onClick={() => removerPaciente(pac.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Buscar Paciente */}
            {!mostrarFormPaciente && pacientes.length < parseInt(numeroVagas || '0') && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">
                  Buscar Paciente
                </h3>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={buscaPaciente}
                    onChange={(e) => setBuscaPaciente(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && buscarPaciente()}
                    placeholder="Digite CPF ou nome"
                    className="flex-1 px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                  <button
                    type="button"
                    onClick={buscarPaciente}
                    disabled={buscandoPaciente}
                    className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-all font-medium text-sm"
                  >
                    {buscandoPaciente ? '...' : 'Buscar'}
                  </button>
                </div>

                {pacientesBusca.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {pacientesBusca.map((pac) => (
                      <div
                        key={pac.paciente_id}
                        onClick={() => selecionarPacienteDaBusca(pac)}
                        className="p-3 border border-gray-200 rounded-lg hover:border-primary hover:bg-blue-50 cursor-pointer transition-all"
                      >
                        <div className="font-medium text-gray-900 text-sm">{pac.nome_completo}</div>
                        <div className="text-xs text-gray-500">{pac.cpf} • {pac.cartao_sus}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Formulário de Adicionar Paciente */}
            {mostrarFormPaciente && pacienteSelecionado && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-700">
                    Adicionar: {pacienteSelecionado.nome_completo}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setMostrarFormPaciente(false);
                      setPacienteSelecionado(null);
                      limparFormPaciente();
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">
                    Motivo da Viagem *
                  </label>
                  <input
                    type="text"
                    value={motivoPaciente}
                    onChange={(e) => setMotivoPaciente(e.target.value)}
                    placeholder="Ex: Consulta cardiológica"
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      Horário Consulta
                    </label>
                    <input
                      type="text"
                      value={horarioConsulta}
                      onChange={(e) => setHorarioConsulta(formatarHorario(e.target.value))}
                      placeholder="10h00"
                      maxLength={5}
                      className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      Médico
                    </label>
                    <select
                      value={medicoId}
                      onChange={(e) => setMedicoId(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    >
                      <option value="">Selecione...</option>
                      {medicos.map((medico) => (
                        <option key={medico.id} value={medico.id}>
                          {medico.nome_completo}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* DESTINO DO PACIENTE - NOVO */}
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Destino deste Paciente *
                  </h4>
                  <div className="space-y-3">
                    {/* Nome do Destino */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">
                        Nome do Local *
                      </label>
                      <input
                        type="text"
                        value={nomeParada}
                        onChange={(e) => setNomeParada(e.target.value)}
                        placeholder="Ex: Hospital Regional, UBS Central, Clínica..."
                        className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                      />
                    </div>
                    {/* Endereço do Destino */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">
                        Endereço do Destino
                      </label>
                      <input
                        type="text"
                        value={enderecoParada}
                        onChange={(e) => setEnderecoParada(e.target.value)}
                        placeholder="Endereço completo (opcional)"
                        className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                      />
                    </div>
                    {/* Horário no Destino */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">
                        Horário no Destino
                      </label>
                      <input
                        type="text"
                        value={horarioParada}
                        onChange={(e) => setHorarioParada(formatarHorario(e.target.value))}
                        placeholder="10h00"
                        maxLength={5}
                        className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Horário estimado de chegada neste destino
                      </p>
                    </div>
                    {/* Observações do Destino */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">
                        Observações do Destino
                      </label>
                      <textarea
                        value={observacoesParada}
                        onChange={(e) => setObservacoesParada(e.target.value)}
                        placeholder="Informações adicionais sobre o destino (opcional)"
                        rows={2}
                        className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Acompanhante */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-start gap-2 mb-3">
                    <input
                      type="checkbox"
                      id="vaiAcompanhado"
                      checked={vaiAcompanhado}
                      onChange={(e) => setVaiAcompanhado(e.target.checked)}
                      disabled={parseInt(numeroVagas) - vagasOcupadas < 2}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-2 focus:ring-primary mt-1"
                    />
                    <div className="flex-1">
                      <label 
                        htmlFor="vaiAcompanhado" 
                        className={`text-sm font-medium ${
                          parseInt(numeroVagas) - vagasOcupadas < 2 ? 'text-gray-400' : 'text-gray-700'
                        }`}
                      >
                        Vai acompanhado (ocupa 2 vagas)
                      </label>
                      {parseInt(numeroVagas) - vagasOcupadas < 2 && (
                        <p className="text-xs text-red-600 mt-1">
                          Vagas insuficientes. São necessárias 2 vagas para levar acompanhante.
                        </p>
                      )}
                      {parseInt(numeroVagas) - vagasOcupadas >= 2 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Vagas restantes: {parseInt(numeroVagas) - vagasOcupadas}
                        </p>
                      )}
                    </div>
                  </div>

                  {vaiAcompanhado && (
                    <input
                      type="text"
                      value={nomeAcompanhante}
                      onChange={(e) => setNomeAcompanhante(e.target.value)}
                      placeholder="Nome do acompanhante"
                      className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    />
                  )}
                </div>

                {/* Coleta */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="checkbox"
                      id="buscarEmCasa"
                      checked={buscarEmCasa}
                      onChange={(e) => {
                        setBuscarEmCasa(e.target.checked);
                        if (e.target.checked) {
                          setEnderecoColeta(pacienteSelecionado.endereco || '');
                        }
                      }}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-2 focus:ring-primary"
                    />
                    <label htmlFor="buscarEmCasa" className="text-sm font-medium text-gray-700">
                      Buscar em casa
                    </label>
                  </div>

                  {buscarEmCasa && (
                    <input
                      type="text"
                      value={enderecoColeta}
                      onChange={(e) => setEnderecoColeta(e.target.value)}
                      placeholder="Endereço de coleta"
                      className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none mb-3"
                    />
                  )}
                </div>

                <button
                  type="button"
                  onClick={adicionarPacienteAViagem}
                  className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-semibold text-sm"
                >
                  Adicionar Paciente
                </button>
              </div>
            )}

            {/* Mensagens */}
            {erro && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {erro}
              </div>
            )}

            {sucesso && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                {sucesso}
              </div>
            )}

            {/* Botões Finais */}
            <div className="space-y-3">
              {pacientes.length > 0 && (
                <button
                  type="button"
                  onClick={finalizarCriacaoViagem}
                  disabled={criando}
                  className={`w-full py-4 rounded-lg font-semibold text-white shadow-md transition-all ${
                    criando
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {criando ? 'Criando Viagem...' : '✓ Criar Viagem Completa'}
                </button>
              )}
              
              <button
                type="button"
                onClick={voltarParaEtapa1}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium"
              >
                ← Voltar
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}