//viagem/[id]/route.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '../../components/Header';
import { verificarAutenticacao, formatarData, formatarHora, formatarStatus } from '../../utils/helpers';

/**
 * PÁGINA DE DETALHES DA VIAGEM
 * Visual Web: Padrão.
 * Visual Impressão: Identidade visual azul alinhada com o relatório diário.
 */
export default function DetalhesViagemPage() {
  const router = useRouter();
  const params = useParams();
  
  // Estados principais
  const [viagem, setViagem] = useState(null);
  const [pacientes, setPacientes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [confirmando, setConfirmando] = useState(false);
  const [usuarioLogado, setUsuarioLogado] = useState(null);

  // Estados de Edição
  const [modoEdicao, setModoEdicao] = useState(false);
  const [editandoCampo, setEditandoCampo] = useState(null);

  // Estados temporários
  const [novoMotoristaId, setNovoMotoristaId] = useState('');
  const [novoOnibusId, setNovoOnibusId] = useState('');
  const [novoDestinoId, setNovoDestinoId] = useState('');
  const [novoDestinoNome, setNovoDestinoNome] = useState('');
  const [novoDestinoEndereco, setNovoDestinoEndereco] = useState('');
  const [novaDataViagem, setNovaDataViagem] = useState('');
  const [novoHorarioSaida, setNovoHorarioSaida] = useState('');

  // Dados auxiliares
  const [motoristas, setMotoristas] = useState([]);
  const [onibus, setOnibus] = useState([]);
  const [ubsList, setUbsList] = useState([]);

  // --- FUNÇÕES ---

  const handleAbrirCheckin = (paciente) => {
    router.push(`/viagem/${params.id}/paciente/${paciente.paciente_id}`);
  };

  const handleImprimirRelatorio = () => {
    window.print();
  };

  const handleImprimirComprovante = (paciente) => {
    const dataFormatada = new Date(viagem.data_viagem).toLocaleDateString('pt-BR', { 
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
        <title>Comprovante de Viagem</title>
        <style>
          @page { size: A4; margin: 15mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            font-size: 12px; 
            color: #1a1a1a; 
            background: #fff;
          }
          
          .cabecalho { 
            text-align: center; 
            padding: 20px; 
            background: #2563eb;
            color: white;
            margin-bottom: 30px;
            border-radius: 8px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .cabecalho h1 { 
            font-size: 24px; 
            font-weight: 700; 
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .cabecalho p { 
            font-size: 14px; 
            opacity: 0.95;
          }
          
          .info-viagem {
            background: #f8fafc;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
          }
          .info-linha {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #e2e8f0;
          }
          .info-linha:last-child { border-bottom: none; }
          .info-label {
            font-weight: 700;
            color: #475569;
            text-transform: uppercase;
            font-size: 11px;
          }
          .info-valor {
            font-size: 14px;
            font-weight: 600;
            color: #1e293b;
          }
          
          .dados-paciente {
            background: white;
            border: 2px solid #2563eb;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
          }
          .dados-paciente h2 {
            color: #2563eb;
            font-size: 16px;
            margin-bottom: 15px;
            text-transform: uppercase;
            border-bottom: 2px solid #e0e0e0;
            padding-bottom: 8px;
          }
          .dado-linha {
            padding: 8px 0;
            display: flex;
            gap: 10px;
          }
          
          .observacoes {
            background: #fffbeb;
            border: 2px solid #fbbf24;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 30px;
          }
          .observacoes h3 {
            color: #92400e;
            font-size: 14px;
            margin-bottom: 10px;
            text-transform: uppercase;
          }
          
          .assinatura {
            margin-top: 60px;
            padding-top: 20px;
            border-top: 2px solid #e0e0e0;
            text-align: center;
          }
          .linha-assinatura {
            border-top: 2px solid #000;
            width: 60%;
            margin: 40px auto 10px;
          }
          .assinatura p {
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            color: #475569;
          }
          
          .rodape {
            margin-top: 40px;
            padding: 15px;
            background: #eff6ff;
            border-radius: 8px;
            text-align: center;
            font-size: 10px;
            color: #1e40af;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        </style>
      </head>
      <body>
        <div class="cabecalho">
          <h1>Comprovante de Viagem</h1>
          <p>Transporte SUS - Itabaiana/PB</p>
        </div>
        
        <div class="info-viagem">
          <div class="info-linha">
            <span class="info-label">Código da Viagem</span>
            <span class="info-valor">${viagem.codigo_viagem}</span>
          </div>
          <div class="info-linha">
            <span class="info-label">Data</span>
            <span class="info-valor">${dataFormatada}</span>
          </div>
          <div class="info-linha">
            <span class="info-label">Horário de Saída</span>
            <span class="info-valor">${formatarHora(viagem.horario_saida)}</span>
          </div>
          <div class="info-linha">
            <span class="info-label">Destino</span>
            <span class="info-valor">${viagem.ubs_destino_nome || viagem.hospital_destino}</span>
          </div>
        </div>
        
        <div class="dados-paciente">
          <h2>Dados do Passageiro</h2>
          <div class="dado-linha">
            <span class="info-label">Nome Completo:</span>
            <span class="info-valor">${paciente.nome_completo}</span>
          </div>
          <div class="dado-linha">
            <span class="info-label">CPF:</span>
            <span class="info-valor">${paciente.cpf}</span>
          </div>
          <div class="dado-linha">
            <span class="info-label">Cartão SUS:</span>
            <span class="info-valor">${paciente.cartao_sus || 'N/A'}</span>
          </div>
          ${paciente.motivo ? `
            <div class="dado-linha">
              <span class="info-label">Motivo da Viagem:</span>
              <span class="info-valor">${paciente.motivo}</span>
            </div>
          ` : ''}
          ${paciente.horario_consulta ? `
            <div class="dado-linha">
              <span class="info-label">Horário da Consulta:</span>
              <span class="info-valor">${paciente.horario_consulta.substring(0, 5)}</span>
            </div>
          ` : ''}
        </div>
        
        ${paciente.observacoes ? `
          <div class="observacoes">
            <h3>Observações Importantes</h3>
            <p>${paciente.observacoes}</p>
          </div>
        ` : ''}
        
        <div class="assinatura">
          <div class="linha-assinatura"></div>
          <p>Assinatura do Passageiro</p>
        </div>
        
        <div class="rodape">
          <p>Este comprovante é válido apenas para a data e viagem especificadas acima.</p>
          <p>Emitido em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
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

  useEffect(() => {
    const autenticado = verificarAutenticacao(router);
    if (autenticado) {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (token) setUsuarioLogado(JSON.parse(token));
    }
    if (params?.id) {
      carregarViagem();
      carregarDadosAuxiliares();
    }
  }, [params.id, router]);

  const carregarViagem = async () => {
    try {
      const response = await fetch(`/api/viagem-detalhes/${params.id}`);
      const data = await response.json();

      if (response.ok) {
        setViagem(data.viagem);
        setPacientes(data.pacientes || []);
      } else {
        setErro(data.erro || 'Viagem não encontrada');
      }
    } catch (error) {
      setErro('Erro ao carregar viagem');
    } finally {
      setCarregando(false);
    }
  };

  const carregarDadosAuxiliares = async () => {
    try {
      const [resMotoristas, resOnibus, resUbs] = await Promise.all([
        fetch('/api/listar-motoristas'),
        fetch('/api/listar-onibus'),
        fetch('/api/listar-ubs')
      ]);
      if (resMotoristas.ok) { const d = await resMotoristas.json(); setMotoristas(d.motoristas || []); }
      if (resOnibus.ok) { const d = await resOnibus.json(); setOnibus(d.onibus || []); }
      if (resUbs.ok) { const d = await resUbs.json(); setUbsList(d.ubs || []); }
    } catch (error) { console.error(error); }
  };

  // --- LÓGICA DE EDIÇÃO ---
  const cancelarEdicao = () => { setModoEdicao(false); setEditandoCampo(null); setErro(''); };
  const formatarHorarioInput = (v) => { const n = v.replace(/\D/g, ''); return n.length <= 2 ? n : `${n.slice(0, 2)}h${n.slice(2, 4)}`; };
  
  const iniciarEdicaoMotorista = () => { setNovoMotoristaId(viagem.motorista_id || ''); setEditandoCampo('motorista'); setModoEdicao(true); };
  const salvarMotorista = async () => { await atualizarViagem({ motorista_id: novoMotoristaId || null }); };

  const iniciarEdicaoOnibus = () => { setNovoOnibusId(viagem.onibus_id || ''); setEditandoCampo('onibus'); setModoEdicao(true); };
  const salvarOnibus = async () => { 
      const bus = onibus.find(o => o.id === parseInt(novoOnibusId));
      await atualizarViagem({ onibus_id: novoOnibusId || null, numero_vagas: bus?.capacidade_passageiros }); 
  };

  const iniciarEdicaoDestino = () => { setNovoDestinoId(viagem.ubs_destino_id || 'outro'); setNovoDestinoNome(viagem.ubs_destino_nome || viagem.hospital_destino || ''); setNovoDestinoEndereco(viagem.ubs_destino_endereco || viagem.endereco_destino || ''); setEditandoCampo('destino'); setModoEdicao(true); };
  const salvarDestino = async () => {
      let nome = novoDestinoNome;
      if (novoDestinoId !== 'outro') { const u = ubsList.find(i => i.id === parseInt(novoDestinoId)); if(u) nome = u.nome; }
      await atualizarViagem({ ubs_destino_id: novoDestinoId !== 'outro' ? parseInt(novoDestinoId) : null, hospital_destino: nome, endereco_destino: novoDestinoEndereco });
  };

  const iniciarEdicaoDataHora = () => { 
      const d = typeof viagem.data_viagem === 'string' ? viagem.data_viagem.split('T')[0] : new Date(viagem.data_viagem).toISOString().split('T')[0];
      setNovaDataViagem(d); setNovoHorarioSaida(viagem.horario_saida ? viagem.horario_saida.substring(0, 5).replace(':', 'h') : ''); setEditandoCampo('datahora'); setModoEdicao(true); 
  };
  const salvarDataHora = async () => { await atualizarViagem({ data_viagem: novaDataViagem, horario_saida: novoHorarioSaida.replace('h', ':') }); };

  const atualizarViagem = async (body) => {
      const res = await fetch(`/api/atualizar-viagem/${params.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) { carregarViagem(); cancelarEdicao(); } else { alert('Erro ao atualizar'); }
  };

  const handleConfirmarViagem = async () => {
      if (!confirm('Confirmar viagem?')) return;
      setConfirmando(true);
      const res = await fetch(`/api/viagem/${params.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'confirmado' }) });
      if (res.ok) { carregarViagem(); alert('Sucesso!'); } setConfirmando(false);
  };

  const handleAdicionarPaciente = () => router.push(`/adicionar-paciente/${params.id}`);

  // --- RENDER ---
  if (carregando) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Carregando...</div>;
  if (erro || !viagem) return <div className="p-6 text-red-600">{erro || 'Erro'}</div>;

  const ehAdministrador = usuarioLogado?.role === 'administrador';
  const totalPacientes = pacientes.length;
  const vagasDisponiveis = viagem.numero_vagas - totalPacientes;
  const viagemLotada = vagasDisponiveis <= 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 print:bg-white print:pb-0">
      
      {/* 1. CONFIGURAÇÃO DE IMPRESSÃO */}
      <style jsx global>{`
        @media print {
          @page { margin: 10mm; size: A4; }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; font-family: Arial, sans-serif; color: #000; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
        }
        .print-only { display: none; }
      `}</style>

      {/* HEADER SITE (Some na impressão) */}
      <div className="no-print">
        <Header titulo="Detalhes da Viagem" mostrarVoltar voltarPara="/gerenciar-viagens" />
      </div>

      {/* =================================================================================
          2. LAYOUT DO RELATÓRIO (ESCONDIDO NA TELA, APARECE SÓ AO IMPRIMIR)
         ================================================================================= */}
      <div className="print-only w-full" style={{ padding: '20px' }}>
        
        <div style={{ textAlign: 'center', padding: '16px', background: '#2563eb', color: 'white', marginBottom: '20px', borderRadius: '8px', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Relatório de Viagem
          </h1>
          <p style={{ fontSize: '13px', opacity: 0.95 }}>
            Transporte SUS - Itabaiana/PB
          </p>
        </div>

        <div style={{ marginBottom: '25px', padding: '16px', background: 'white', border: '2px solid #e0e0e0', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', paddingBottom: '12px', borderBottom: '2px solid #e0e0e0' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Código da Viagem</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b' }}>{viagem.codigo_viagem}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Status</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: viagem.status === 'confirmado' ? '#16a34a' : '#eab308' }}>
                {formatarStatus(viagem.status)}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '15px' }}>
            <div>
              <div style={{ fontSize: '10px', color: '#475569', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>Data da Viagem</div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b' }}>{formatarData(viagem.data_viagem)}</div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: '#475569', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>Horário de Saída</div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b' }}>{formatarHora(viagem.horario_saida)}</div>
            </div>
          </div>

          <div style={{ paddingTop: '15px', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '10px', color: '#475569', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>Destino</div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}>
              {viagem.ubs_destino_nome || viagem.hospital_destino}
            </div>
            {(viagem.ubs_destino_endereco || viagem.endereco_destino) && (
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                {viagem.ubs_destino_endereco || viagem.endereco_destino}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '25px' }}>
          <div style={{ padding: '16px', background: '#f8fafc', border: '2px solid #e0e0e0', borderRadius: '8px' }}>
            <div style={{ fontSize: '11px', color: '#2563eb', textTransform: 'uppercase', fontWeight: 700, marginBottom: '12px', borderBottom: '2px solid #e0e0e0', paddingBottom: '6px' }}>
              Motorista Responsável
            </div>
            <div style={{ fontSize: '12px', color: '#1e293b', lineHeight: 1.6 }}>
              <div style={{ marginBottom: '6px' }}>
                <span style={{ fontWeight: 700 }}>Nome:</span> {viagem.motorista_nome || 'Não informado'}
              </div>
              <div style={{ marginBottom: '6px' }}>
                <span style={{ fontWeight: 700 }}>Contato:</span> {viagem.motorista_telefone || 'N/A'}
              </div>
              <div>
                <span style={{ fontWeight: 700 }}>CNH:</span> {viagem.motorista_cnh || 'N/A'}
              </div>
            </div>
          </div>

          <div style={{ padding: '16px', background: '#f8fafc', border: '2px solid #e0e0e0', borderRadius: '8px' }}>
            <div style={{ fontSize: '11px', color: '#2563eb', textTransform: 'uppercase', fontWeight: 700, marginBottom: '12px', borderBottom: '2px solid #e0e0e0', paddingBottom: '6px' }}>
              Veículo Utilizado
            </div>
            <div style={{ fontSize: '12px', color: '#1e293b', lineHeight: 1.6 }}>
              <div style={{ marginBottom: '6px' }}>
                <span style={{ fontWeight: 700 }}>Modelo:</span> {viagem.onibus_modelo || viagem.veiculo_modelo || 'N/A'}
              </div>
              <div style={{ marginBottom: '6px' }}>
                <span style={{ fontWeight: 700 }}>Placa:</span> {viagem.onibus_placa || viagem.veiculo_placa || 'N/A'}
              </div>
              <div>
                <span style={{ fontWeight: 700 }}>Capacidade:</span> {viagem.numero_vagas || viagem.onibus_capacidade || 0} lugares
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '10px', paddingBottom: '8px', borderBottom: '2px solid #2563eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', color: '#2563eb' }}>
              Lista de Passageiros
            </h2>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>
              Total: {pacientes.length}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {pacientes.map((paciente, index) => (
            <div key={paciente.paciente_id} style={{ borderBottom: '1px solid #e2e8f0', padding: '12px 8px', display: 'flex', gap: '12px', fontSize: '11px', color: '#1a1a1a', pageBreakInside: 'avoid' }}>
              <div style={{ width: '24px', fontWeight: 700, color: '#64748b', paddingTop: '2px' }}>
                {index + 1}.
              </div>
              
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '8px' }}>
                <div style={{ gridColumn: 'span 8' }}>
                  <span style={{ fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', color: '#1e293b' }}>
                    {paciente.nome_completo}
                  </span>
                  <span style={{ marginLeft: '8px', color: '#64748b' }}>
                    CPF: {paciente.cpf}
                  </span>
                </div>
                <div style={{ gridColumn: 'span 4', textAlign: 'right', fontSize: '10px', color: '#64748b' }}>
                  {paciente.compareceu ? (
                    <span style={{ background: '#16a34a', color: 'white', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, fontSize: '9px' }}>
                      EMBARCADO
                    </span>
                  ) : (
                    <span>[ ] Não embarcado</span>
                  )}
                </div>

                <div style={{ gridColumn: 'span 12', fontSize: '11px', color: '#475569' }}>
                  <span style={{ fontWeight: 700 }}>Cartão SUS:</span> {paciente.cartao_sus || 'N/A'}
                </div>

                {paciente.motivo && (
                  <div style={{ gridColumn: 'span 12', fontSize: '11px', color: '#475569', marginTop: '4px' }}>
                    <span style={{ fontWeight: 700 }}>Motivo:</span> {paciente.motivo}
                  </div>
                )}

                {paciente.horario_consulta && (
                  <div style={{ gridColumn: 'span 6', fontSize: '11px', color: '#475569' }}>
                    <span style={{ fontWeight: 700 }}>Horário Consulta:</span> {paciente.horario_consulta.substring(0, 5)}
                  </div>
                )}

                {paciente.paciente_ubs_nome && (
                  <div style={{ gridColumn: 'span 6', fontSize: '11px', color: '#475569' }}>
                    <span style={{ fontWeight: 700 }}>UBS:</span> {paciente.paciente_ubs_nome}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '30px', padding: '20px', borderTop: '2px solid #e0e0e0', background: '#eff6ff', borderRadius: '8px', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
          <div style={{ textAlign: 'right', marginBottom: '40px', color: '#1e40af' }}>
            <span style={{ fontSize: '18px', fontWeight: 700, textTransform: 'uppercase' }}>
              Total de Passageiros: {pacientes.length}
            </span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#1e40af', padding: '0 20px' }}>
            <div style={{ textAlign: 'center', width: '45%' }}>
              <div style={{ borderTop: '2px solid #2563eb', width: '100%', marginBottom: '8px' }}></div>
              <p style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Assinatura do Motorista
              </p>
            </div>
            <div style={{ textAlign: 'center', width: '45%' }}>
              <div style={{ borderTop: '2px solid #2563eb', width: '100%', marginBottom: '8px' }}></div>
              <p style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Responsável TFD
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* FIM DO LAYOUT DE IMPRESSÃO */}


      {/* =================================================================================
          3. LAYOUT DE TELA (O ORIGINAL)
         ================================================================================= */}
      <main className="container mx-auto px-4 py-6 max-w-2xl no-print">
        
        {/* Card Principal */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-primary to-blue-600 text-white p-6 relative">
            {ehAdministrador && !modoEdicao && (
              <button onClick={iniciarEdicaoDataHora} className="absolute top-6 right-6 text-blue-100 hover:text-white transition-colors bg-white/10 p-2 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </button>
            )}
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-blue-100 text-sm font-medium mb-1">CÓDIGO</div>
                <div className="text-2xl font-bold tracking-wider">{viagem.codigo_viagem}</div>
              </div>
              {!editandoCampo && (
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase shadow-sm ${viagem.status === 'confirmado' ? 'bg-green-500 text-white' : 'bg-yellow-400 text-yellow-900'}`}>
                  {formatarStatus(viagem.status)}
                </span>
              )}
            </div>
            {editandoCampo === 'datahora' ? (
                <div className="bg-white/10 p-4 rounded-lg mt-2 space-y-3 border border-white/20">
                    <div className="grid grid-cols-2 gap-3">
                        <input type="date" value={novaDataViagem} onChange={(e) => setNovaDataViagem(e.target.value)} className="w-full px-3 py-2 text-sm rounded text-gray-900 outline-none" />
                        <input type="text" value={novoHorarioSaida} onChange={(e) => setNovoHorarioSaida(formatarHorarioInput(e.target.value))} className="w-full px-3 py-2 text-sm rounded text-gray-900 outline-none" />
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button onClick={salvarDataHora} className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded text-sm font-medium">Salvar</button>
                        <button onClick={cancelarEdicao} className="flex-1 py-2 bg-white/20 hover:bg-white/30 text-white rounded text-sm font-medium">Cancelar</button>
                    </div>
                </div>
            ) : (
                <div className="flex items-center gap-6 mt-2">
                    <div><div className="text-blue-100 text-xs uppercase mb-1">Data</div><div className="text-xl font-semibold">{formatarData(viagem.data_viagem)}</div></div>
                    <div className="w-px h-10 bg-blue-400/30"></div>
                    <div><div className="text-blue-100 text-xs uppercase mb-1">Saída</div><div className="text-xl font-semibold">{formatarHora(viagem.horario_saida)}</div></div>
                </div>
            )}
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card DESTINO */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-gray-500 uppercase">Destino</h3>
                  {ehAdministrador && !modoEdicao && (
                    <button onClick={iniciarEdicaoDestino} className="text-blue-600 hover:text-blue-800"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                  )}
                </div>
                {editandoCampo === 'destino' ? (
                  <div className="space-y-3">
                    <select value={novoDestinoId} onChange={(e) => { setNovoDestinoId(e.target.value); if (e.target.value !== 'outro') setNovoDestinoNome(''); }} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none"><option value="">Selecione...</option>{ubsList.map((ubs) => (<option key={ubs.id} value={ubs.id}>{ubs.nome}</option>))}<option value="outro">Outro</option></select>
                    {novoDestinoId === 'outro' && <input type="text" value={novoDestinoNome} onChange={(e) => setNovoDestinoNome(e.target.value)} placeholder="Nome do local" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none" />}
                    <input type="text" value={novoDestinoEndereco} onChange={(e) => setNovoDestinoEndereco(e.target.value)} placeholder="Endereço" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none" />
                    <div className="flex gap-2"><button onClick={salvarDestino} className="flex-1 py-1.5 bg-green-600 text-white rounded text-xs">Salvar</button><button onClick={cancelarEdicao} className="flex-1 py-1.5 bg-gray-200 text-gray-700 rounded text-xs">Cancelar</button></div>
                  </div>
                ) : (
                  <>
                    <div className="font-medium text-gray-900">{viagem.ubs_destino_nome || viagem.hospital_destino}</div>
                    {(viagem.ubs_destino_endereco || viagem.endereco_destino) && <div className="text-sm text-gray-500 mt-1">{viagem.ubs_destino_endereco || viagem.endereco_destino}</div>}
                    {viagem.ubs_destino_nome && <div className="text-xs text-blue-600 mt-1 font-medium">Unidade Básica de Saúde</div>}
                  </>
                )}
              </div>

              {/* Card OCUPAÇÃO */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Ocupação</h3>
                <div className="flex items-end gap-2"><span className="text-2xl font-bold text-gray-900">{totalPacientes}</span><span className="text-sm text-gray-500 mb-1">/ {viagem.numero_vagas} vagas</span></div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2"><div className={`h-2 rounded-full ${viagemLotada ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${Math.min((totalPacientes / viagem.numero_vagas) * 100, 100)}%` }}></div></div>
                {totalPacientes > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm"><span className="text-gray-600">Comparecimento:</span><div className="flex items-center gap-2"><span className="font-bold text-green-600">{pacientes.filter(p => p.compareceu).length}</span><span className="text-gray-400">/</span><span className="font-bold text-gray-900">{totalPacientes}</span></div></div>
                    <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-green-500 transition-all" style={{ width: `${(pacientes.filter(p => p.compareceu).length / totalPacientes) * 100}%` }} /></div>
                  </div>
                )}
              </div>
            </div>

            {/* Motorista e Ônibus */}
            <div className="border-t border-gray-100 pt-4">
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>Logística</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between"><div className="text-xs text-gray-500">Motorista</div>{ehAdministrador && !modoEdicao && (<button onClick={iniciarEdicaoMotorista} className="text-blue-600 hover:text-blue-800" title="Editar Motorista"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>)}</div>
                    {editandoCampo === 'motorista' ? (<div className="mt-2 space-y-2"><select value={novoMotoristaId} onChange={(e) => setNovoMotoristaId(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none"><option value="">Nenhum motorista</option>{motoristas.map((m) => (<option key={m.id} value={m.id}>{m.nome_completo}</option>))}</select><div className="flex gap-2"><button onClick={salvarMotorista} className="flex-1 py-1.5 bg-green-600 text-white rounded text-xs">Salvar</button><button onClick={cancelarEdicao} className="flex-1 py-1.5 bg-gray-200 text-gray-700 rounded text-xs">Cancelar</button></div></div>) : (<><div className="font-medium text-gray-900">{viagem.motorista_nome || 'Não definido'}</div>{viagem.motorista_telefone && <div className="text-xs text-gray-500">{viagem.motorista_telefone}</div>}</>)}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between"><div className="text-xs text-gray-500">Veículo</div>{ehAdministrador && !modoEdicao && (<button onClick={iniciarEdicaoOnibus} className="text-blue-600 hover:text-blue-800" title="Editar Ônibus"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>)}</div>
                    {editandoCampo === 'onibus' ? (<div className="mt-2 space-y-2"><select value={novoOnibusId} onChange={(e) => setNovoOnibusId(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none"><option value="">Nenhum ônibus</option>{onibus.map((o) => (<option key={o.id} value={o.id}>{o.placa} - {o.modelo}</option>))}</select><div className="flex gap-2"><button onClick={salvarOnibus} className="flex-1 py-1.5 bg-green-600 text-white rounded text-xs">Salvar</button><button onClick={cancelarEdicao} className="flex-1 py-1.5 bg-gray-200 text-gray-700 rounded text-xs">Cancelar</button></div></div>) : (<>{viagem.onibus_placa ? (<><div className="font-medium text-gray-900">{viagem.onibus_placa}</div><div className="text-xs text-gray-500">{viagem.onibus_modelo} {viagem.onibus_cor ? `• ${viagem.onibus_cor}` : ''}</div></>) : (<div className="text-sm text-gray-400 italic">Não definido</div>)}</>)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Pacientes (Tela) */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Lista de Passageiros</h2>
          {pacientes.length === 0 ? (
            <div className="text-center py-8 text-gray-400 border border-dashed rounded-lg">Nenhum paciente cadastrado nesta viagem ainda.</div>
          ) : (
            <div className="space-y-3">
              {pacientes.map((paciente) => (
                <div key={paciente.paciente_id} onClick={() => handleAbrirCheckin(paciente)} className={`border rounded-lg p-4 cursor-pointer transition-all ${paciente.compareceu ? 'bg-green-50 border-green-300 hover:bg-green-100' : 'bg-white border-gray-200 hover:border-primary hover:shadow-md'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2"><h4 className="font-semibold text-gray-900">{paciente.nome_completo}</h4>{paciente.compareceu && (<span className="flex items-center gap-1 bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded-full"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>EMBARCADO</span>)}</div>
                      <div className="text-xs text-gray-600 space-y-0.5"><div>CPF: {paciente.cpf}</div><div>Cartão SUS: {paciente.cartao_sus}</div></div>
                      {paciente.motivo && <div className="mt-2 text-sm text-gray-700"><span className="font-medium">Motivo:</span> {paciente.motivo}</div>}
                      {paciente.horario_consulta && <div className="text-xs text-gray-600 mt-1">Consulta: {paciente.horario_consulta.substring(0, 5)}</div>}
                      {paciente.paciente_ubs_nome && <div className="text-xs text-gray-500 mt-1">UBS: {paciente.paciente_ubs_nome}</div>}
                    </div>
                    <div className={`ml-3 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${paciente.compareceu ? 'bg-green-600' : 'bg-gray-200'}`}>
                      {paciente.compareceu ? (<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>) : (<svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>)}
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      handleImprimirComprovante(paciente); 
                    }} 
                    className="mt-3 text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Imprimir Comprovante
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="space-y-3">
          <button onClick={handleImprimirRelatorio} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-lg shadow-md transition-all flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            Imprimir Relatório de Viagem
          </button>

          {viagem.status === 'pendente' && ehAdministrador && (
            <button onClick={handleConfirmarViagem} disabled={confirmando} className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 rounded-lg shadow-md transition-all flex items-center justify-center gap-2">
              {confirmando ? 'Confirmando...' : 'Confirmar Realização da Viagem'}
            </button>
          )}

          {ehAdministrador && (
            <div className="grid grid-cols-2 gap-3">
               <button onClick={handleAdicionarPaciente} disabled={viagemLotada} className={`w-full font-semibold py-3 rounded-lg shadow-sm border transition-all ${viagemLotada ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' : 'bg-white text-primary border-primary hover:bg-primary hover:text-white'}`}>{viagemLotada ? 'Lotada' : '+ Add Passageiro'}</button>
               <button onClick={() => router.push('/gerenciar-viagens')} className="w-full bg-white text-gray-700 font-semibold py-3 rounded-lg shadow-sm border border-gray-300 hover:bg-gray-50 transition-all">Voltar</button>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}