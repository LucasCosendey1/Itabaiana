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

  // NOVA FUNÇÃO ADICIONADA: Gerar cores automáticas
  const obterCoresPorDestino = () => {
    const coresDisponiveis = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4'];
    const destinosUnicos = [];
    const mapaCores = {};
  
    viagens.forEach(viagem => {
      const destino = (viagem.ubs_destino_nome || viagem.hospital_destino || '').trim();
      if (!destinosUnicos.includes(destino)) {
        destinosUnicos.push(destino);
        mapaCores[destino] = coresDisponiveis[destinosUnicos.length - 1] || '#64748b';
      }
    });
  
    return { mapaCores, destinosUnicos };
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
          @page { size: A4; margin: 8mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            font-size: 9px; 
            color: #1a1a1a; 
            background: #fff;
          }
          
          .cabecalho { 
            text-align: center; 
            padding: 12px; 
            background: #2563eb; /* ALTERADO */
            color: white;
            margin-bottom: 15px;
            border-radius: 8px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .cabecalho h1 { 
            font-size: 18px; 
            font-weight: 700; 
            margin-bottom: 4px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .cabecalho p { 
            font-size: 11px; 
            opacity: 0.95;
            text-transform: capitalize;
          }
          
          /* ALTERADO: De Grid para Flex Column */
          .container-viagens {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-bottom: 15px;
          }
          
          /* ALTERADO: Largura 100% */
          .viagem-card {
            break-inside: avoid;
            page-break-inside: avoid;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            overflow: hidden;
            background: white;
            width: 100%;
          }
          
          .viagem-header {
            padding: 12px 14px;
            color: white;
            font-weight: 700;
            font-size: 13px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          /* CLASSES DE CORES FIXAS REMOVIDAS AQUI */
          
          .horario-badge {
            background: rgba(255,255,255,0.3);
            padding: 4px 10px;
            border-radius: 4px;
            font-size: 13px;
            font-weight: 800;
          }
          
          .dados-tecnicos {
            padding: 12px 14px;
            background: #f8fafc;
            border-bottom: 1px solid #e2e8f0;
            font-size: 10px;
            line-height: 1.8;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .dados-linha { margin-bottom: 5px; }
          .label-tec { 
            font-weight: 700; 
            color: #475569;
            text-transform: uppercase;
            font-size: 9px;
            letter-spacing: 0.3px;
          }
          
          .lista-pacientes {
            padding: 12px 14px;
          }
          .paciente-item {
            padding: 8px 0;
            border-bottom: 1px dashed #e2e8f0;
            font-size: 10px;
            line-height: 1.6;
          }
          .paciente-item:last-child { border-bottom: none; }
          .paciente-numero {
          display: inline-block;
          background: #e2e8f0;
          color: #475569;
          width: 20px;
          height: 20px;
          text-align: center;
          line-height: 20px;
          border-radius: 50%;
          font-weight: 700;
          font-size: 10px;
          margin-right: 8px;
        }
          .paciente-nome { 
            font-weight: 700; 
            color: #1e293b;
            font-size: 11px;
          }
          .paciente-info { 
            color: #64748b; 
            margin-top: 3px;
            font-size: 9px;
          }
          .paciente-obs {
            color: #475569;
            font-style: italic;
            margin-top: 3px;
            font-size: 9px;
          }
          
          /* ALTERADO: Estilo do Resumo */
          .resumo-final {
            background: white;
            border: 2px solid #e0e0e0;
            padding: 12px;
            border-radius: 8px;
            margin-top: 15px;
          }
          
          /* ALTERADO: Título com borda */
          .resumo-titulo {
            font-size: 12px;
            font-weight: 700;
            text-align: center;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #1e293b;
            border-bottom: 2px solid #e0e0e0;
            padding-bottom: 8px;
          }

          /* ADICIONADO: Estilos da Tabela de Resumo */
          .resumo-tabela {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
          }
          .resumo-tabela th {
            background: #f1f5f9;
            padding: 8px;
            text-align: left;
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            border-bottom: 2px solid #e0e0e0;
            color: #475569;
          }
          .resumo-tabela td {
            padding: 8px;
            font-size: 9px;
            border-bottom: 1px solid #e2e8f0;
            color: #1e293b;
          }
          .resumo-tabela tr:last-child td {
            border-bottom: none;
          }
          .cor-indicador {
            width: 30px;
            height: 20px;
            border-radius: 4px;
            display: inline-block;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          /* ALTERADO: Total alinhado à direita */
          .total-destaque {
            text-align: right;
            font-size: 14px;
            font-weight: 900;
            padding: 12px 8px 8px 8px;
            color: #1e293b;
            border-top: 2px solid #1e293b;
            margin-top: 8px;
          }
          
          /* ALTERADO: Legenda Flex Wrap */
          .legenda {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            margin-top: 12px;
            padding-top: 12px;
            border-top: 2px solid #e0e0e0;
          }
          .legenda-item {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 9px;
            color: #475569;
            font-weight: 600;
          }
          .legenda-cor {
            width: 20px;
            height: 12px;
            border-radius: 3px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .sem-pacientes {
            text-align: center;
            padding: 20px;
            color: #94a3b8;
            font-style: italic;
            font-size: 9px;
          }
        </style>
      </head>
      <body>
        <div class="cabecalho">
          <h1>Relatório Diário de Transporte</h1>
          <p>${dataFormatada}</p>
        </div>
        
        <div class="container-viagens">
          ${(() => {
            const { mapaCores } = obterCoresPorDestino();
            
            return viagens.map(viagem => {
              const destino = viagem.ubs_destino_nome || viagem.hospital_destino;
              const corDestino = mapaCores[destino];
              
              return `
                <div class="viagem-card">
                  <div class="viagem-header" style="background: ${corDestino};">
                    <span>${destino}</span>
                    <span class="horario-badge">${viagem.horario_saida.slice(0,5)}</span>
                  </div>
                  
                  <div class="dados-tecnicos">
                    <div class="dados-linha">
                      <span class="label-tec">Motorista:</span> ${viagem.motorista_nome || 'A DEFINIR'}
                      ${viagem.motorista_telefone ? ` | <span class="label-tec">Tel:</span> ${viagem.motorista_telefone}` : ''}
                    </div>
                    <div class="dados-linha">
                      <span class="label-tec">Veículo:</span> ${viagem.veiculo_modelo || 'N/A'} (${viagem.veiculo_placa || 'N/A'})
                      | <span class="label-tec">Cap:</span> ${viagem.veiculo_capacidade || 0} lug.
                    </div>
                  </div>
                  
                  <div class="lista-pacientes">
                    ${viagem.pacientes && viagem.pacientes.length > 0 ? 
                      viagem.pacientes.map((p, i) => `
                        <div class="paciente-item">
                          <div>
                            <span class="paciente-numero">${i + 1}</span>
                            <span class="paciente-nome">${p.paciente_nome}</span>
                          </div>
                          <div class="paciente-info">
                            CPF: ${p.paciente_cpf} | SUS: ${p.cartao_sus || 'N/A'} | ${calcularIdade(p.paciente_data_nascimento)}
                          </div>
                          <div class="paciente-info">
                            Local: ${p.paciente_ubs_nome || p.paciente_endereco || 'Não informado'} | Tel: ${p.paciente_telefone || 'N/A'}
                          </div>
                          ${p.motivo ? `<div class="paciente-obs">${p.motivo}${p.medico_nome ? ` - Dr(a). ${p.medico_nome}` : ''}</div>` : ''}
                        </div>
                      `).join('') 
                      : 
                      '<div class="sem-pacientes">Nenhum paciente cadastrado</div>'
                    }
                  </div>
                </div>
              `;
            }).join('');
          })()}
        </div>
        
        <div class="resumo-final">
          <div class="resumo-titulo">Resumo Geral do Dia</div>
          
          ${(() => {
            const { mapaCores, destinosUnicos } = obterCoresPorDestino();
            
            return `
              <table class="resumo-tabela">
                <thead>
                  <tr>
                    <th style="width: 60px;">Cor</th>
                    <th>Destino</th>
                    <th style="width: 120px; text-align: center;">Passageiros</th>
                    <th style="width: 180px;">Motorista</th>
                  </tr>
                </thead>
                <tbody>
                  ${viagens.map(v => {
                    const destino = v.ubs_destino_nome || v.hospital_destino;
                    const cor = mapaCores[destino];
                    return `
                      <tr>
                        <td><div class="cor-indicador" style="background: ${cor};"></div></td>
                        <td><strong>${destino}</strong></td>
                        <td style="text-align: center;"><strong>${v.pacientes ? v.pacientes.length : 0}</strong></td>
                        <td>${v.motorista_nome || 'A definir'}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
              
              <div class="total-destaque">
                TOTAL: ${viagens.reduce((acc, v) => acc + (v.pacientes ? v.pacientes.length : 0), 0)} PASSAGEIROS
              </div>
              
              <div class="legenda">
                ${destinosUnicos.map(destino => `
                  <div class="legenda-item">
                    <div class="legenda-cor" style="background: ${mapaCores[destino]};"></div>
                    <span>${destino}</span>
                  </div>
                `).join('')}
              </div>
            `;
          })()}
        </div>
      </body>
      </html>
    `;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    
    document.body.appendChild(iframe);
    
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(conteudoHTML);
    doc.close();

    iframe.contentWindow.focus();
    setTimeout(() => {
      iframe.contentWindow.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 500);
  };

  if (!data) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        
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

              {viagens.map((viagem, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
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