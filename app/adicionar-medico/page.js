// app/cadastrar-medico/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import InputCPF from '../components/InputCPF';
import { verificarAutenticacao } from '../utils/helpers';

/**
 * PÁGINA DE CADASTRO DE MÉDICOS - APENAS ADMINISTRADORES
 * Com especialização e vínculos hospitalares
 */
export default function CadastrarMedicoPage() {
  const router = useRouter();
  
  // Dados pessoais
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');
  const [cep, setCep] = useState('');
  const [sexo, setSexo] = useState('');
  const [senha, setSenha] = useState('');
  
  // Dados do médico
  const [crm, setCrm] = useState('');
  const [especializacao, setEspecializacao] = useState('');
  const [especializacaoOutro, setEspecializacaoOutro] = useState('');
  
  // Vínculos hospitalares
  const [vinculos, setVinculos] = useState([]);
  const [mostrarFormVinculo, setMostrarFormVinculo] = useState(false);
  
  // Formulário de vínculo
  const [hospitalVinculoId, setHospitalVinculoId] = useState('');
  const [hospitalOutroNome, setHospitalOutroNome] = useState('');
  const [atuacaoNoHospital, setAtuacaoNoHospital] = useState('');
  const [diasAtendimento, setDiasAtendimento] = useState('');
  const [horarioAtendimento, setHorarioAtendimento] = useState('');
  
  // Dados auxiliares
  const [ubsList, setUbsList] = useState([]);
  
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [cadastrando, setCadastrando] = useState(false);

  // Lista de especializações comuns
  const especializacoes = [
    'Cardiologia',
    'Ortopedia',
    'Pediatria',
    'Ginecologia',
    'Oftalmologia',
    'Dermatologia',
    'Neurologia',
    'Psiquiatria',
    'Endocrinologia',
    'Gastroenterologia',
    'Urologia',
    'Oncologia',
    'Clínico Geral',
    'Cirurgião Geral',
    'Outro'
  ];

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
    
    carregarUBS();
  }, [router]);

  const carregarUBS = async () => {
    try {
      const response = await fetch('/api/listar-ubs');
      if (response.ok) {
        const data = await response.json();
        setUbsList(data.ubs || []);
      }
    } catch (error) {
      console.error('Erro ao carregar UBS:', error);
    }
  };

  const formatarTelefone = (valor) => {
    const numeros = valor.replace(/\D/g, '');
    return numeros
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  const formatarCEP = (valor) => {
    const numeros = valor.replace(/\D/g, '');
    return numeros.replace(/(\d{5})(\d)/, '$1-$2');
  };

  const formatarCRM = (valor) => {
    return valor.toUpperCase().slice(0, 20);
  };

  // ============================================
  // VÍNCULOS HOSPITALARES
  // ============================================
  
  const adicionarVinculo = () => {
    if (!hospitalVinculoId) {
      setErro('Selecione um hospital/UBS ou informe "Outro"');
      return;
    }

    if (hospitalVinculoId === 'outro' && !hospitalOutroNome) {
      setErro('Informe o nome do hospital');
      return;
    }

    if (!atuacaoNoHospital) {
      setErro('Informe a atuação neste hospital');
      return;
    }

    // Verificar se já existe vínculo com este hospital
    const jaExiste = vinculos.find(v => 
      v.hospital_id === hospitalVinculoId || 
      (v.hospital_id === 'outro' && v.hospital_nome === hospitalOutroNome)
    );

    if (jaExiste) {
      setErro('Já existe um vínculo com este hospital');
      return;
    }

    const hospitalNome = hospitalVinculoId === 'outro' 
      ? hospitalOutroNome 
      : ubsList.find(u => u.id === parseInt(hospitalVinculoId))?.nome || '';

    const novoVinculo = {
      id: Date.now(),
      hospital_id: hospitalVinculoId,
      hospital_nome: hospitalNome,
      atuacao: atuacaoNoHospital,
      dias: diasAtendimento,
      horario: horarioAtendimento
    };

    setVinculos([...vinculos, novoVinculo]);
    limparFormVinculo();
    setMostrarFormVinculo(false);
    setErro('');
  };

  const removerVinculo = (id) => {
    setVinculos(vinculos.filter(v => v.id !== id));
  };

  const limparFormVinculo = () => {
    setHospitalVinculoId('');
    setHospitalOutroNome('');
    setAtuacaoNoHospital('');
    setDiasAtendimento('');
    setHorarioAtendimento('');
  };

  // ============================================
  // VALIDAÇÃO E ENVIO
  // ============================================
  
  const validarFormulario = () => {
    if (!nomeCompleto || !cpf || !email || !telefone || !endereco || !cep || !sexo || !senha) {
      setErro('Preencha todos os campos pessoais obrigatórios');
      return false;
    }

    if (!crm || !especializacao) {
      setErro('Preencha CRM e especialização');
      return false;
    }

    if (especializacao === 'Outro' && !especializacaoOutro) {
      setErro('Informe a especialização');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErro('E-mail inválido');
      return false;
    }

    if (cpf.replace(/\D/g, '').length !== 11) {
      setErro('CPF inválido');
      return false;
    }

    if (senha.length < 6) {
      setErro('A senha deve ter no mínimo 6 caracteres');
      return false;
    }

    if (vinculos.length === 0) {
      setErro('Adicione pelo menos um vínculo hospitalar');
      return false;
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
      const especializacaoFinal = especializacao === 'Outro' ? especializacaoOutro : especializacao;

      const dados = {
        tipo_usuario: 'medico',
        nome_completo: nomeCompleto,
        cpf: cpf,
        email: email,
        telefone: telefone,
        endereco: endereco,
        cep: cep,
        sexo: sexo,
        senha: senha,
        medico: {
          crm: crm,
          especializacao: especializacaoFinal,
          vinculos: vinculos.map(v => ({
            hospital_id: v.hospital_id !== 'outro' ? parseInt(v.hospital_id) : null,
            hospital_nome: v.hospital_id === 'outro' ? v.hospital_nome : null,
            atuacao: v.atuacao,
            dias_atendimento: v.dias || null,
            horario_atendimento: v.horario || null
          }))
        }
      };

      const response = await fetch('/api/cadastro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dados),
      });

      const data = await response.json();

      if (response.ok) {
        setSucesso('Médico cadastrado com sucesso!');
        setTimeout(() => {
          router.push('/busca');
        }, 2000);
      } else {
        setErro(data.erro || 'Erro ao cadastrar médico');
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
      <Header titulo="Cadastrar Médico" mostrarVoltar voltarPara="/busca" />

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Dados Pessoais */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Dados Pessoais
                </h3>
                <p className="text-sm text-gray-500">
                  Informações do médico
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={nomeCompleto}
                  onChange={(e) => setNomeCompleto(e.target.value)}
                  placeholder="Nome completo do médico"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CPF *
                  </label>
                  <InputCPF
                    value={cpf}
                    onChange={setCpf}
                    placeholder="000.000.000-00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sexo *
                  </label>
                  <select
                    value={sexo}
                    onChange={(e) => setSexo(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  >
                    <option value="">Selecione</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Feminino">Feminino</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    E-mail *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@exemplo.com"
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
                    placeholder="(83) 99999-9999"
                    maxLength={15}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Endereço Completo *
                </label>
                <input
                  type="text"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  placeholder="Rua, número, bairro"
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
                    Senha de Acesso *
                  </label>
                  <input
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Dados Profissionais */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Dados Profissionais
                </h3>
                <p className="text-sm text-gray-500">
                  CRM e especialização
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CRM *
                </label>
                <input
                  type="text"
                  value={crm}
                  onChange={(e) => setCrm(formatarCRM(e.target.value))}
                  placeholder="CRM/PB 12345"
                  maxLength={20}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none uppercase"
                />
                <p className="text-xs text-gray-500 mt-1">Exemplo: CRM/PB 12345</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Especialização *
                </label>
                <select
                  value={especializacao}
                  onChange={(e) => setEspecializacao(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                >
                  <option value="">Selecione...</option>
                  {especializacoes.map((esp) => (
                    <option key={esp} value={esp}>{esp}</option>
                  ))}
                </select>
              </div>

              {especializacao === 'Outro' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Informe a Especialização *
                  </label>
                  <input
                    type="text"
                    value={especializacaoOutro}
                    onChange={(e) => setEspecializacaoOutro(e.target.value)}
                    placeholder="Digite a especialização"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Vínculos Hospitalares */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Vínculos Hospitalares
                </h3>
                <p className="text-sm text-gray-500">
                  Hospitais e UBS onde atua
                </p>
              </div>
            </div>

            {/* Lista de Vínculos */}
            {vinculos.length > 0 && (
              <div className="space-y-3 mb-4">
                {vinculos.map((vinculo) => (
                  <div key={vinculo.id} className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 text-sm">{vinculo.hospital_nome}</div>
                        <div className="text-xs text-gray-600 mt-1">
                          Atuação: {vinculo.atuacao}
                        </div>
                        {vinculo.dias && (
                          <div className="text-xs text-gray-600 mt-1">
                            Dias: {vinculo.dias}
                          </div>
                        )}
                        {vinculo.horario && (
                          <div className="text-xs text-gray-600 mt-1">
                            Horário: {vinculo.horario}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removerVinculo(vinculo.id)}
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

            {/* Botão Adicionar Vínculo */}
            {!mostrarFormVinculo && (
              <button
                type="button"
                onClick={() => setMostrarFormVinculo(true)}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-purple-500 hover:text-purple-600 transition-all font-medium"
              >
                + Adicionar Vínculo Hospitalar
              </button>
            )}

            {/* Formulário de Vínculo */}
            {mostrarFormVinculo && (
              <div className="border-t border-gray-200 pt-4 space-y-4">
                <h4 className="text-sm font-semibold text-gray-700">
                  Novo Vínculo
                </h4>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hospital/UBS *
                  </label>
                  <select
                    value={hospitalVinculoId}
                    onChange={(e) => {
                      setHospitalVinculoId(e.target.value);
                      if (e.target.value !== 'outro') {
                        setHospitalOutroNome('');
                      }
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  >
                    <option value="">Selecione...</option>
                    {ubsList.map((ubs) => (
                      <option key={ubs.id} value={ubs.id}>
                        {ubs.nome}
                      </option>
                    ))}
                    <option value="outro">Outro (informar manualmente)</option>
                  </select>
                </div>

                {hospitalVinculoId === 'outro' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome do Hospital *
                    </label>
                    <input
                      type="text"
                      value={hospitalOutroNome}
                      onChange={(e) => setHospitalOutroNome(e.target.value)}
                      placeholder="Ex: Hospital Regional de Campina Grande"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Atuação neste Local *
                  </label>
                  <input
                    type="text"
                    value={atuacaoNoHospital}
                    onChange={(e) => setAtuacaoNoHospital(e.target.value)}
                    placeholder="Ex: Cardiologia, Cirurgias, Atendimento ambulatorial"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dias de Atendimento
                  </label>
                  <input
                    type="text"
                    value={diasAtendimento}
                    onChange={(e) => setDiasAtendimento(e.target.value)}
                    placeholder="Ex: Segunda, Quarta e Sexta"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Horário de Atendimento
                  </label>
                  <input
                    type="text"
                    value={horarioAtendimento}
                    onChange={(e) => setHorarioAtendimento(e.target.value)}
                    placeholder="Ex: 08:00 às 12:00"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={adicionarVinculo}
                    className="flex-1 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all font-medium text-sm"
                  >
                    Adicionar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMostrarFormVinculo(false);
                      limparFormVinculo();
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
              {cadastrando ? 'Cadastrando Médico...' : '✓ Cadastrar Médico'}
            </button>

            <button
              type="button"
              onClick={() => router.push('/busca')}
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