'use client';

import { useState, useEffect } from 'react';

export default function RelatorioViagens({ data, onFechar }) {
  const [viagens, setViagens] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (data) {
      carregarViagens();
    }
  }, [data]);

  const carregarViagens = async () => {
    setCarregando(true);
    setErro('');

    try {
      const ano = data.getFullYear();
      const mes = String(data.getMonth() + 1).padStart(2, '0');
      const dia = String(data.getDate()).padStart(2, '0');
      const dataStr = `${ano}-${mes}-${dia}`;
      
      const response = await fetch(`/api/viagens-por-data?data=${dataStr}`);
      
      if (response.ok) {
        const dados = await response.json();
        setViagens(dados.viagens || []);
      } else {
        const erroObj = await response.json();
        setErro(erroObj.erro || 'Erro ao carregar viagens');
      }
    } catch (error) {
      setErro('Erro ao conectar com o servidor');
    } finally {
      setCarregando(false);
    }
  };

  const calcularIdade = (dataNascimento) => {
    if (!dataNascimento) return '';
    const nascimento = new Date(dataNascimento);
    const hoje = new Date();
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    return `${idade} anos`;
  };

  const imprimirNaMesmaTela = () => {
    const dataFormatada = data.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const conteudoHTML = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Relatório Diário</title>
        <style>
          @page { size: A4; margin: 10mm; }
          body { font-family: Arial, sans-serif; font-size: 11px; color: #000; margin: 0; }
          .cabecalho { text-align: center; border-bottom: 2px solid #000; margin-bottom: 15px; padding-bottom: 5px; }
          .cabecalho h1 { font-size: 16px; margin: 0; text-transform: uppercase; }
          .cabecalho p { font-size: 12px; margin: 2px 0; text-transform: uppercase; }
          .viagem-container { margin-bottom: 20px; page-break-inside: avoid; border: 1px solid #000; }
          .viagem-header { background-color: #ddd; border-bottom: 1px solid #000; padding: 5px; font-weight: bold; font-size: 12px; text-transform: uppercase; display: flex; justify-content: space-between; -webkit-print-color-adjust: exact; }
          .dados-tecnicos { padding: 5px; border-bottom: 1px solid #000; font-size: 10px; background-color: #f9f9f9; -webkit-print-color-adjust: exact; }
          .dados-row { display: flex; justify-content: space-between; }
          .tabela-pacientes { width: 100%; border-collapse: collapse; font-size: 10px; }
          .tabela-pacientes th { border-bottom: 1px solid #000; text-align: left; padding: 4px; background: #eee; -webkit-print-color-adjust: exact; }
          .tabela-pacientes td { border-bottom: 1px dotted #ccc; padding: 4px; vertical-align: top; }
          .label { font-weight: bold; }
          .info-secundaria { font-size: 9px; color: #333; margin-top: 2px; }
          .resumo { margin-top: 20px; border: 2px solid #000; padding: 5px; page-break-inside: avoid; }
          .resumo-titulo { text-align: center; font-weight: bold; border-bottom: 1px solid #000; margin-bottom: 5px; }
          .resumo-linha { display: flex; justify-content: space-between; font-size: 10px; padding: 2px 0; border-bottom: 1px dotted #ccc; }
          .total-geral { font-weight: bold; font-size: 12px; margin-top: 5px; text-align: right; }
        </style>
      </head>
      <body>
        <div class="cabecalho">
          <h1>RELATÓRIO DIÁRIO DE TRANSPORTE</h1>
          <p>${dataFormatada}</p>
        </div>
        ${viagens.map(viagem => `
          <div class="viagem-container">
            <div class="viagem-header">
              <span>DESTINO: ${viagem.ubs_destino_nome || viagem.hospital_destino}</span>
              <span>SAÍDA: ${viagem.horario_saida}</span>
            </div>
            <div class="dados-tecnicos">
              <div class="dados-row">
                <span><span class="label">MOT:</span> ${viagem.motorista_nome || 'A DEFINIR'}</span>
                <span><span class="label">CONTATO:</span> ${viagem.motorista_telefone || '-'}</span>
                <span><span class="label">CNH:</span> ${viagem.motorista_cnh || '-'}</span>
              </div>
              <div class="dados-row" style="margin-top:2px">
                <span><span class="label">VEÍCULO:</span> ${viagem.veiculo_modelo || ''} (${viagem.veiculo_placa || 'N/A'})</span>
                <span><span class="label">CAP:</span> ${viagem.veiculo_capacidade || 0} Lug.</span>
              </div>
            </div>
            <table class="tabela-pacientes">
              <thead>
                <tr><th style="width: 5%">#</th><th style="width: 35%">PACIENTE / DOCS</th><th style="width: 35%">LOCAL / CONTATO</th><th style="width: 25%">MOTIVO / MÉDICO</th></tr>
              </thead>
              <tbody>
                ${viagem.pacientes && viagem.pacientes.length > 0 ? viagem.pacientes.map((p, i) => `
                  <tr>
                    <td>${i + 1}</td>
                    <td><div class="label">${p.paciente_nome}</div><div>CPF: ${p.paciente_cpf}</div><div>SUS: ${p.cartao_sus || '-'}</div><div class="info-secundaria">${calcularIdade(p.paciente_data_nascimento)}</div></td>
                    <td><div>${p.buscar_em_casa ? '🏠 CASA:' : '📍 PONTO:'} ${p.paciente_ubs_nome || p.local_parada || p.paciente_endereco || 'Não informado'}</div><div>Tel: ${p.paciente_telefone || '-'}</div></td>
                    <td><div class="label">${p.motivo || 'Consulta'}</div><div>Dr(a): ${p.medico_nome || '-'}</div></td>
                  </tr>
                `).join('') : '<tr><td colspan="4" style="text-align:center; font-style:italic">Sem pacientes.</td></tr>'}
              </tbody>
            </table>
          </div>
        `).join('')}
        <div class="resumo">
          <div class="resumo-titulo">RESUMO GERAL</div>
          ${viagens.map(v => `<div class="resumo-linha"><span>${v.ubs_destino_nome || v.hospital_destino}</span><span>${v.pacientes ? v.pacientes.length : 0} passageiros</span></div>`).join('')}
          <div class="total-geral">TOTAL: ${viagens.reduce((acc, v) => acc + (v.pacientes ? v.pacientes.length : 0), 0)} PASSAGEIROS</div>
        </div>
      </body>
      </html>
    `;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed'; iframe.style.right = '0'; iframe.style.bottom = '0'; iframe.style.width = '0'; iframe.style.height = '0'; iframe.style.border = '0';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow.document;
    doc.open(); doc.write(conteudoHTML); doc.close();
    iframe.contentWindow.focus();
    setTimeout(() => { iframe.contentWindow.print(); setTimeout(() => { document.body.removeChild(iframe); }, 1000); }, 500);
  };

  if (!data) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Cabeçalho */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Relatório de Viagens</h2>
            <p className="text-sm text-gray-500 capitalize">
              {data.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <button onClick={onFechar} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* --- LISTA DETALHADA NA TELA --- */}
        <div className="flex-1 overflow-y-auto p-5 bg-gray-50">
          {carregando ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-gray-500 font-medium">Buscando dados...</p>
            </div>
          ) : erro ? (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg text-center">{erro}</div>
          ) : viagens.length === 0 ? (
            <div className="text-center text-gray-400 py-10">Nenhuma viagem encontrada.</div>
          ) : (
            <div className="space-y-4">
              
              {/* Resumo no Topo */}
              <div className="flex gap-4 mb-4">
                <div className="flex-1 bg-white border border-gray-200 p-4 rounded-lg shadow-sm text-center">
                  <div className="text-2xl font-bold text-gray-800">{viagens.length}</div>
                  <div className="text-xs text-gray-500 uppercase font-bold">Viagens</div>
                </div>
                <div className="flex-1 bg-white border border-gray-200 p-4 rounded-lg shadow-sm text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {viagens.reduce((acc, v) => acc + (v.pacientes?.length || 0), 0)}
                  </div>
                  <div className="text-xs text-gray-500 uppercase font-bold">Passageiros</div>
                </div>
              </div>

              {/* Lista Detalhada das Viagens */}
              {viagens.map((viagem, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  {/* Cabeçalho do Card: Hora e Destino */}
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded text-sm">
                        {viagem.horario_saida.slice(0, 5)}
                      </div>
                      <span className="font-semibold text-gray-800">
                        {viagem.ubs_destino_nome || viagem.hospital_destino}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-gray-500 bg-gray-200 px-2 py-1 rounded">
                      {viagem.pacientes ? viagem.pacientes.length : 0} pac.
                    </span>
                  </div>

                  {/* Corpo do Card: Detalhes Rápidos */}
                  <div className="p-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold mb-1">Motorista</p>
                      <p className="text-gray-800 truncate">{viagem.motorista_nome || 'Não definido'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold mb-1">Veículo</p>
                      <p className="text-gray-800 truncate">
                        {viagem.veiculo_modelo ? `${viagem.veiculo_modelo} (${viagem.veiculo_placa})` : 'Não definido'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Botão de Impressão */}
        <div className="p-4 bg-white border-t border-gray-200">
          <button
            onClick={imprimirNaMesmaTela}
            disabled={carregando || viagens.length === 0}
            className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg shadow hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Imprimir Relatório Completo
          </button>
        </div>
      </div>
    </div>
  );
}