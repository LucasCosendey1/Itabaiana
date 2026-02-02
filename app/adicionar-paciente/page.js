// app/cadastrar-paciente/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import InputCPF from '../components/InputCPF';
import { verificarAutenticacao } from '../utils/helpers';

/**
 * PÁGINA DE CADASTRO DE PACIENTES - APENAS ADMINISTRADORES
 */
export default function CadastrarPacientePage() {
  const router = useRouter();
  
  // Estados do formulário
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');
  const [cep, setCep] = useState('');
  const [sexo, setSexo] = useState('');
  const [senha, setSenha] = useState('');
  
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
    
    carregarUbsEAcs();
  }, [router]);

  const carregarUbsEAcs = async () => {
    try {
      const resUbs = await fetch('/api/listar-ubs');
      if (resUbs.ok) {
        const dataUbs = await resUbs.json();
        setUbsList(dataUbs.ubs || []);
      }

      const resAcs = await fetch('/api/listar-acs');
      if (resAcs.ok) {
        const dataAcs = await resAcs.json();
        setAcsList(dataAcs.agentes || []);
      }
    } catch (error) {
      console.error('Erro ao carregar UBS e ACS:', error);
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

  const formatarCartaoSUS = (valor) => {
    const numeros = valor.replace(/\D/g, '');
    return numeros
      .replace(/(\d{3})(\d)/, '$1 $2')
      .replace(/(\d{4})(\d)/, '$1 $2')
      .replace(/(\d{4})(\d)/, '$1 $2')
      .replace(/(\d{4})\d+?$/, '$1');
  };

  const validarFormulario = () => {
    if (!nomeCompleto || !cpf || !email || !telefone || !endereco || !cep || !sexo || !senha) {
      setErro('Preencha todos os campos obrigatórios');
      return false;
    }

    if (!cartaoSus || !nomeMae || !dataNascimento || !ubsCadastroId) {
      setErro('Preencha todos os campos obrigatórios do paciente');
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

    if (cartaoSus.replace(/\D/g, '').length !== 15) {
      setErro('Cartão SUS inválido (deve ter 15 dígitos)');
      return false;
    }

    if (senha.length < 6) {
      setErro('A senha deve ter no mínimo 6 caracteres');
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
      const dadosCadastro = {
        tipo_usuario: 'paciente',
        nome_completo: nomeCompleto,
        cpf: cpf,
        email: email,
        telefone: telefone,
        endereco: endereco,
        cep: cep,
        sexo: sexo,
        senha: senha,
        paciente: {
          cartao_sus: cartaoSus,
          nome_pai: nomePai || null,
          nome_mae: nomeMae,
          data_nascimento: dataNascimento,
          ubs_cadastro_id: parseInt(ubsCadastroId),
          agente_nome: agenteId || null,
          microarea: microarea || null,
          responsavel_familiar: responsavelFamiliar
        }
      };

      const response = await fetch('/api/cadastro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dadosCadastro),
      });

      const data = await response.json();

      if (response.ok) {
        setSucesso('Paciente cadastrado com sucesso!');
        setTimeout(() => {
          router.push('/busca');
        }, 2000);
      } else {
        setErro(data.erro || 'Erro ao cadastrar paciente');
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
      <Header titulo="Cadastrar Paciente" mostrarVoltar voltarPara="/busca" />

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Dados Pessoais */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Dados Pessoais
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={nomeCompleto}
                  onChange={(e) => setNomeCompleto(e.target.value)}
                  placeholder="Nome completo do paciente"
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

          {/* Dados do Paciente */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Informações de Saúde
            </h3>

            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cartão SUS *
                  </label>
                  <input
                    type="text"
                    value={cartaoSus}
                    onChange={(e) => setCartaoSus(formatarCartaoSUS(e.target.value))}
                    placeholder="123 4567 8901 2345"
                    maxLength={18}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Nascimento *
                  </label>
                  <input
                    type="date"
                    value={dataNascimento}
                    onChange={(e) => setDataNascimento(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome da Mãe *
                  </label>
                  <input
                    type="text"
                    value={nomeMae}
                    onChange={(e) => setNomeMae(e.target.value)}
                    placeholder="Nome da mãe"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Pai
                  </label>
                  <input
                    type="text"
                    value={nomePai}
                    onChange={(e) => setNomePai(e.target.value)}
                    placeholder="Nome do pai (opcional)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* UBS e Agente */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Unidade Básica de Saúde
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  UBS de Cadastro *
                </label>
                <select
                  value={ubsCadastroId}
                  onChange={(e) => setUbsCadastroId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                >
                  <option value="">Selecione a UBS</option>
                  {ubsList.map((ubs) => (
                    <option key={ubs.id} value={ubs.id}>
                      {ubs.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Agente Comunitário de Saúde
  </label>
  <input
    type="text"
    value={agenteId}
    onChange={(e) => setAgenteId(e.target.value)}
    placeholder="Nome do agente (opcional)"
    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
  />
  <p className="text-xs text-gray-500 mt-1">
    Digite o nome do agente comunitário de saúde
  </p>
</div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Microárea
                </label>
                <input
                  type="text"
                  value={microarea}
                  onChange={(e) => setMicroarea(e.target.value)}
                  placeholder="Ex: Área 01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="responsavelFamiliar"
                  checked={responsavelFamiliar}
                  onChange={(e) => setResponsavelFamiliar(e.target.checked)}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-2 focus:ring-primary"
                />
                <label htmlFor="responsavelFamiliar" className="text-sm font-medium text-gray-700">
                  É responsável familiar
                </label>
              </div>
            </div>
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
                  : 'bg-primary hover:bg-primary-dark text-white shadow-md hover:shadow-lg'
              }`}
            >
              {cadastrando ? 'Cadastrando...' : 'Cadastrar Paciente'}
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