// app/viagem/[id]/paciente/[pacienteId]/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '../../../../components/Header';
import { verificarAutenticacao, formatarData, getNomeResumido } from '../../../../utils/helpers';

export default function CheckinPacientePage() {
  const router = useRouter();
  const params = useParams();
  
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState(false);

  useEffect(() => {
    verificarAutenticacao(router);
    carregarDados();
  }, [params, router]);

  const carregarDados = async () => {
    try {
      const res = await fetch(`/api/viagem/${params.id}/paciente/${params.pacienteId}`);
      const json = await res.json();
      if (res.ok) setDados(json.dados);
      else alert(json.erro || 'Erro ao carregar');
    } catch (error) {
      console.error(error);
    } finally {
      setCarregando(false);
    }
  };

  const handleConfirmarPresenca = async () => {
    setProcessando(true);
    try {
      const novoStatus = !dados.compareceu;
      
      const response = await fetch('/api/atualizar-presenca', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: dados.vinculo_id, compareceu: novoStatus })
      });

      if (response.ok) {
        router.back();
      } else {
        alert('Erro ao atualizar presença');
      }
    } catch (error) {
      alert('Erro de conexão');
    } finally {
      setProcessando(false);
    }
  };

  if (carregando) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-500">Carregando...</div>
    </div>
  );
  
  if (!dados) return null;

  const nomeResumido = getNomeResumido(dados.nome_completo);

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <Header titulo="Confirmar Embarque" mostrarVoltar />

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        
        {/* Cabeçalho do Paciente */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 text-center">
          <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4 border-4 border-blue-50">
            {nomeResumido.charAt(0)}
          </div>
          <h1 className="text-xl font-bold text-gray-900">{dados.nome_completo}</h1>
          <p className="text-gray-500 text-sm mt-1">CPF: {dados.cpf}</p>
          <p className="text-gray-500 text-sm">SUS: {dados.cartao_sus}</p>
          
          <div className={`mt-4 inline-block px-4 py-1 rounded-full text-sm font-bold ${dados.compareceu ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
            Status: {dados.compareceu ? 'EMBARCADO' : 'AGUARDANDO'}
          </div>
        </div>

        {/* Detalhes da Viagem */}
        <div className="bg-blue-50 rounded-lg border border-blue-100 p-5 mb-6">
          <h3 className="text-xs font-bold text-blue-500 uppercase mb-3">Sobre a Viagem</h3>
          <div className="text-sm space-y-2">
            <p><strong>Destino:</strong> {dados.hospital_destino || dados.ubs_destino_nome}</p>
            <p><strong>Motivo:</strong> {dados.motivo_viagem}</p>
            {dados.vai_acompanhado && (
              <p><strong>Acompanhante:</strong> {dados.nome_acompanhante || 'Sim'}</p>
            )}
          </div>
        </div>

        {/* Dados do Prontuário */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 space-y-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase border-b pb-2">Dados Clínicos e Pessoais</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="block text-gray-500 text-xs">Nascimento</span>
              <span className="font-medium text-gray-900">{formatarData(dados.data_nascimento)}</span>
            </div>
            <div>
              <span className="block text-gray-500 text-xs">Tipo Sanguíneo</span>
              <span className="font-medium text-gray-900">{dados.tipo_sanguineo || '-'}</span>
            </div>
            <div className="col-span-2">
              <span className="block text-gray-500 text-xs">Alergias</span>
              <span className="font-medium text-red-600">{dados.alergias || 'Nenhuma registrada'}</span>
            </div>
            <div className="col-span-2">
              <span className="block text-gray-500 text-xs">Endereço</span>
              <span className="font-medium text-gray-900">{dados.endereco}</span>
            </div>
          </div>
        </div>

      </main>

      {/* BOTÃO FIXO NO RODAPÉ */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50">
        <button
          onClick={handleConfirmarPresenca}
          disabled={processando}
          className={`w-full py-4 font-bold text-lg rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform
            ${dados.compareceu 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-green-600 hover:bg-green-700 text-white'
            }
          `}
        >
          {processando ? 'Processando...' : (
            dados.compareceu ? (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancelar Embarque
              </>
            ) : (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                CONFIRMAR EMBARQUE
              </>
            )
          )}
        </button>
      </div>
    </div>
  );
}