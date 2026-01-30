// app/adicionar-hospital/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import { verificarAutenticacao } from '../utils/helpers';

/**
 * PÁGINA DE ADICIONAR HOSPITAL/UBS
 * Com sistema de vinculação de médicos
 */
export default function AdicionarHospitalPage() {
  const router = useRouter();
  
  // Tipo de unidade
  const [tipoUnidade, setTipoUnidade] = useState('ubs'); // 'ubs' ou 'hospital'
  
  // Dados da unidade
  const [nome, setNome] = useState('');
  const [endereco, setEndereco] = useState('');
  const [cep, setCep] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [horarioFuncionamento, setHorarioFuncionamento] = useState('');
  
  // Campos específicos para Hospital
  const [cnpj, setCnpj] = useState('');
  const [tipoAtendimento, setTipoAtendimento] = useState('');
  const [especialidades, setEspecialidades] = useState('');
  
  // Médicos vinculados
  const [medicosVinculados, setMedicosVinculados] = useState([]);
  const [mostrarFormMedico, setMostrarFormMedico] = useState(false);
  
  // Formulário de médico
  const [medicoSelecionadoId, setMedicoSelecionadoId] = useState('');
  const [atuacaoMedico, setAtuacaoMedico] = useState('');
  const [diasAtendimentoMedico, setDiasAtendimentoMedico] = useState('');
  const [horarioAtendimentoMedico, setHorarioAtendimentoMedico] = useState('');
  
  // Lista de médicos cadastrados
  const [medicosList, setMedicosList] = useState([]);
  
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [cadastrando, setCadastrando] = useState(false);

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
    
    carregarMedicos();
  }, [router]);

  const carregarMedicos = async () => {
    try {
      const response = await fetch('/api/listar-medicos');
      if (response.ok) {
        const data = await response.json();
        setMedicosList(data.medicos || []);
      }
    } catch (error) {
      console.error('Erro ao carregar médicos:', error);
    }
  };

  const formatarTelefone = (valor) => {
    const numeros = valor.replace(/\D/g, '');
    return numeros
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4,5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  const formatarCEP = (valor) => {
    const numeros = valor.replace(/\D/g, '');
    return numeros.replace(/(\d{5})(\d)/, '$1-$2');
  };

  const formatarCNPJ = (valor) => {
    const numeros = valor.replace(/\D/g, '');
    return numeros
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  };

  // ============================================
  // MÉDICOS VINCULADOS
  // ============================================
  
  const adicionarMedico = () => {
    if (!medicoSelecionadoId) {
      setErro('Selecione um médico');
      return;
    }

    if (!atuacaoMedico) {
      setErro('Informe a atuação do médico');
      return;
    }

    // Verificar se médico já está vinculado
    const jaExiste = medicosVinculados.find(m => m.medico_id === medicoSelecionadoId);
    if (jaExiste) {
      setErro('Este médico já está vinculado');
      return;
    }

    const medicoSelecionado = medicosList.find(m => m.id === parseInt(medicoSelecionadoId));

    const novoVinculo = {
      id: Date.now(),
      medico_id: medicoSelecionadoId,
      medico_nome: medicoSelecionado.nome_completo,
      medico_crm: medicoSelecionado.crm,
      medico_especializacao: medicoSelecionado.especializacao,
      atuacao: atuacaoMedico,
      dias: diasAtendimentoMedico,
      horario: horarioAtendimentoMedico
    };

    setMedicosVinculados([...medicosVinculados, novoVinculo]);
    limparFormMedico();
    setMostrarFormMedico(false);
    setErro('');
  };

  const removerMedico = (id) => {
    setMedicosVinculados(medicosVinculados.filter(m => m.id !== id));
  };

  const limparFormMedico = () => {
    setMedicoSelecionadoId('');
    setAtuacaoMedico('');
    setDiasAtendimentoMedico('');
    setHorarioAtendimentoMedico('');
  };

  // ============================================
  // VALIDAÇÃO E ENVIO
  // ============================================
  
  const validarFormulario = () => {
    if (!nome || !endereco || !cep || !telefone) {
      setErro('Preencha todos os campos obrigatórios');
      return false;
    }

    if (tipoUnidade === 'hospital' && !cnpj) {
      setErro('CNPJ é obrigatório para hospitais');
      return false;
    }

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setErro('E-mail inválido');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setSucesso('');

    if (!validarFormulario()) {
      return;
    }

    setCadastrando(true);

    try {
      const dados = {
        tipo: tipoUnidade,
        nome: nome,
        endereco: endereco,
        cep: cep,
        telefone: telefone,
        email: email || null,
        responsavel: responsavel || null,
        horario_funcionamento: horarioFuncionamento || null,
        cnpj: tipoUnidade === 'hospital' ? cnpj : null,
        tipo_atendimento: tipoUnidade === 'hospital' ? tipoAtendimento : null,
        especialidades: tipoUnidade === 'hospital' ? especialidades : null,
        medicos_vinculados: medicosVinculados.map(m => ({
          medico_id: parseInt(m.medico_id),
          atuacao: m.atuacao,
          dias_atendimento: m.dias || null,
          horario_atendimento: m.horario || null
        }))
      };

      const response = await fetch('/api/cadastrar-hospital', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dados),
      });

      const data = await response.json();

      if (response.ok) {
        setSucesso('Hospital/UBS cadastrado com sucesso!');
        setTimeout(() => {
          router.push('/cadastrar-hospital');
        }, 2000);
      } else {
        setErro(data.erro || 'Erro ao cadastrar hospital/UBS');
      }
    } catch (error) {
      setErro('Erro ao conectar com o servidor');
      console.error('Erro:', error);
    } finally {
      setCadastrando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header titulo="Adicionar Hospital/UBS" mostrarVoltar voltarPara="/cadastrar-hospital" />

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Seleção do Tipo */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Tipo de Unidade
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTipoUnidade('ubs')}
                className={`py-3 px-4 rounded-lg border text-center transition-all ${
                  tipoUnidade === 'ubs'
                    ? 'border-primary bg-primary text-white shadow-sm'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                <div className="font-semibold">UBS</div>
                <div className="text-xs mt-1 opacity-80">Unidade Básica de Saúde</div>
              </button>
              <button
                type="button"
                onClick={() => setTipoUnidade('hospital')}
                className={`py-3 px-4 rounded-lg border text-center transition-all ${
                  tipoUnidade === 'hospital'
                    ? 'border-primary bg-primary text-white shadow-sm'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                <div className="font-semibold">Hospital</div>
                <div className="text-xs mt-1 opacity-80">Hospital / Clínica</div>
              </button>
            </div>
          </div>

          {/* Dados Básicos */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Informações Básicas
                </h3>
                <p className="text-sm text-gray-500">
                  Dados da unidade de saúde
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da {tipoUnidade === 'ubs' ? 'UBS' : 'Hospital'} *
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder={tipoUnidade === 'ubs' ? 'Ex: UBS Centro' : 'Ex: Hospital Regional'}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Endereço Completo *
                </label>
                <input
                  type="text"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  placeholder="Rua, número, bairro, cidade"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CEP *
                  </label>
                  <input
                    type="text"
                    value={cep}
                    onChange={(e) => setCep(formatarCEP(e.target.value))}
                    placeholder="58360-000"
                    maxLength={9}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone *
                  </label>
                  <input
                    type="text"
                    value={telefone}
                    onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
                    placeholder="(83) 3333-4444"
                    maxLength={15}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contato@unidade.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Responsável
                  </label>
                  <input
                    type="text"
                    value={responsavel}
                    onChange={(e) => setResponsavel(e.target.value)}
                    placeholder="Nome do responsável"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Horário de Funcionamento
                </label>
                <input
                  type="text"
                  value={horarioFuncionamento}
                  onChange={(e) => setHorarioFuncionamento(e.target.value)}
                  placeholder="Ex: Segunda a Sexta, 07:00 às 17:00"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>
            </div>
          </div>

          {/* Campos específicos para Hospital */}
          {tipoUnidade === 'hospital' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Dados do Hospital
                  </h3>
                  <p className="text-sm text-gray-500">
                    Informações específicas
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CNPJ *
                  </label>
                  <input
                    type="text"
                    value={cnpj}
                    onChange={(e) => setCnpj(formatarCNPJ(e.target.value))}
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Atendimento
                  </label>
                  <input
                    type="text"
                    value={tipoAtendimento}
                    onChange={(e) => setTipoAtendimento(e.target.value)}
                    placeholder="Ex: Emergência, Consultas, Cirurgias"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Especialidades Disponíveis
                  </label>
                  <textarea
                    value={especialidades}
                    onChange={(e) => setEspecialidades(e.target.value)}
                    placeholder="Ex: Cardiologia, Ortopedia, Pediatria..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Médicos Vinculados */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Médicos Vinculados
                </h3>
                <p className="text-sm text-gray-500">
                  Médicos que atendem nesta unidade
                </p>
              </div>
            </div>

            {/* Lista de Médicos Vinculados */}
            {medicosVinculados.length > 0 && (
              <div className="space-y-3 mb-4">
                {medicosVinculados.map((medico) => (
                  <div key={medico.id} className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">
                          {medico.medico_nome}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {medico.medico_crm} | {medico.medico_especializacao}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          Atuação: {medico.atuacao}
                        </div>
                        {medico.dias && (
                          <div className="text-xs text-gray-600 mt-1">
                            Dias: {medico.dias}
                          </div>
                        )}
                        {medico.horario && (
                          <div className="text-xs text-gray-600 mt-1">
                            Horário: {medico.horario}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removerMedico(medico.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Botão Adicionar Médico */}
            {!mostrarFormMedico && (
              <button
                type="button"
                onClick={() => setMostrarFormMedico(true)}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-purple-500 hover:text-purple-600 transition-all font-medium"
              >
                + Vincular Médico
              </button>
            )}

            {/* Formulário de Médico */}
            {mostrarFormMedico && (
              <div className="border-t border-gray-200 pt-4 space-y-4">
                <h4 className="text-sm font-semibold text-gray-700">
                  Vincular Médico
                </h4>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selecione o Médico *
                  </label>
                  <select
                    value={medicoSelecionadoId}
                    onChange={(e) => setMedicoSelecionadoId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  >
                    <option value="">Selecione...</option>
                    {medicosList.map((medico) => (
                      <option key={medico.id} value={medico.id}>
                        {medico.nome_completo} - {medico.crm} ({medico.especializacao})
                      </option>
                    ))}
                  </select>
                  {medicosList.length === 0 && (
                    <p className="text-xs text-amber-600 mt-2">
                      Nenhum médico cadastrado. <button type="button" onClick={() => router.push('/cadastrar-medico')} className="underline">Cadastrar agora</button>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Atuação nesta Unidade *
                  </label>
                  <input
                    type="text"
                    value={atuacaoMedico}
                    onChange={(e) => setAtuacaoMedico(e.target.value)}
                    placeholder="Ex: Atendimento ambulatorial, Cirurgias"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dias de Atendimento
                  </label>
                  <input
                    type="text"
                    value={diasAtendimentoMedico}
                    onChange={(e) => setDiasAtendimentoMedico(e.target.value)}
                    placeholder="Ex: Segunda e Quarta"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Horário de Atendimento
                  </label>
                  <input
                    type="text"
                    value={horarioAtendimentoMedico}
                    onChange={(e) => setHorarioAtendimentoMedico(e.target.value)}
                    placeholder="Ex: 08:00 às 12:00"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={adicionarMedico}
                    className="flex-1 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all font-medium text-sm"
                  >
                    Adicionar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMostrarFormMedico(false);
                      limparFormMedico();
                    }}
                    className="flex-1 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-medium text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mensagens */}
          {erro && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {erro}
            </div>
          )}

          {sucesso && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              {sucesso}
            </div>
          )}

          {/* Botões */}
          <div className="space-y-3">
            <button
              type="submit"
              disabled={cadastrando}
              className={`w-full py-4 rounded-lg font-semibold transition-all ${
                cadastrando
                  ? 'bg-gray-400 cursor-not-allowed text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
              }`}
            >
              {cadastrando ? 'Cadastrando...' : `✓ Cadastrar ${tipoUnidade === 'ubs' ? 'UBS' : 'Hospital'}`}
            </button>

            <button
              type="button"
              onClick={() => router.push('/cadastrar-hospital')}
              className="w-full py-4 rounded-lg font-medium transition-all bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              Cancelar
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}