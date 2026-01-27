// app/gerenciar-viagens/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import { verificarAutenticacao, formatarData, formatarHora, formatarStatus, getCorStatus } from '../utils/helpers';

/**
 * PÁGINA DE GERENCIAR VIAGENS - APENAS ADMINISTRADORES
 */
export default function GerenciarViagensPage() {
  const router = useRouter();
  const [viagens, setViagens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState('todas'); // todas, futuras, passadas
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    setMontado(true);
    
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
    
    carregarViagens();
  }, [router]);

  const carregarViagens = async () => {
    console.log('Iniciando carregamento de viagens...');
    
    try {
      const response = await fetch('/api/listar-viagens');
      console.log('Status da resposta:', response.status);
      
      const data = await response.json();
      console.log('Dados recebidos:', data);

      if (response.ok) {
        console.log('Total de viagens:', data.viagens?.length || 0);
        setViagens(data.viagens || []);
      } else {
        console.error('Erro na resposta:', data);
      }
    } catch (error) {
      console.error('Erro ao carregar viagens:', error);
    } finally {
      setCarregando(false);
    }
  };

  const handleCriarViagem = () => {
    console.log('Navegando para criar viagem...');
    router.push('/criar-viagem');
  };

  const handleVerViagem = (codigoViagem) => {
    console.log('Navegando para viagem:', codigoViagem);
    router.push(`/viagem/${codigoViagem}`);
  };

  if (!montado) {
    return null;
  }

  const viagensFiltradas = viagens.filter(viagem => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataViagem = new Date(viagem.data_viagem);
    dataViagem.setHours(0, 0, 0, 0);

    if (filtro === 'futuras') {
      return dataViagem >= hoje;
    } else if (filtro === 'passadas') {
      return dataViagem < hoje;
    }
    return true; // todas
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header titulo="Gerenciar Viagens" mostrarVoltar voltarPara="/busca" />

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Botão Criar Nova Viagem */}
        <div className="mb-6">
          <button
            onClick={handleCriarViagem}
            className="w-full py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-semibold shadow-md hover:shadow-lg"
          >
            + Criar Nova Viagem
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setFiltro('todas')}
              className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                filtro === 'todas'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todas ({viagens.length})
            </button>
            <button
              onClick={() => setFiltro('futuras')}
              className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                filtro === 'futuras'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Futuras
            </button>
            <button
              onClick={() => setFiltro('passadas')}
              className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                filtro === 'passadas'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Passadas
            </button>
          </div>
        </div>

        {/* Lista de Viagens */}
        {carregando ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-gray-600">Carregando viagens...</p>
          </div>
        ) : viagensFiltradas.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-gray-500 mb-4">Nenhuma viagem encontrada</p>
            <button
              onClick={() => router.push('/criar-viagem')}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-all"
            >
              Criar Primeira Viagem
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {viagensFiltradas.map((viagem) => {
              const statusClass = getCorStatus(viagem.status);
              const totalPacientes = viagem.total_pacientes || 0;
              const vagasDisponiveis = viagem.numero_vagas - totalPacientes;

              return (
                <div
                  key={viagem.viagem_id}
                  onClick={() => handleVerViagem(viagem.codigo_viagem)}
                  className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {formatarData(viagem.data_viagem)}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusClass}`}>
                          {formatarStatus(viagem.status)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Código: {viagem.codigo_viagem}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <div className="text-xs text-gray-500">Saída</div>
                      <div className="font-medium text-gray-900">{formatarHora(viagem.horario_saida)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Destino</div>
                      <div className="font-medium text-gray-900 truncate">{viagem.hospital_destino || 'Não definido'}</div>
                    </div>
                  </div>

                  {/* Informações de Vagas */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span className="text-sm text-gray-700">
                        <span className="font-semibold">{totalPacientes}</span> / {viagem.numero_vagas} pacientes
                      </span>
                    </div>
                    
                    {vagasDisponiveis > 0 ? (
                      <span className="text-xs text-green-600 font-medium">
                        {vagasDisponiveis} vaga{vagasDisponiveis !== 1 ? 's' : ''} disponível{vagasDisponiveis !== 1 ? 'is' : ''}
                      </span>
                    ) : (
                      <span className="text-xs text-red-600 font-medium">
                        Lotada
                      </span>
                    )}
                  </div>

                  {/* Motorista */}
                  {viagem.motorista_nome && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Motorista</div>
                      <div className="text-sm text-gray-900">
                        {viagem.motorista_nome} - {viagem.veiculo_modelo}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}