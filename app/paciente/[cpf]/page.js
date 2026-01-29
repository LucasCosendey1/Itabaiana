// app/paciente/[cpf]/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '../../components/Header';
import { verificarAutenticacao, getNomeResumido } from '../../utils/helpers';

/**
 * PÁGINA DE INFORMAÇÕES DO PACIENTE - CONECTADA AO BANCO
 */
export default function InfoPacientePage() {
  const router = useRouter();
  const params = useParams();
  const [paciente, setPaciente] = useState(null);
  const [expandido, setExpandido] = useState(true);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    verificarAutenticacao(router);
    carregarPaciente();
  }, [params.cpf, router]);

  const carregarPaciente = async () => {
    try {
      const cpfDecodificado = decodeURIComponent(params.cpf);
      const response = await fetch(`/api/paciente/${cpfDecodificado}`);
      const data = await response.json();

      if (response.ok) {
        setPaciente(data.paciente);
      } else {
        setErro(data.erro || 'Paciente não encontrado');
      }
    } catch (error) {
      setErro('Erro ao carregar informações do paciente');
      console.error('Erro:', error);
    } finally {
      setCarregando(false);
    }
  };

  const formatarData = (data) => {
    if (!data) return '';
    const [ano, mes, dia] = data.split('T')[0].split('-');
    return `${dia}/${mes}/${ano}`;
  };

  if (carregando) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Carregando...</div>
      </div>
    );
  }

  if (erro || !paciente) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header titulo="Paciente não encontrado" mostrarVoltar />
        <main className="container mx-auto px-4 py-6 max-w-2xl">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {erro || 'Paciente não encontrado'}
          </div>
        </main>
      </div>
    );
  }

  const nomeResumido = getNomeResumido(paciente.nome_completo);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header titulo="Informações do Paciente" mostrarVoltar />

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Card do Paciente */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          {/* Cabeçalho - Nome clicável */}
          <div
            onClick={() => setExpandido(!expandido)}
            className="bg-gradient-to-r from-primary to-blue-600 text-white p-6 cursor-pointer hover:from-primary-dark hover:to-blue-700 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                  {nomeResumido.charAt(0)}
                </div>
                <div>
                  <h1 className="text-2xl font-bold mb-1">
                    {expandido ? paciente.nome_completo : nomeResumido}
                  </h1>
                  <p className="text-blue-100 text-sm">
                    {expandido ? 'Clique para recolher' : 'Clique para ver detalhes completos'}
                  </p>
                </div>
              </div>
              
              {/* Ícone de expandir/recolher */}
              <svg
                className={`w-6 h-6 transition-transform ${expandido ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>

          {/* Conteúdo Expansível */}
          <div
            className={`transition-all duration-300 overflow-hidden ${
              expandido ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="p-6 space-y-4">
              {/* Nome Completo */}
              <div className="pb-4 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                  Nome Completo
                </h3>
                <p className="text-gray-900 text-lg font-medium">
                  {paciente.nome_completo}
                </p>
              </div>

            {/* Sexo */}
            <div className="pb-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                Sexo
              </h3>
              <p className="text-gray-900 text-lg font-medium">
                {paciente.sexo || 'Não informado'}
              </p>
            </div>

              {/* Documentos */}
              <div className="pb-4 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                  Documentos
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 2a1 1 0 00-1 1v1a1 1 0 002 0V3a1 1 0 00-1-1zM4 4h3a3 3 0 006 0h3a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm2.5 7a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm2.45 4a2.5 2.5 0 10-4.9 0h4.9zM12 9a1 1 0 100 2h3a1 1 0 100-2h-3zm-1 4a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <span className="text-sm text-gray-600">CPF:</span>
                      <span className="ml-2 text-gray-900 font-medium">{paciente.cpf}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <span className="text-sm text-gray-600">Cartão SUS:</span>
                      <span className="ml-2 text-gray-900 font-medium">{paciente.cartao_sus}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dados Pessoais */}
              <div className="pb-4 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                  Dados Pessoais
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <span className="text-sm text-gray-600">Data de Nascimento:</span>
                      <span className="ml-2 text-gray-900 font-medium">{formatarData(paciente.data_nascimento)}</span>
                      {paciente.idade && (
                        <span className="ml-2 text-sm text-gray-500">({paciente.idade} anos)</span>
                      )}
                    </div>
                  </div>
                  {paciente.tipo_sanguineo && (
                    <div>
                      <span className="text-sm text-gray-600">Tipo Sanguíneo:</span>
                      <span className="ml-2 text-gray-900 font-medium">{paciente.tipo_sanguineo}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Contato */}
              <div className="pb-4 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                  Contato
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    <div>
                      <span className="text-sm text-gray-600">Telefone:</span>
                      <span className="ml-2 text-gray-900 font-medium">{paciente.telefone}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    <div>
                      <span className="text-sm text-gray-600">E-mail:</span>
                      <span className="ml-2 text-gray-900 font-medium break-all">{paciente.email}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filiação */}
              <div className="pb-4 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                  Filiação
                </h3>
                <div className="space-y-2">
                  {paciente.nome_pai && (
                    <div>
                      <span className="text-sm text-gray-600">Nome do Pai:</span>
                      <p className="text-gray-900 font-medium">{paciente.nome_pai}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm text-gray-600">Nome da Mãe:</span>
                    <p className="text-gray-900 font-medium">{paciente.nome_mae}</p>
                  </div>
                </div>
              </div>

              {/* Endereço */}
              <div className="pb-4 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                  Endereço
                </h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-gray-900">{paciente.endereco}</p>
                      <div className="mt-2">
                        <span className="text-sm text-gray-600">CEP:</span>
                        <span className="ml-2 text-gray-900 font-medium">{paciente.cep}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* UBS e Agente Comunitário */}
                {(paciente.ubs_nome || paciente.agente_nome) && (
                  <div className="pb-4 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                      Unidade Básica de Saúde
                    </h3>
                    <div className="space-y-3">
                      {paciente.ubs_nome && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm text-gray-600 font-medium">UBS de Cadastro:</span>
                          </div>
                          <p className="text-gray-900 ml-7">{paciente.ubs_nome}</p>
                          {paciente.ubs_endereco && (
                            <p className="text-sm text-gray-600 ml-7 mt-1">{paciente.ubs_endereco}</p>
                          )}
                        </div>
                      )}
                      
                      {paciente.agente_nome && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm text-gray-600 font-medium">Agente Comunitário:</span>
                          </div>
                          <p className="text-gray-900 ml-7">{paciente.agente_nome}</p>
                          {paciente.agente_telefone && (
                            <p className="text-sm text-gray-600 ml-7 mt-1">Tel: {paciente.agente_telefone}</p>
                          )}
                          {paciente.agente_microarea && (
                            <p className="text-xs text-gray-500 ml-7 mt-1">Microárea: {paciente.agente_microarea}</p>
                          )}
                        </div>
                      )}

                      {paciente.microarea && !paciente.agente_microarea && (
                        <div>
                          <span className="text-sm text-gray-600">Microárea:</span>
                          <span className="ml-2 text-gray-900">{paciente.microarea}</span>
                        </div>
                      )}

                      {paciente.responsavel_familiar && (
                        <div className="mt-2">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Responsável Familiar
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              {/* Informações Médicas */}
              {(paciente.alergias || paciente.observacoes_medicas) && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                    Informações Médicas
                  </h3>
                  <div className="space-y-2">
                    {paciente.alergias && (
                      <div>
                        <span className="text-sm text-gray-600">Alergias:</span>
                        <p className="text-gray-900">{paciente.alergias}</p>
                      </div>
                    )}
                    {paciente.observacoes_medicas && (
                      <div>
                        <span className="text-sm text-gray-600">Observações:</span>
                        <p className="text-gray-900">{paciente.observacoes_medicas}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Informação quando recolhido */}
          {!expandido && (
            <div className="p-6 text-center bg-gray-50">
              <p className="text-gray-500 text-sm">
                Clique no nome acima para ver todos os detalhes
              </p>
            </div>
          )}
        </div>

        {/* Botão Voltar */}
        <div className="mt-6">
          <button
            onClick={() => router.back()}
            className="w-full py-4 rounded-lg font-medium transition-all bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            ← Voltar
          </button>
        </div>
      </main>
    </div>
  );
}