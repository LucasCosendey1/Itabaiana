// app/cadastrar-onibus/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import { verificarAutenticacao } from '../utils/helpers';

/**
 * PÁGINA DE CADASTRO DE ÔNIBUS - APENAS ADMINISTRADORES
 */
export default function CadastrarOnibusPage() {
  const router = useRouter();
  
  // Estados do formulário
  const [placa, setPlaca] = useState('');
  const [modelo, setModelo] = useState('');
  const [ano, setAno] = useState('');
  const [capacidade, setCapacidade] = useState('');
  const [cor, setCor] = useState('');
  
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [cadastrando, setCadastrando] = useState(false);

  useEffect(() => {
    const autenticado = verificarAutenticacao(router);
    if (autenticado) {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (token) {
        const usuario = JSON.parse(token);
        // Apenas administradores podem acessar
        if (usuario.role !== 'administrador') {
          router.push('/busca');
          return;
        }
      }
    }
  }, [router]);

  // Formatar placa AAA-0A00 ou AAA-0000
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
    if (!placa || !modelo || !ano || !capacidade || !cor) {
        setErro('Preencha todos os campos obrigatórios');
        return false;
    }

    // Validar placa (formato brasileiro) - remover hífen antes de validar
    const placaLimpa = placa.replace(/[^A-Za-z0-9]/g, ''); // ✅ Remove o hífen
    if (placaLimpa.length !== 7) {
        setErro('Placa inválida (deve ter 7 caracteres)');
        return false;
    }

    // Validar ano
    const anoAtual = new Date().getFullYear();
    const anoVeiculo = parseInt(ano);
    if (anoVeiculo < 1980 || anoVeiculo > anoAtual + 1) {
        setErro(`Ano inválido (entre 1980 e ${anoAtual + 1})`);
        return false;
    }

    // Validar capacidade
    const capacidadeNum = parseInt(capacidade);
    if (capacidadeNum < 10 || capacidadeNum > 60) {
        setErro('Capacidade deve estar entre 10 e 60 passageiros');
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
        placa: placa,
        modelo: modelo,
        ano: parseInt(ano),
        capacidade_passageiros: parseInt(capacidade),
        cor: cor
      };

      const response = await fetch('/api/cadastrar-onibus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dados),
      });

      const data = await response.json();

      if (response.ok) {
        setSucesso('Veículo cadastrado com sucesso!');
        // Limpar formulário
        setPlaca('');
        setModelo('');
        setAno('');
        setCapacidade('');
        setCor('');
        
        // Redirecionar após 2 segundos
        setTimeout(() => {
          router.push('/busca');
        }, 2000);
      } else {
        setErro(data.erro || 'Erro ao cadastrar ônibus');
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
      <Header titulo="Cadastrar Veículo" mostrarVoltar voltarPara="/busca" />

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Card de Informações do Veículo */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Informações do Veículo
                </h3>
                <p className="text-sm text-gray-500">
                  Preencha os dados do novo ônibus
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Placa */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Placa do Veículo *
                </label>
                <input
                  type="text"
                  value={placa}
                  onChange={(e) => setPlaca(formatarPlaca(e.target.value))}
                  placeholder="ABC-1234"
                  maxLength={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none uppercase"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Formato: AAA-0000 ou AAA-0A00
                </p>
              </div>

              {/* Modelo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Modelo do Veículo *
                </label>
                <input
                  type="text"
                  value={modelo}
                  onChange={(e) => setModelo(e.target.value)}
                  placeholder="Ex: Mercedes-Benz OF-1721, Volkswagen 17.230"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>

              {/* Ano e Capacidade */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ano de Fabricação *
                  </label>
                  <input
                    type="number"
                    value={ano}
                    onChange={(e) => setAno(e.target.value)}
                    placeholder="2020"
                    min="1980"
                    max={new Date().getFullYear() + 1}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Capacidade (passageiros) *
                  </label>
                  <input
                    type="number"
                    value={capacidade}
                    onChange={(e) => setCapacidade(e.target.value)}
                    placeholder="45"
                    min="10"
                    max="60"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                </div>
              </div>

              {/* Cor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cor do Veículo *
                </label>
                <select
                  value={cor}
                  onChange={(e) => setCor(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                >
                  <option value="">Selecione a cor</option>
                  <option value="Branco">Branco</option>
                  <option value="Prata">Prata</option>
                  <option value="Cinza">Cinza</option>
                  <option value="Preto">Preto</option>
                  <option value="Azul">Azul</option>
                  <option value="Verde">Verde</option>
                  <option value="Amarelo">Amarelo</option>
                  <option value="Vermelho">Vermelho</option>
                  <option value="Laranja">Laranja</option>
                </select>
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
              {cadastrando ? 'Cadastrando Veículo...' : '🚌 Cadastrar Veículo'}
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