// app/components/CardViagem.js
'use client';

import { formatarData, formatarHora, formatarStatus, getCorStatus } from '../utils/helpers';

/**
 * COMPONENTE DE CARD DE VIAGEM
 * Exibe informações resumidas de uma viagem
 */
export default function CardViagem({ viagem, onClick }) {
  const statusClass = getCorStatus(viagem.status);

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
    >
      {/* Cabeçalho com data e status */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-sm font-semibold text-gray-900">
            {formatarData(viagem.dataViagem)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Saída: {formatarHora(viagem.horarioViagem)} • Consulta: {formatarHora(viagem.horarioConsulta)}
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusClass}`}>
          {formatarStatus(viagem.status)}
        </span>
      </div>

      {/* Motivo */}
      <div className="mb-2">
        <div className="font-medium text-gray-900">{viagem.motivo}</div>
        <div className="text-sm text-gray-600">{viagem.medico}</div>
      </div>

      {/* Hospital */}
      <div className="text-sm text-gray-500 flex items-center gap-1">
        <svg 
          className="w-4 h-4" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" 
          />
        </svg>
        {viagem.hospital}
      </div>

      {/* Indicador visual de clique */}
      <div className="mt-3 flex items-center justify-end text-xs text-primary">
        Ver detalhes
        <svg 
          className="w-4 h-4 ml-1" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M9 5l7 7-7 7" 
          />
        </svg>
      </div>
    </div>
  );
}