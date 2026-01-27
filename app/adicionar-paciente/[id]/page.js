// app/adicionar-paciente/[id]/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '../../components/Header';
import InputCPF from '../../components/InputCPF';
import { verificarAutenticacao } from '../../utils/helpers';

/**
 * PÁGINA PARA ADICIONAR PACIENTE A UMA VIAGEM
 */
export default function AdicionarPacientePage() {
  const router = useRouter();
  const params = useParams();
  
  const [pacienteCpf, setPacienteCpf] = useState('');
  const [pacienteSelecionado, setPacienteSelecionado] = useState(null);
  const [buscandoPaciente, setBuscandoPaciente] = useState(false);
  
  const [motivo, setMotivo] = useState('');
  const [horarioConsulta, setHorarioConsulta] = useState('');
  const [medicoId, setMedicoId] = useState('');
  const [observacoes, setObservacoes] = useState('');
  
  const [medicos, setMedicos] = useState([]);
  
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [adicionando, setAdicionando] = useState(false);

  useEffect(() => {
    verificarAutenticacao(router);
    carregarMedicos();
  }, [router]);

  const carregarMedicos = async () => {
    try {
      const response = await fetch('/api/listar-medicos');
      if (response.ok) {
        const data = await response.json();
        setMedicos(data.medicos || []);
      }
    } catch (error) {
      console.error('Erro ao carregar médicos:', error);
    }
  };

  const buscarPaciente = async () => {
    if (!pacienteCpf.trim()) {
      setErro('Digite o CPF do paciente');
      return;
    }

    setBuscandoPaciente(true);
    setErro('');
    setPacienteSelecionado(null);

    try {
      const cpfLimpo = pacienteCpf.replace(/\D/g, '');
      const response = await fetch(`/api/buscar-paciente?busca=${encodeURIComponent(cpfLimpo)}`);
      const data = await response.json();

      if (response.ok && data.pacientes && data.pacientes.length > 0) {
        setPacienteSelecionado(data.pacientes[0]);
      } else {
        setErro('Paciente não encontrado');
      }
    } catch (error) {
      setErro('Erro ao buscar paciente');
      console.error('Erro:', error);
    } finally {
      setBuscandoPaciente(false);
    }
  };

  const formatarHorario = (valor) => {
    const numeros = valor.replace(/\D/g, '');
    if (numeros.length <= 2) {
      return numeros;
    } else if (numeros.length <= 4) {
      return `${numeros.slice(0, 2)}h${numeros.slice(2)}`;
    }
    return `${numeros.slice(0, 2)}h${numeros.slice(2, 4)}`;
  };

  const validarFormulario = () => {
    if (!pacienteSelecionado) {
      setErro('Selecione um paciente válido');
      return false;
    }

    if (!motivo) {
      setErro('Informe o motivo da viagem');
      return false;
    }

    if (horarioConsulta) {
      const regexHorario = /^\d{2}h\d{2}$/;
      if (!regexHorario.test(horarioConsulta)) {
        setErro('Horário de consulta deve estar no formato 10h00');
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

    setAdicionando(true);

    try {
      const horarioConsultaConvertido = horarioConsulta ? horarioConsulta.replace('h', ':') : null;

      const dados = {
        viagem_codigo: params.id,
        paciente_id: pacienteSelecionado.paciente_id,
        motivo,
        horario_consulta: horarioConsultaConvertido,
        medico_id: medicoId || null,
        observacoes: observacoes || null
      };

      const response = await fetch('/api/adicionar-paciente-viagem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dados),
      });

      const data = await response.json();

      if (response.ok) {
        setSucesso('Paciente adicionado com sucesso!');
        setTimeout(() => {
          router.push(`/viagem/${params.id}`);
        }, 1500);
      } else {
        setErro(data.erro || 'Erro ao adicionar paciente');
      }
    } catch (error) {
      setErro('Erro ao conectar com o servidor');
      console.error('Erro:', error);
    } finally {
      setAdicionando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header titulo="Adicionar Paciente à Viagem" mostrarVoltar voltarPara={`/viagem/${params.id}`} />

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Buscar Paciente */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Selecionar Paciente
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CPF do Paciente
                </label>
                <div className="flex gap-2">
                  <InputCPF
                    value={pacienteCpf}
                    onChange={setPacienteCpf}
                    placeholder="000.000.000-00"
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={buscarPaciente}
                    disabled={buscandoPaciente}
                    className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-all font-medium"
                  >
                    {buscandoPaciente ? 'Buscando...' : 'Buscar'}
                  </button>
                </div>
              </div>

              {pacienteSelecionado && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {pacienteSelecionado.nome_completo.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {pacienteSelecionado.nome_completo}
                      </div>
                      <div className="text-sm text-gray-600">
                        CPF: {pacienteSelecionado.cpf} | SUS: {pacienteSelecionado.cartao_sus}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Informações da Consulta */}
          {pacienteSelecionado && (
            <>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Informações da Consulta
                </h3>

                <div className="space-y-4">
                  {/* Motivo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Motivo da Viagem *
                    </label>
                    <input
                      type="text"
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      placeholder="Ex: Consulta cardiológica, Cirurgia de catarata"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    />
                  </div>

                  {/* Horário da Consulta */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Horário da Consulta
                    </label>
                    <input
                      type="text"
                      value={horarioConsulta}
                      onChange={(e) => setHorarioConsulta(formatarHorario(e.target.value))}
                      placeholder="10h00"
                      maxLength={5}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    />
                  </div>

                  {/* Médico */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Médico Responsável
                    </label>
                    <select
                      value={medicoId}
                      onChange={(e) => setMedicoId(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    >
                      <option value="">Selecione um médico (opcional)</option>
                      {medicos.map((medico) => (
                        <option key={medico.id} value={medico.id}>
                          {medico.nome_completo} - {medico.crm} - {medico.especializacao}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Observações */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Observações
                    </label>
                    <textarea
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      placeholder="Observações adicionais (opcional)"
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

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
          {pacienteSelecionado && (
            <div className="space-y-3">
              <button
                type="submit"
                disabled={adicionando}
                className={`w-full py-4 rounded-lg font-semibold transition-all ${
                  adicionando
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg'
                }`}
              >
                {adicionando ? 'Adicionando...' : 'Adicionar Paciente à Viagem'}
              </button>

              <button
                type="button"
                onClick={() => router.push(`/viagem/${params.id}`)}
                className="w-full py-4 rounded-lg font-medium transition-all bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Cancelar
              </button>
            </div>
          )}
        </form>
      </main>
    </div>
  );
}