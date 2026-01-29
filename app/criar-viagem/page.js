// app/criar-viagem/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import { verificarAutenticacao } from '../utils/helpers';

/**
 * PÁGINA DE CRIAÇÃO DE VIAGEM - APENAS ADMINISTRADORES
 */
export default function CriarViagemPage() {
  const router = useRouter();
  
  // Estados para o formulário
  const [hospitalDestino, setHospitalDestino] = useState('');
  const [enderecoDestino, setEnderecoDestino] = useState('');
  const [ubsDestinoId, setUbsDestinoId] = useState('');
  const [tipoDestino, setTipoDestino] = useState('hospital'); // 'hospital' ou 'ubs'

  const [dataViagem, setDataViagem] = useState('');
  const [horarioSaida, setHorarioSaida] = useState('');
  const [numeroVagas, setNumeroVagas] = useState('');
  
  const [motoristaId, setMotoristaId] = useState('');
  const [onibusId, setOnibusId] = useState('');
  
  const [motoristas, setMotoristas] = useState([]);
  const [onibus, setOnibus] = useState([]);
  const [ubsList, setUbsList] = useState([]);

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
      // Carregar UBS
      const resUbs = await fetch('/api/listar-ubs');
      if (resUbs.ok) {
        const dataUbs = await resUbs.json();
        setUbsList(dataUbs.ubs || []);
      }

      // Carregar motoristas
      const resMotoristas = await fetch('/api/listar-motoristas');
      if (resMotoristas.ok) {
        const dataMotoristas = await resMotoristas.json();
        setMotoristas(dataMotoristas.motoristas || []);
      }

      // Carregar ônibus
      const resOnibus = await fetch('/api/listar-onibus');
      if (resOnibus.ok) {
        const dataOnibus = await resOnibus.json();
        setOnibus(dataOnibus.onibus || []);
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

  // Atualizar número de vagas automaticamente quando seleciona ônibus
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

  const validarFormulario = () => {
    if (!dataViagem || !horarioSaida) {
      setErro('Preencha todos os campos obrigatórios');
      return false;
    }

    // Validar se informou hospital OU UBS
    if (tipoDestino === 'hospital' && !hospitalDestino) {
      setErro('Informe o hospital de destino');
      return false;
    }

    if (tipoDestino === 'ubs' && !ubsDestinoId) {
      setErro('Selecione a UBS de destino');
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
        hospital_destino: tipoDestino === 'hospital' ? hospitalDestino : null,
        endereco_destino: tipoDestino === 'hospital' ? (enderecoDestino || hospitalDestino) : null,
        ubs_destino_id: tipoDestino === 'ubs' ? parseInt(ubsDestinoId) : null,
        data_viagem: dataViagem,
        horario_saida: horarioSaidaConvertido,
        numero_vagas: parseInt(numeroVagas),
        motorista_id: motoristaId || null,
        onibus_id: onibusId || null
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
      <Header titulo="Criar Nova Viagem" mostrarVoltar voltarPara="/gerenciar-viagens" />

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Informações da Viagem */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Informações da Viagem
            </h3>

            <div className="space-y-4">
              {/* Tipo de Destino */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Destino *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTipoDestino('hospital')}
                    className={`py-3 px-4 rounded-lg border text-center transition-all ${
                      tipoDestino === 'hospital'
                        ? 'border-primary bg-primary text-white shadow-sm'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    Hospital
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoDestino('ubs')}
                    className={`py-3 px-4 rounded-lg border text-center transition-all ${
                      tipoDestino === 'ubs'
                        ? 'border-primary bg-primary text-white shadow-sm'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    UBS
                  </button>
                </div>
              </div>

              {/* Hospital (se tipo = hospital) */}
              {tipoDestino === 'hospital' && (
                <>
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
                </>
              )}

              {/* UBS (se tipo = ubs) */}
              {tipoDestino === 'ubs' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    UBS de Destino *
                  </label>
                  <select
                    value={ubsDestinoId}
                    onChange={(e) => setUbsDestinoId(e.target.value)}
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
              )}

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
            </div>
          </div>

          {/* Ônibus e Motorista */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
              Ônibus e Motorista
            </h3>

            <div className="space-y-4">
              {/* Ônibus */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selecione o Ônibus
                </label>
                <select
                  value={onibusId}
                  onChange={handleOnibusChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                >
                  <option value="">Nenhum ônibus selecionado</option>
                  {onibus.map((bus) => (
                    <option key={bus.id} value={bus.id}>
                      {bus.placa} - {bus.modelo} ({bus.ano}) - {bus.capacidade_passageiros} lugares - {bus.cor}
                    </option>
                  ))}
                </select>
                {onibus.length === 0 && (
                  <p className="text-sm text-amber-600 mt-2">
                    ⚠️ Nenhum ônibus cadastrado. <button type="button" onClick={() => router.push('/cadastrar-onibus')} className="underline hover:text-amber-700">Cadastrar agora</button>
                  </p>
                )}
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
                  placeholder={onibusId ? "Preenchido automaticamente" : "Ex: 15"}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
                {onibusId && (
                  <p className="text-xs text-gray-500 mt-1">
                    ✅ Capacidade do ônibus selecionado
                  </p>
                )}
              </div>

              {/* Motorista */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selecione o Motorista
                </label>
                <select
                  value={motoristaId}
                  onChange={(e) => setMotoristaId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                >
                  <option value="">Nenhum motorista selecionado</option>
                  {motoristas.map((motorista) => (
                    <option key={motorista.id} value={motorista.id}>
                      {motorista.nome_completo} - CNH: {motorista.cnh}
                    </option>
                  ))}
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