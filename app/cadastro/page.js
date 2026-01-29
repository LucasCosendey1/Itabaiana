// app/cadastro/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import InputCPF from '../components/InputCPF';
import { formatarCPF } from '../utils/helpers';

/**
 * PÁGINA DE CADASTRO DE NOVOS USUÁRIOS
 * Permite cadastro de Administradores e Pacientes
 */
export default function CadastroPage() {
  const router = useRouter();
  
  // Estado para o tipo de usuário selecionado
  const [tipoUsuario, setTipoUsuario] = useState('paciente');
  
  // Estados para campos comuns
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');
  const [cep, setCep] = useState('');
  const [sexo, setSexo] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  
  // Estados para campos específicos - PACIENTE
  const [cartaoSus, setCartaoSus] = useState('');
  const [nomePai, setNomePai] = useState('');
  const [nomeMae, setNomeMae] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [ubsList, setUbsList] = useState([]);
  const [acsList, setAcsList] = useState([]);
  const [ubsCadastroId, setUbsCadastroId] = useState('');
  const [agenteId, setAgenteId] = useState('');
  const [microarea, setMicroarea] = useState('');
  const [responsavelFamiliar, setResponsavelFamiliar] = useState(false);
  
  // Estados para campos específicos - ADMINISTRADOR
  const [cargo, setCargo] = useState('');
  
  // Estados de controle
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [carregando, setCarregando] = useState(false);

  // Carregar UBS e ACS
  useEffect(() => {
    carregarUbsEAcs();
  }, []);

  const carregarUbsEAcs = async () => {
    try {
      // Carregar UBS
      const resUbs = await fetch('/api/listar-ubs');
      if (resUbs.ok) {
        const dataUbs = await resUbs.json();
        setUbsList(dataUbs.ubs || []);
      }

      // Carregar ACS
      const resAcs = await fetch('/api/listar-acs');
      if (resAcs.ok) {
        const dataAcs = await resAcs.json();
        setAcsList(dataAcs.agentes || []);
      }
    } catch (error) {
      console.error('Erro ao carregar UBS e ACS:', error);
    }
  };

  // Tipos de usuário disponíveis
  const tiposUsuario = [
    { id: 'administrador', label: 'Administrador', habilitado: true },
    { id: 'paciente', label: 'Paciente', habilitado: true },
    { id: 'medico', label: 'Médico', habilitado: false },
    { id: 'motorista', label: 'Motorista', habilitado: false }
  ];

  // Formatar telefone
  const formatarTelefone = (valor) => {
    const numeros = valor.replace(/\D/g, '');
    return numeros
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  // Formatar CEP
  const formatarCEP = (valor) => {
    const numeros = valor.replace(/\D/g, '');
    return numeros.replace(/(\d{5})(\d)/, '$1-$2');
  };

  // Formatar Cartão SUS
  const formatarCartaoSUS = (valor) => {
    const numeros = valor.replace(/\D/g, '');
    return numeros
      .replace(/(\d{3})(\d)/, '$1 $2')
      .replace(/(\d{4})(\d)/, '$1 $2')
      .replace(/(\d{4})(\d)/, '$1 $2')
      .replace(/(\d{4})\d+?$/, '$1');
  };

  // Validações
  const validarFormulario = () => {
    // Campos obrigatórios comuns
    if (!nomeCompleto || !cpf || !email || !telefone || !endereco || !cep || !senha || !confirmarSenha) {
      setErro('Preencha todos os campos obrigatórios');
      return false;
    }

    // Validar SEXO (obrigatório)
    if (!sexo) {
      setErro('Selecione o sexo');
      return false;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErro('E-mail inválido');
      return false;
    }

    // Validar CPF (formato básico)
    if (cpf.replace(/\D/g, '').length !== 11) {
      setErro('CPF inválido');
      return false;
    }

    // Validar senhas
    if (senha.length < 6) {
      setErro('A senha deve ter no mínimo 6 caracteres');
      return false;
    }

    if (senha !== confirmarSenha) {
      setErro('As senhas não conferem');
      return false;
    }

    // Validações específicas por tipo
    if (tipoUsuario === 'paciente') {
      if (!cartaoSus || !nomeMae || !dataNascimento) {
        setErro('Preencha todos os campos obrigatórios do paciente');
        return false;
      }
      
      if (!ubsCadastroId) {
        setErro('Selecione a UBS de cadastro do paciente');
        return false;
      }
      
      if (cartaoSus.replace(/\D/g, '').length !== 15) {
        setErro('Cartão SUS inválido (deve ter 15 dígitos)');
        return false;
      }
    }

    if (tipoUsuario === 'administrador') {
      if (!cargo) {
        setErro('Preencha o cargo do administrador');
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

    setCarregando(true);

    try {
      // Preparar dados para envio
      const dadosCadastro = {
        // Dados comuns
        tipo_usuario: tipoUsuario,
        nome_completo: nomeCompleto,
        cpf: cpf,
        email: email,
        telefone: telefone,
        endereco: endereco,
        cep: cep,
        sexo: sexo,
        senha: senha,
      };

      // Adicionar dados específicos
      if (tipoUsuario === 'paciente') {
        dadosCadastro.paciente = {
          cartao_sus: cartaoSus,
          nome_pai: nomePai || null,
          nome_mae: nomeMae,
          data_nascimento: dataNascimento,
          ubs_cadastro_id: ubsCadastroId ? parseInt(ubsCadastroId) : null,
          agente_id: agenteId ? parseInt(agenteId) : null,
          microarea: microarea || null,
          responsavel_familiar: responsavelFamiliar
        };
      }

      if (tipoUsuario === 'administrador') {
        dadosCadastro.administrador = {
          cargo: cargo
        };
      }

      // Enviar para API
      const response = await fetch('/api/cadastro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dadosCadastro),
      });

      const data = await response.json();

      if (response.ok) {
        setSucesso('Cadastro realizado com sucesso! Redirecionando...');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setErro(data.erro || 'Erro ao realizar cadastro');
      }
    } catch (error) {
      setErro('Erro ao conectar com o servidor');
      console.error('Erro:', error);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header Fixo */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <button
              onClick={() => router.push('/login')}
              className="text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-gray-900">
              Criar Conta
            </h1>
            <div className="w-6"></div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="px-4 py-6 pb-20">
        <div className="max-w-md mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Seleção de Tipo de Usuário */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <label className="block text-sm font-semibold text-gray-700 mb-4">
                Tipo de Cadastro
              </label>
              <div className="grid grid-cols-2 gap-3">
                {tiposUsuario.map((tipo) => (
                  <button
                    key={tipo.id}
                    type="button"
                    onClick={() => tipo.habilitado && setTipoUsuario(tipo.id)}
                    disabled={!tipo.habilitado}
                    className={`
                      relative py-3 px-3 rounded-lg border text-center transition-all
                      ${tipo.habilitado
                        ? tipoUsuario === tipo.id
                          ? 'border-primary bg-primary text-white shadow-sm'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                        : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                      }
                    `}
                  >
                    {/* Bolinha de seleção */}
                    <div className="flex items-center justify-center mb-2">
                      <div className={`
                        w-5 h-5 rounded-full border-2 flex items-center justify-center
                        ${tipo.habilitado
                          ? tipoUsuario === tipo.id
                            ? 'border-white bg-white'
                            : 'border-gray-400 bg-white'
                          : 'border-gray-300 bg-gray-100'
                        }
                      `}>
                        {tipo.habilitado && tipoUsuario === tipo.id && (
                          <div className="w-2.5 h-2.5 bg-primary rounded-full"></div>
                        )}
                      </div>
                    </div>

                    <div className={`text-sm font-medium ${
                      tipo.habilitado && tipoUsuario === tipo.id ? 'text-white' : ''
                    }`}>
                      {tipo.label}
                    </div>
                    
                    {!tipo.habilitado && (
                      <div className="text-xs text-gray-400 mt-1">
                        Indisponível
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Campos Comuns */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">
                Dados Pessoais
              </h3>

              {/* Nome Completo */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={nomeCompleto}
                  onChange={(e) => setNomeCompleto(e.target.value)}
                  placeholder="Digite seu nome completo"
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>

              {/* CPF */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  CPF *
                </label>
                <InputCPF
                  value={cpf}
                  onChange={setCpf}
                  placeholder="000.000.000-00"
                  className="text-sm py-2.5"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  E-mail *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Telefone *
                </label>
                <input
                  type="text"
                  value={telefone}
                  onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
                  placeholder="(83) 99999-9999"
                  maxLength={15}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>

              {/* Endereço */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Endereço Completo *
                </label>
                <input
                  type="text"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  placeholder="Rua, número, bairro"
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>

              {/* CEP */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  CEP *
                </label>
                <input
                  type="text"
                  value={cep}
                  onChange={(e) => setCep(formatarCEP(e.target.value))}
                  placeholder="58360-000"
                  maxLength={9}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>

              {/* Sexo */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Sexo *
                </label>
                <select
                  value={sexo}
                  onChange={(e) => setSexo(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                >
                  <option value="">Selecione o sexo</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Feminino">Feminino</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              {/* Senha */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Senha *
                </label>
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>

              {/* Confirmar Senha */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Confirmar Senha *
                </label>
                <input
                  type="password"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  placeholder="Digite a senha novamente"
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>
            </div>

            {/* Campos Específicos - PACIENTE */}
            {tipoUsuario === 'paciente' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">
                  Informações do Paciente
                </h3>

                {/* Cartão SUS */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Cartão SUS *
                  </label>
                  <input
                    type="text"
                    value={cartaoSus}
                    onChange={(e) => setCartaoSus(formatarCartaoSUS(e.target.value))}
                    placeholder="123 4567 8901 2345"
                    maxLength={18}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                </div>

                {/* Nome do Pai */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Nome do Pai
                  </label>
                  <input
                    type="text"
                    value={nomePai}
                    onChange={(e) => setNomePai(e.target.value)}
                    placeholder="Nome do pai (opcional)"
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                </div>

                {/* Nome da Mãe */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Nome da Mãe *
                  </label>
                  <input
                    type="text"
                    value={nomeMae}
                    onChange={(e) => setNomeMae(e.target.value)}
                    placeholder="Nome da mãe"
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                </div>

                {/* Data de Nascimento */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Data de Nascimento *
                  </label>
                  <input
                    type="date"
                    value={dataNascimento}
                    onChange={(e) => setDataNascimento(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                </div>

                {/* UBS de Cadastro */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    UBS de Cadastro *
                  </label>
                  <select
                    value={ubsCadastroId}
                    onChange={(e) => setUbsCadastroId(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  >
                    <option value="">Selecione a UBS</option>
                    {ubsList.map((ubs) => (
                      <option key={ubs.id} value={ubs.id}>
                        {ubs.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Agente Comunitário */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Agente Comunitário de Saúde (ACS)
                  </label>
                  <select
                    value={agenteId}
                    onChange={(e) => setAgenteId(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  >
                    <option value="">Selecione o ACS (opcional)</option>
                    {acsList.map((acs) => (
                      <option key={acs.id} value={acs.id}>
                        {acs.nome_completo} {acs.ubs_nome ? `- ${acs.ubs_nome}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Microárea */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Microárea
                  </label>
                  <input
                    type="text"
                    value={microarea}
                    onChange={(e) => setMicroarea(e.target.value)}
                    placeholder="Ex: Área 01"
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                </div>

                {/* Responsável Familiar */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="responsavelFamiliar"
                    checked={responsavelFamiliar}
                    onChange={(e) => setResponsavelFamiliar(e.target.checked)}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-2 focus:ring-primary"
                  />
                  <label htmlFor="responsavelFamiliar" className="text-xs font-medium text-gray-600">
                    É responsável familiar
                  </label>
                </div>
              </div>
            )}

            {/* Campos Específicos - ADMINISTRADOR */}
            {tipoUsuario === 'administrador' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">
                  Informações do Administrador
                </h3>

                {/* Cargo */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Cargo *
                  </label>
                  <input
                    type="text"
                    value={cargo}
                    onChange={(e) => setCargo(e.target.value)}
                    placeholder="Ex: Coordenador, Supervisor"
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                </div>
              </div>
            )}

            {/* Mensagens de Erro/Sucesso */}
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

            {/* Botão de Cadastro - Fixo no Bottom */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
              <div className="max-w-md mx-auto">
                <button
                  type="submit"
                  disabled={carregando}
                  className={`w-full py-3 rounded-lg font-semibold text-sm transition-all ${
                    carregando
                      ? 'bg-gray-400 cursor-not-allowed text-white'
                      : 'bg-primary hover:bg-primary-dark text-white shadow-md active:scale-98'
                  }`}
                >
                  {carregando ? 'Cadastrando...' : 'Criar Conta'}
                </button>
                <p className="text-xs text-gray-500 text-center mt-2">
                  * Campos obrigatórios
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}