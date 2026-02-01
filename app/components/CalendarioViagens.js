"app/components/CalendarioViagens.js"

'use client';

import { useState, useEffect } from 'react';

export default function CalendarioViagens({ onSelecionarData }) {
  // Estado para armazenar as datas que possuem viagens
  const [datasComViagens, setDatasComViagens] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [diasCalendario, setDiasCalendario] = useState([]);

  // ✅ FUNÇÃO AUXILIAR PARA FORMATAR DATA LOCAL (YYYY-MM-DD)
  // Isso resolve o problema de fuso horário pintando o dia errado
  const formatarDataLocal = (data) => {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  };

  useEffect(() => {
    // 1. Gera os dias do calendário (Hoje + 29 dias)
    const hoje = new Date();
    const dias = [];
    for (let i = 0; i < 30; i++) {
      const data = new Date(hoje);
      data.setDate(hoje.getDate() + i);
      dias.push(data);
    }
    setDiasCalendario(dias);

    // 2. Busca as viagens para esses dias
    carregarDatasComViagens();
  }, []);

  const carregarDatasComViagens = async () => {
    setCarregando(true);
    try {
      const hoje = new Date();
      const em30Dias = new Date();
      em30Dias.setDate(hoje.getDate() + 30);

      // ✅ Usa a formatação local para buscar na API
      const dataInicio = formatarDataLocal(hoje);
      const dataFim = formatarDataLocal(em30Dias);

      console.log('📅 Buscando viagens entre:', dataInicio, 'e', dataFim);

      const response = await fetch(
        `/api/datas-com-viagens?dataInicio=${dataInicio}&dataFim=${dataFim}`
      );
      
      if (response.ok) {
        const data = await response.json();
        // Espera receber um array de objetos: [{ data: '2026-01-31', total_viagens: 2 }]
        console.log('✅ Datas com viagens:', data.datas);
        setDatasComViagens(data.datas || []);
      } else {
        console.error('❌ Erro na API:', await response.text());
      }
    } catch (error) {
      console.error('💥 Erro ao carregar datas:', error);
    } finally {
      setCarregando(false);
    }
  };

  const temViagem = (data) => {
    // ✅ CORREÇÃO CRUCIAL:
    // Usa a mesma formatação local para comparar com o banco
    // Antes estava usando toISOString() que mudava o dia devido ao fuso horário
    const dataStr = formatarDataLocal(data);
    return datasComViagens.find(d => d.data === dataStr);
  };

  const formatarDiaSemana = (data) => {
    const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return dias[data.getDay()];
  };

  const ehHoje = (data) => {
    const hoje = new Date();
    return data.toDateString() === hoje.toDateString();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">
          Calendário de Viagens
        </h2>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-600 font-medium">Dias com viagem</span>
        </div>
      </div>

      {carregando ? (
        <div className="text-center py-8">
          <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-gray-500 text-xs">Sincronizando agenda...</p>
        </div>
      ) : (
        // Container com SCROLL HORIZONTAL (Melhor para mobile)
        <div className="flex overflow-x-auto pb-4 gap-3 no-scrollbar scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {diasCalendario.map((dia, index) => {
            const infoViagem = temViagem(dia);
            const isHoje = ehHoje(dia);
            
            return (
              <button
                key={index}
                // Só permite clicar se tiver viagem (infoViagem existe)
                onClick={() => infoViagem && onSelecionarData(dia)}
                disabled={!infoViagem}
                className={`
                  flex flex-col items-center justify-center min-w-[75px] h-[85px] rounded-xl border transition-all duration-200 flex-shrink-0 relative
                  ${infoViagem 
                    ? 'bg-yellow-100 border-yellow-400 shadow-md cursor-pointer hover:scale-105 hover:bg-yellow-200 text-yellow-900' 
                    : 'bg-gray-50 border-gray-100 text-gray-400 cursor-default opacity-60'
                  }
                  ${isHoje ? 'ring-2 ring-primary ring-offset-2' : ''}
                `}
              >
                {isHoje && (
                    <span className="absolute -top-2 bg-primary text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold shadow-sm">HOJE</span>
                )}

                <span className={`text-xs font-bold uppercase mb-1 ${infoViagem ? 'text-yellow-800' : 'text-gray-400'}`}>
                  {formatarDiaSemana(dia)}
                </span>
                
                <span className="text-2xl font-black">
                  {dia.getDate()}
                </span>

                {/* Indicadores de volume (bolinhas) */}
                {infoViagem && (
                  <div className="mt-1 flex gap-0.5">
                     {[...Array(Math.min(parseInt(infoViagem.total_viagens) || 1, 3))].map((_, i) => (
                        <div key={i} className="w-1.5 h-1.5 bg-yellow-700 rounded-full"></div>
                     ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-center text-gray-500 flex items-center justify-center gap-2">
          <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
          Toque em um dia destacado para ver detalhes
        </p>
      </div>
    </div>
  );
}