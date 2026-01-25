// app/data/mockData.js

/**
 * DADOS MOCKADOS DO SISTEMA
 * Este arquivo contém todos os dados de teste para o MVP
 */

// ============================================
// USUÁRIOS PARA LOGIN
// ============================================
export const usuarios = [
  {
    cpf: '123.456.789-00',
    senha: 'admin123',
    role: 'admin',
    nome: 'João Silva'
  },
  {
    cpf: '987.654.321-00',
    senha: 'operador123',
    role: 'operador',
    nome: 'Maria Santos'
  }
];

// ============================================
// PACIENTES
// ============================================
// ============================================
// PACIENTES
// ============================================
export const pacientes = [
  {
    cpf: '111.222.333-44',
    nomeCompleto: 'Ana Maria da Silva',
    dataNascimento: '15/03/1965',
    cartaoSus: '123 4567 8901 2345',
    telefone: '(83) 99999-1111',
    email: 'ana.maria@email.com',
    nomePai: 'José da Silva',
    nomeMae: 'Maria da Silva',
    endereco: 'Rua das Flores, 123, Centro, Itabaiana-PB',
    cep: '58360-000'
  },
  {
    cpf: '222.333.444-55',
    nomeCompleto: 'Carlos Eduardo Santos',
    dataNascimento: '22/07/1978',
    cartaoSus: '234 5678 9012 3456',
    telefone: '(83) 98888-2222',
    email: 'carlos.eduardo@email.com',
    nomePai: 'Eduardo Santos',
    nomeMae: 'Rita Santos',
    endereco: 'Avenida Principal, 456, Bairro Novo, Itabaiana-PB',
    cep: '58360-000'
  },
  {
    cpf: '333.444.555-66',
    nomeCompleto: 'Francisca de Souza Oliveira',
    dataNascimento: '10/11/1952',
    cartaoSus: '345 6789 0123 4567',
    telefone: '(83) 97777-3333',
    email: 'francisca.souza@email.com',
    nomePai: 'Manuel de Souza',
    nomeMae: 'Antônia Oliveira',
    endereco: 'Rua do Comércio, 789, Centro, Itabaiana-PB',
    cep: '58360-000'
  },
  {
    cpf: '444.555.666-77',
    nomeCompleto: 'Pedro Henrique Almeida',
    dataNascimento: '05/09/1990',
    cartaoSus: '456 7890 1234 5678',
    telefone: '(83) 96666-4444',
    email: 'pedro.almeida@email.com',
    nomePai: 'Henrique Almeida',
    nomeMae: 'Joana Almeida',
    endereco: 'Rua São José, 321, Vila Nova, Itabaiana-PB',
    cep: '58360-000'
  }
];

