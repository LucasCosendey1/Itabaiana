// app/utils/helpers.js

/**
 * FUNÇÕES UTILITÁRIAS
 */

// ============================================
// FORMATAÇÃO
// ============================================

/**
 * Formata CPF: 12345678900 → 123.456.789-00
 */
export function formatarCPF(valor) {
  // Remove tudo que não é número
  const numeros = valor.replace(/\D/g, '');
  
  // Aplica a máscara
  return numeros
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

/**
 * Formata data: 2026-02-05 → 05/02/2026
 */
export function formatarData(data) {
  if (!data) return '';
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
}

/**
 * Formata hora: "09:30" → "09h30"
 */
export function formatarHora(hora) {
  if (!hora) return '';
  return hora.replace(':', 'h');
}

/**
 * Retorna nome resumido (primeiro + último)
 * "Ana Maria da Silva" → "Ana Silva"
 */
export function getNomeResumido(nomeCompleto) {
  const partes = nomeCompleto.trim().split(' ');
  if (partes.length === 1) return partes[0];
  return `${partes[0]} ${partes[partes.length - 1]}`;
}

/**
 * Formata status para exibição
 */
export function formatarStatus(status) {
  const statusMap = {
    'pendente': 'Pendente',
    'confirmado': 'Confirmado',
    'realizado': 'Realizado'
  };
  return statusMap[status] || status;
}

/**
 * Retorna cor do badge de status
 */
export function getCorStatus(status) {
  const cores = {
    'pendente': 'bg-yellow-100 text-yellow-800',
    'confirmado': 'bg-green-100 text-green-800',
    'realizado': 'bg-gray-100 text-gray-800'
  };
  return cores[status] || 'bg-gray-100 text-gray-800';
}

// ============================================
// AUTENTICAÇÃO (localStorage)
// ============================================

/**
 * Salva token de autenticação
 */
export function salvarToken(usuario) {
  if (typeof window !== 'undefined') {
    const token = {
      cpf: usuario.cpf,
      nome: usuario.nome,
      role: usuario.role,
      timestamp: new Date().getTime()
    };
    localStorage.setItem('auth_token', JSON.stringify(token));
  }
}

/**
 * Recupera token de autenticação
 */
export function getToken() {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    return token ? JSON.parse(token) : null;
  }
  return null;
}

/**
 * Remove token (logout)
 */
export function removerToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
  }
}

/**
 * Verifica se está autenticado
 */
export function estaAutenticado() {
  const token = getToken();
  return token !== null;
}

/**
 * Redireciona para login se não estiver autenticado
 */
export function verificarAutenticacao(router) {
  if (!estaAutenticado()) {
    router.push('/login');
    return false;
  }
  return true;
}