// app/components/InputCPF.js
'use client';

import { formatarCPF } from '../utils/helpers';

/**
 * COMPONENTE DE INPUT DE CPF
 * Formata automaticamente enquanto o usuário digita
 */
export default function InputCPF({ value, onChange, placeholder, className = '' }) {
  const handleChange = (e) => {
    const valor = e.target.value;
    const formatado = formatarCPF(valor);
    onChange(formatado);
  };

  return (
    <input
      type="text"
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      maxLength={14}
      className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all ${className}`}
    />
  );
}