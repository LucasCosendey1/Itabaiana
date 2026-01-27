// app/criar-viagem/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import InputCPF from '../components/InputCPF';
import { verificarAutenticacao } from '../utils/helpers';

/**
 * PÁGINA DE CRIAÇÃO DE VIAGEM - APENAS ADMINISTRADORES
 */
export default function CriarViagemPage() {
  const router = useRouter();
  
  // Estados para o formulário
  const [hospitalDestino, setHospitalDestino] = useState('');
  const [enderecoDestino, setEnderecoDestino] = useState('');
  const [dataViagem, setDataViagem] = useState('');
  const [horarioSaida, setHorarioSaida] = useState('');
  const [numeroVagas, setNumeroVagas] = useState('');
  
  const [motoristaId, setMotoristaId] = useState('');
  
  const [motoristas, setMotoristas] = useState([]);
  
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [criando, setCriando] = useState(false);

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
    
    carregarDados();
  }, [router]);

  const carregarDados = async () => {
    try {
      // Carregar motoristas
      const resMotoristas = await fetch('/api/listar-motoristas');
      if (resMotoristas.ok) {
        const dataMotoristas = await resMotoristas.json();
        setMotoristas(dataMotoristas.motoristas || []);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const formatarHorario = (valor) => {
    // Remove tudo que não é número
    const numeros = valor.replace(/\D/g, '');
    
    // Aplica máscara 10h00
    if (numeros.length <= 2) {
      return numeros;
    } else if (numeros.length <= 4) {
      return `${numeros.slice(0, 2)}h${numeros.slice(2)}`;
    }
    return `${numeros.slice(0, 2)}h${numeros.slice(2, 4)}`;
  };

  const validarFormulario = () => {
    if (!hospitalDestino || !dataViagem || !horarioSaida) {
      setErro('Preencha todos os campos obrigatórios');
      return false;
    }

    if (!numeroVagas || parseInt(numeroVagas) < 1) {
      setErro('Número de vagas deve ser maior que zero');
      return false;
    }

    // Validar formato de horário (XXhYY)
    const regexHorario = /^\d{2}h\d{2}$/;
    if (!regexHorario.test(horarioSaida)) {
      setErro('Horário deve estar no formato 10h00');
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

    setCriando(true);

    try {
      // Converter horário de 10h00 para 10:00
      const horarioSaidaConvertido = horarioSaida.replace('h', ':');

      const dadosViagem = {
        hospital_destino: hospitalDestino,
        endereco_destino: enderecoDestino || hospitalDestino,
        data_viagem: dataViagem,
        horario_saida: horarioSaidaConvertido,
        numero_vagas: parseInt(numeroVagas),
        motorista_id: motoristaId || null
      };

      const response = await fetch('/api/criar-viagem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dadosViagem),
      });

      const data = await response.json();

      if (response.ok) {
        setSucesso('Viagem criada com sucesso!');
        setTimeout(() => {
          router.push('/gerenciar-viagens');
        }, 2000);
      } else {
        setErro(data.erro || 'Erro ao criar viagem');
      }
    } catch (error) {
      setErro('Erro ao conectar com o servidor');
      console.error('Erro:', error);
    } finally {
      setCriando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header titulo="Criar Nova Viagem" mostrarVoltar voltarPara="/busca" />

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Informações da Viagem */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Informações da Viagem
            </h3>

            <div className="space-y-4">
              {/* Hospital */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hospital de Destino *
                </label>
                <input
                  type="text"
                  value={hospitalDestino}
                  onChange={(e) => setHospitalDestino(e.target.value)}
                  placeholder="Ex: Hospital Regional de Campina Grande"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>

              {/* Endereço */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Endereço do Hospital
                </label>
                <input
                  type="text"
                  value={enderecoDestino}
                  onChange={(e) => setEnderecoDestino(e.target.value)}
                  placeholder="Ex: Av. Brasília, 1000, Campina Grande-PB"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>

              {/* Data e Horário */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data da Viagem *
                  </label>
                  <input
                    type="date"
                    value={dataViagem}
                    onChange={(e) => setDataViagem(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Horário de Saída *
                  </label>
                  <input
                    type="text"
                    value={horarioSaida}
                    onChange={(e) => setHorarioSaida(formatarHorario(e.target.value))}
                    placeholder="07h00"
                    maxLength={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                </div>
              </div>

              {/* Número de Vagas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Vagas *
                </label>
                <input
                  type="number"
                  value={numeroVagas}
                  onChange={(e) => setNumeroVagas(e.target.value)}
                  min="1"
                  placeholder="Ex: 15"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>
            </div>
          </div>

          {/* Motorista */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Motorista (Opcional)
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecione o Motorista
              </label>
              <select
                value={motoristaId}
                onChange={(e) => setMotoristaId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              >
                <option value="">Selecione um motorista</option>
                {motoristas.map((motorista) => (
                  <option key={motorista.id} value={motorista.id}>
                    {motorista.nome_completo} - {motorista.veiculo_modelo} ({motorista.veiculo_placa})
                  </option>
                ))}
              </select>
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
              disabled={criando}
              className={`w-full py-4 rounded-lg font-semibold transition-all ${
                criando
                  ? 'bg-gray-400 cursor-not-allowed text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg'
              }`}
            >
              {criando ? 'Criando Viagem...' : 'Criar Viagem'}
            </button>

            <button
              type="button"
              onClick={() => router.push('/gerenciar-viagens')}
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