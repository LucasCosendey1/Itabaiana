// app/cadastrar-motorista/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import InputCPF from '../components/InputCPF';
import { verificarAutenticacao } from '../utils/helpers';

/**
 * PÁGINA DE CADASTRO DE MOTORISTAS - APENAS ADMINISTRADORES
 */
export default function CadastrarMotoristaPage() {
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
  
  // Dados do motorista
  const [cnh, setCnh] = useState('');
  const [categoriaCnh, setCategoriaCnh] = useState('');
  const [validadeCnh, setValidadeCnh] = useState('');
  const [veiculoPlaca, setVeiculoPlaca] = useState('');
  const [veiculoModelo, setVeiculoModelo] = useState('');
  const [capacidadePassageiros, setCapacidadePassageiros] = useState('');
  
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
  }, [router]);

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

  const formatarCNH = (valor) => {
    return valor.replace(/\D/g, '').slice(0, 11);
  };

  const formatarPlaca = (valor) => {
    const limpo = valor.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    if (limpo.length <= 3) {
      return limpo;
    } else if (limpo.length <= 7) {
      return `${limpo.slice(0, 3)}-${limpo.slice(3)}`;
    }
    return `${limpo.slice(0, 3)}-${limpo.slice(3, 7)}`;
  };

  const validarFormulario = () => {
    if (!nomeCompleto || !cpf || !email || !telefone || !endereco || !cep || !sexo || !senha) {
      setErro('Preencha todos os campos pessoais obrigatórios');
      return false;
    }

    if (!cnh || !categoriaCnh || !validadeCnh) {
      setErro('Preencha todos os campos da CNH');
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

    if (cnh.length !== 11) {
      setErro('CNH deve ter 11 dígitos');
      return false;
    }

    if (senha.length < 6) {
      setErro('A senha deve ter no mínimo 6 caracteres');
      return false;
    }

    if (capacidadePassageiros && (parseInt(capacidadePassageiros) < 4 || parseInt(capacidadePassageiros) > 60)) {
      setErro('Capacidade deve estar entre 4 e 60 passageiros');
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
      const dados = {
        tipo_usuario: 'motorista',
        nome_completo: nomeCompleto,
        cpf: cpf,
        email: email,
        telefone: telefone,
        endereco: endereco,
        cep: cep,
        sexo: sexo,
        senha: senha,
        motorista: {
          cnh: cnh,
          categoria_cnh: categoriaCnh,
          validade_cnh: validadeCnh,
          veiculo_placa: veiculoPlaca || null,
          veiculo_modelo: veiculoModelo || null,
          capacidade_passageiros: capacidadePassageiros ? parseInt(capacidadePassageiros) : null
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
        setSucesso('Motorista cadastrado com sucesso!');
        setTimeout(() => {
          router.push('/busca');
        }, 2000);
      } else {
        setErro(data.erro || 'Erro ao cadastrar motorista');
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
      <Header titulo="Cadastrar Motorista" mostrarVoltar voltarPara="/busca" />

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
                  Informações do motorista
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
                  placeholder="Nome completo do motorista"
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

          {/* Dados da CNH */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Carteira de Habilitação (CNH)
                </h3>
                <p className="text-sm text-gray-500">
                  Documentação obrigatória
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número da CNH *
                  </label>
                  <input
                    type="text"
                    value={cnh}
                    onChange={(e) => setCnh(formatarCNH(e.target.value))}
                    placeholder="12345678901"
                    maxLength={11}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">11 dígitos</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoria *
                  </label>
                  <select
                    value={categoriaCnh}
                    onChange={(e) => setCategoriaCnh(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  >
                    <option value="">Selecione</option>
                    <option value="D">D - Ônibus/Van</option>
                    <option value="E">E - Caminhão com reboque</option>
                    <option value="C">C - Caminhão</option>
                    <option value="B">B - Carro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Validade da CNH *
                </label>
                <input
                  type="date"
                  value={validadeCnh}
                  onChange={(e) => setValidadeCnh(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">A CNH deve estar válida</p>
              </div>
            </div>
          </div>

          {/* Dados do Veículo (Opcional) */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Veículo Próprio (Opcional)
                </h3>
                <p className="text-sm text-gray-500">
                  Se o motorista possui veículo
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Placa do Veículo
                  </label>
                  <input
                    type="text"
                    value={veiculoPlaca}
                    onChange={(e) => setVeiculoPlaca(formatarPlaca(e.target.value))}
                    placeholder="ABC-1234"
                    maxLength={8}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none uppercase"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Capacidade de Passageiros
                  </label>
                  <input
                    type="number"
                    value={capacidadePassageiros}
                    onChange={(e) => setCapacidadePassageiros(e.target.value)}
                    placeholder="Ex: 15"
                    min="4"
                    max="60"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Modelo do Veículo
                </label>
                <input
                  type="text"
                  value={veiculoModelo}
                  onChange={(e) => setVeiculoModelo(e.target.value)}
                  placeholder="Ex: Mercedes-Benz Sprinter, Iveco Daily"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
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
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
              }`}
            >
              {cadastrando ? 'Cadastrando Motorista...' : '✓ Cadastrar Motorista'}
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