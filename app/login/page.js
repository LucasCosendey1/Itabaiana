// app/login/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import InputCPF from '../components/InputCPF';
import { validarLogin } from '../data/mockData';
import { salvarToken, estaAutenticado } from '../utils/helpers';

/**
 * PÁGINA DE LOGIN
 * Primeiro ponto de entrada do sistema
 */
export default function LoginPage() {
  const router = useRouter();
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  // Redireciona se já estiver logado
  useEffect(() => {
    if (estaAutenticado()) {
      router.push('/busca');
    }
  }, [router]);

  const handleLogin = (e) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    // Validação básica
    if (!cpf || !senha) {
      setErro('Preencha todos os campos');
      setCarregando(false);
      return;
    }

    // Valida credenciais
    const usuario = validarLogin(cpf, senha);

    if (usuario) {
      salvarToken(usuario);
      router.push('/busca');
    } else {
      setErro('CPF ou senha incorretos');
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700 px-4">
      <div className="w-full max-w-md">
        {/* Card de Login */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Logo/Título */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
              <svg 
                className="w-10 h-10 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" 
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Transporte SUS
            </h1>
            <p className="text-sm text-gray-600">
              Itabaiana - PB
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* CPF */}
            <div>
              <label htmlFor="cpf" className="block text-sm font-medium text-gray-700 mb-2">
                CPF
              </label>
              <InputCPF
                value={cpf}
                onChange={setCpf}
                placeholder="000.000.000-00"
              />
            </div>

            {/* Senha */}
            <div>
              <label htmlFor="senha" className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <input
                id="senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Digite sua senha"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              />
            </div>

            {/* Mensagem de erro */}
            {erro && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {erro}
              </div>
            )}

            {/* Botão de Login */}
            <button
              type="submit"
              disabled={carregando}
              className={`w-full py-3 rounded-lg font-medium transition-all ${
                carregando
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-primary hover:bg-primary-dark text-white shadow-md hover:shadow-lg'
              }`}
            >
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          {/* Credenciais de teste */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs font-medium text-gray-700 mb-3 text-center">
              Credenciais de teste:
            </p>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-xs">
              <div>
                <div className="font-semibold text-gray-700">Administrador:</div>
                <div className="text-gray-600">CPF: 123.456.789-00</div>
                <div className="text-gray-600">Senha: admin123</div>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <div className="font-semibold text-gray-700">Operador:</div>
                <div className="text-gray-600">CPF: 987.654.321-00</div>
                <div className="text-gray-600">Senha: operador123</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-white text-sm">
          Sistema de Gestão de Transporte SUS
        </div>
      </div>
    </div>
  );
}