// ============================================
// VIAGENS
// ============================================
export let viagens = [
  // Viagens PENDENTES (futuras)
  {
    id: 'V001',
    cpfPaciente: '111.222.333-44',
    motivo: 'Cirurgia de catarata',
    medico: 'Dr. Roberto Fernandes',
    horarioViagem: '06:00',
    horarioConsulta: '09:30',
    hospital: 'Hospital Regional de Campina Grande',
    dataViagem: '2026-02-05',
    status: 'pendente'
  },
  {
    id: 'V002',
    cpfPaciente: '222.333.444-55',
    motivo: 'Cirurgia ortopédica - joelho',
    medico: 'Dr. Antônio Carlos',
    horarioViagem: '05:30',
    horarioConsulta: '08:00',
    hospital: 'Hospital de Trauma de Campina Grande',
    dataViagem: '2026-02-10',
    status: 'pendente'
  },
  {
    id: 'V003',
    cpfPaciente: '111.222.333-44',
    motivo: 'Consulta pré-operatória',
    medico: 'Dr. Roberto Fernandes',
    horarioViagem: '07:00',
    horarioConsulta: '10:00',
    hospital: 'Hospital Regional de Campina Grande',
    dataViagem: '2026-01-30',
    status: 'confirmado'
  },
  {
    id: 'V006',
    cpfPaciente: '333.444.555-66',
    motivo: 'Cirurgia de vesícula',
    medico: 'Dra. Juliana Lima',
    horarioViagem: '04:30',
    horarioConsulta: '07:00',
    hospital: 'Hospital Universitário - João Pessoa',
    dataViagem: '2026-02-15',
    status: 'pendente'
  },
  {
    id: 'V007',
    cpfPaciente: '444.555.666-77',
    motivo: 'Cirurgia cardíaca',
    medico: 'Dr. Fernando Souza',
    horarioViagem: '03:00',
    horarioConsulta: '06:00',
    hospital: 'Hospital de Emergência e Trauma - João Pessoa',
    dataViagem: '2026-02-20',
    status: 'pendente'
  },

  // Viagens JÁ REALIZADAS (passadas)
  {
    id: 'V004',
    cpfPaciente: '222.333.444-55',
    motivo: 'Exames pré-operatórios',
    medico: 'Dr. Antônio Carlos',
    horarioViagem: '06:30',
    horarioConsulta: '09:00',
    hospital: 'Hospital de Trauma de Campina Grande',
    dataViagem: '2026-01-15',
    status: 'realizado'
  },
  {
    id: 'V005',
    cpfPaciente: '333.444.555-66',
    motivo: 'Consulta gastroenterologista',
    medico: 'Dra. Juliana Lima',
    horarioViagem: '05:00',
    horarioConsulta: '08:30',
    hospital: 'Hospital Universitário - João Pessoa',
    dataViagem: '2026-01-10',
    status: 'realizado'
  },
  {
    id: 'V008',
    cpfPaciente: '111.222.333-44',
    motivo: 'Exame de vista',
    medico: 'Dr. Roberto Fernandes',
    horarioViagem: '07:30',
    horarioConsulta: '10:30',
    hospital: 'Hospital Regional de Campina Grande',
    dataViagem: '2025-12-20',
    status: 'realizado'
  }
];

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

/**
 * Busca paciente por CPF
 */
export function buscarPacientePorCpf(cpf) {
  return pacientes.find(p => p.cpf === cpf);
}

/**
 * Busca pacientes por nome (parcial)
 */
export function buscarPacientesPorNome(nome) {
  const nomeLower = nome.toLowerCase();
  return pacientes.filter(p => 
    p.nomeCompleto.toLowerCase().includes(nomeLower)
  );
}

/**
 * Busca viagens de um paciente (ordenadas: futuras primeiro, depois passadas)
 */
export function buscarViagensPorCpf(cpf) {
  const viagensDoPaciente = viagens.filter(v => v.cpfPaciente === cpf);
  
  // Separa viagens futuras e passadas
  const futuras = viagensDoPaciente.filter(v => 
    v.status === 'pendente' || v.status === 'confirmado'
  );
  const passadas = viagensDoPaciente.filter(v => 
    v.status === 'realizado'
  );
  
  // Ordena futuras por data (mais próxima primeiro)
  futuras.sort((a, b) => new Date(a.dataViagem) - new Date(b.dataViagem));
  
  // Ordena passadas por data (mais recente primeiro)
  passadas.sort((a, b) => new Date(b.dataViagem) - new Date(a.dataViagem));
  
  // Retorna futuras + passadas
  return [...futuras, ...passadas];
}

/**
 * Busca viagem por ID
 */
export function buscarViagemPorId(id) {
  return viagens.find(v => v.id === id);
}

/**
 * Confirma presença em uma viagem
 */
export function confirmarPresenca(idViagem) {
  const viagem = viagens.find(v => v.id === idViagem);
  if (viagem) {
    viagem.status = 'confirmado';
    return true;
  }
  return false;
}

/**
 * Valida login
 */
export function validarLogin(cpf, senha) {
  return usuarios.find(u => u.cpf === cpf && u.senha === senha);
}