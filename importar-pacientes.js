// ============================================
// SCRIPT DE IMPORTAÇÃO DE PACIENTES
// Sistema de Transporte SUS - Itabaiana/PB
// ============================================
// Importa 24.000 pacientes do Excel para o PostgreSQL
// ============================================

const { Client } = require('pg');
const xlsx = require('xlsx');
const bcrypt = require('bcryptjs');
const fs = require('fs');
require('dotenv').config();

// ============================================
// CONFIGURAÇÕES
// ============================================
const ARQUIVO_EXCEL = 'C:\\Users\\lukec\\OneDrive\\Área de Trabalho\\analiticoindividual01010001_28012026.xlsx';
const EMAIL_PADRAO = 'MudeseuGmail@gmail.com';
const BATCH_SIZE = 100; // Inserir 100 registros por vez
const SENHA_SALT_ROUNDS = 10;

// ============================================
// ESTATÍSTICAS
// ============================================
let stats = {
  total_linhas: 0,
  pacientes_importados: 0,
  pacientes_erro: 0,
  sem_cpf: 0,
  cpf_duplicado: 0,
  ubs_criadas: 0,
  agentes_criados: 0,
  erros: []
};

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function formatarCPF(cpf) {
  if (!cpf) return null;
  // Remove tudo que não é número
  let cpfLimpo = cpf.toString().replace(/\D/g, '');
  
  // Preenche com zeros à esquerda se necessário (CPFs podem ter menos de 11 dígitos)
  cpfLimpo = cpfLimpo.padStart(11, '0');
  
  if (cpfLimpo.length !== 11) return null;
  
  // Formata: 000.000.000-00
  return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function extrairCEP(endereco) {
  if (!endereco) return '58360-000'; // CEP padrão de Itabaiana
  
  // Procurar padrão "Cep: 58360000" ou similar
  const match = endereco.match(/Cep:\s*(\d{8})/i);
  if (match) {
    const cep = match[1];
    return `${cep.slice(0, 5)}-${cep.slice(5)}`;
  }
  
  return '58360-000';
}

function limparEndereco(endereco) {
  if (!endereco) return '';
  // Remove a parte do CEP e bairro que já está no formato, deixa só rua e número
  return endereco.split('Cep:')[0].trim();
}

function parseData(dataStr) {
  if (!dataStr) return null;
  
  try {
    // Formato esperado: "31/07/1987"
    const partes = dataStr.split('/');
    if (partes.length === 3) {
      const [dia, mes, ano] = partes;
      return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    }
  } catch (e) {
    return null;
  }
  
  return null;
}

function parseHora(horaStr) {
  if (!horaStr) return null;
  
  try {
    // Formato esperado: "09:31" ou "09:31:00"
    const partes = horaStr.split(':');
    if (partes.length >= 2) {
      return `${partes[0].padStart(2, '0')}:${partes[1].padStart(2, '0')}:00`;
    }
  } catch (e) {
    return null;
  }
  
  return null;
}

function normalizarSexo(sexo) {
  if (!sexo) return 'Ignorado';
  
  const sexoLower = sexo.toLowerCase();
  if (sexoLower.includes('fem') || sexoLower === 'f') return 'Feminino';
  if (sexoLower.includes('masc') || sexoLower === 'm') return 'Masculino';
  if (sexoLower.includes('ind')) return 'Indeterminado';
  
  return 'Ignorado';
}

function normalizarTipoSanguineo(tipo) {
  if (!tipo || tipo === 'Não sabe' || tipo === 'Nao sabe') return null;
  return tipo;
}

function normalizarBoolean(valor) {
  if (!valor) return false;
  return valor.toString().toUpperCase() === 'SIM';
}

async function gerarHashSenha(senha) {
  return await bcrypt.hash(senha, SENHA_SALT_ROUNDS);
}

// ============================================
// CONECTAR AO BANCO
// ============================================
async function conectarBanco() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  await client.connect();
  return client;
}

// ============================================
// LER ARQUIVO EXCEL
// ============================================
function lerExcel() {
  console.log('📂 Lendo arquivo Excel...');
  console.log(`   Arquivo: ${ARQUIVO_EXCEL}`);
  
  if (!fs.existsSync(ARQUIVO_EXCEL)) {
    throw new Error(`Arquivo não encontrado: ${ARQUIVO_EXCEL}`);
  }
  
  const workbook = xlsx.readFile(ARQUIVO_EXCEL);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Ler dados pulando as 4 primeiras linhas (cabeçalhos e filtros)
  const dados = xlsx.utils.sheet_to_json(worksheet, { 
    range: 3, // Pular as 4 primeiras linhas (0, 1, 2, 3)
    defval: null 
  });
  
  // Renomear primeira coluna
  dados.forEach(row => {
    if (row['Filtrado Por:\n  | Data Inicial: 01/01/0001 | Data Final: 28/01/2026 | Desfecho: Cadastro/Atualização | Mudou-se: Não | Óbito: Não']) {
      row['NOME'] = row['Filtrado Por:\n  | Data Inicial: 01/01/0001 | Data Final: 28/01/2026 | Desfecho: Cadastro/Atualização | Mudou-se: Não | Óbito: Não'];
      delete row['Filtrado Por:\n  | Data Inicial: 01/01/0001 | Data Final: 28/01/2026 | Desfecho: Cadastro/Atualização | Mudou-se: Não | Óbito: Não'];
    }
  });
  
  console.log(`✅ ${dados.length} linhas lidas do Excel`);
  stats.total_linhas = dados.length;
  
  return dados;
}

// ============================================
// CRIAR/BUSCAR UBS
// ============================================
async function obterOuCriarUBS(client, nomeUBS) {
  if (!nomeUBS || nomeUBS.trim() === '') return null;
  
  const nomeUBSLimpo = nomeUBS.trim();
  
  // Verificar se já existe
  const resultado = await client.query(
    'SELECT id FROM ubs WHERE nome = $1',
    [nomeUBSLimpo]
  );
  
  if (resultado.rows.length > 0) {
    return resultado.rows[0].id;
  }
  
  // Criar nova UBS
  const novaUBS = await client.query(
    `INSERT INTO ubs (nome, tipo, endereco, telefone, cep, ativo) 
     VALUES ($1, $2, $3, $4, $5, $6) 
     RETURNING id`,
    [nomeUBSLimpo, 'ubsf', 'Itabaiana/PB', '', '58360-000', true]
  );
  
  stats.ubs_criadas++;
  return novaUBS.rows[0].id;
}

// ============================================
// CRIAR/BUSCAR AGENTE COMUNITÁRIO
// ============================================
async function obterOuCriarAgente(client, nomeAgente, ubsId) {
  if (!nomeAgente || nomeAgente.trim() === '' || !ubsId) return null;
  
  const nomeAgenteLimpo = nomeAgente.trim();
  
  // Verificar se já existe pelo nome
  const resultado = await client.query(
    'SELECT id FROM agentes_comunitarios WHERE nome = $1',
    [nomeAgenteLimpo]
  );
  
  if (resultado.rows.length > 0) {
    return resultado.rows[0].id;
  }
  
  // Criar novo agente (SEM criar usuário, apenas o registro)
  const novoAgente = await client.query(
    `INSERT INTO agentes_comunitarios (nome, ubs_id, ativo, created_at) 
     VALUES ($1, $2, $3, CURRENT_TIMESTAMP) 
     RETURNING id`,
    [nomeAgenteLimpo, ubsId, true]
  );
  
  stats.agentes_criados++;
  return novoAgente.rows[0].id;
}

// ============================================
// IMPORTAR UM PACIENTE
// ============================================
async function importarPaciente(client, dados) {
  const cpf = formatarCPF(dados.CPF);
  
  if (!cpf) {
    stats.sem_cpf++;
    return { sucesso: false, motivo: 'sem_cpf' };
  }
  
  try {
    // 1. Verificar se CPF já existe
    const cpfExiste = await client.query(
      'SELECT id FROM usuarios WHERE cpf = $1',
      [cpf]
    );
    
    if (cpfExiste.rows.length > 0) {
      stats.cpf_duplicado++;
      return { sucesso: false, motivo: 'cpf_duplicado', cpf };
    }
    
    // 2. Obter/Criar UBS
    const ubsId = await obterOuCriarUBS(client, dados.UBS);
    
    // 3. Obter/Criar Agente Comunitário
    const agenteId = ubsId ? await obterOuCriarAgente(client, dados.AGENTE, ubsId) : null;
    
    // 4. Gerar hash da senha (CPF sem formatação)
    const cpfSemFormatacao = cpf.replace(/\D/g, '');
    const senhaHash = await gerarHashSenha(cpfSemFormatacao);
    
    // 5. Extrair dados
    const nome = dados.NOME || '';
    const endereco = limparEndereco(dados['ENDEREÇO'] || '');
    const cep = extrairCEP(dados['ENDEREÇO'] || '');
    const telefone = dados.TELEFONE || '';
    const dataNascimento = parseData(dados['DATA NASCIMENTO']);
    const sexo = normalizarSexo(dados.SEXO);
    
    // 6. Inserir USUÁRIO
    const usuarioResult = await client.query(
      `INSERT INTO usuarios 
        (cpf, nome_completo, email, telefone, senha_hash, endereco, cep, tipo_usuario, ativo, sexo, data_cadastro)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
       RETURNING id`,
      [cpf, nome, EMAIL_PADRAO, telefone, senhaHash, endereco, cep, 'paciente', true, sexo]
    );
    
    const usuarioId = usuarioResult.rows[0].id;
    
    // 7. Extrair dados do paciente
    const cartaoSUS = dados['CARTÃO SUS'] ? dados['CARTÃO SUS'].toString() : null;
    const tipoSanguineo = normalizarTipoSanguineo(dados['TIPO SANGUINEO']);
    const responsavelFamiliar = normalizarBoolean(dados['RESPONSÁVEL FAMILIAR']);
    const microarea = dados['MICROÁREA'] ? dados['MICROÁREA'].toString() : null;
    const mudouSe = dados['MUDOU-SE'] === 'SIM';
    const dataObito = dados['DATA DO ÓBITO'] ? parseData(dados['DATA DO ÓBITO']) : null;
    const horaInicio = parseHora(dados['HORA INÍCIO']);
    const horaFim = parseHora(dados['HORA FIM']);
    const podeDoarPara = dados['PODE DOAR PARA'] || null;
    const podeReceberDe = dados['PODE RECEBER DE'] || null;
    const agenteNome = dados.AGENTE || null;
    
    // 8. Inserir PACIENTE
    await client.query(
      `INSERT INTO pacientes 
        (usuario_id, cartao_sus, nome_pai, nome_mae, data_nascimento, tipo_sanguineo, 
         alergias, observacoes_medicas, ubs_cadastro_id, agente_id, microarea, 
         responsavel_familiar, agente_nome, pode_doar_para, pode_receber_de, 
         mudou_se, data_obito, hora_cadastro_inicio, hora_cadastro_fim, data_cadastro)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, CURRENT_TIMESTAMP)`,
      [
        usuarioId, cartaoSUS, null, null, dataNascimento, tipoSanguineo,
        null, null, ubsId, agenteId, microarea,
        responsavelFamiliar, agenteNome, podeDoarPara, podeReceberDe,
        mudouSe, dataObito, horaInicio, horaFim
      ]
    );
    
    stats.pacientes_importados++;
    return { sucesso: true };
    
  } catch (erro) {
    stats.pacientes_erro++;
    stats.erros.push({ cpf, nome: dados.NOME, erro: erro.message });
    return { sucesso: false, motivo: 'erro_bd', erro: erro.message };
  }
}

// ============================================
// IMPORTAR EM LOTES
// ============================================
async function importarEmLotes(client, dadosExcel) {
  console.log('\n📥 Iniciando importação em lotes...');
  console.log(`   Tamanho do lote: ${BATCH_SIZE} registros\n`);
  
  const totalLotes = Math.ceil(dadosExcel.length / BATCH_SIZE);
  
  for (let i = 0; i < dadosExcel.length; i += BATCH_SIZE) {
    const loteAtual = Math.floor(i / BATCH_SIZE) + 1;
    const lote = dadosExcel.slice(i, i + BATCH_SIZE);
    
    console.log(`📦 Lote ${loteAtual}/${totalLotes} (${i + 1} a ${Math.min(i + BATCH_SIZE, dadosExcel.length)} de ${dadosExcel.length})`);
    
    for (const linha of lote) {
      await importarPaciente(client, linha);
    }
    
    // Progresso
    const percentual = ((i + BATCH_SIZE) / dadosExcel.length * 100).toFixed(1);
    console.log(`   ✅ Progresso: ${stats.pacientes_importados} importados | ${stats.sem_cpf} sem CPF | ${stats.cpf_duplicado} duplicados | ${stats.pacientes_erro} erros (${percentual}%)\n`);
  }
}

// ============================================
// GERAR RELATÓRIO
// ============================================
function gerarRelatorio() {
  const relatorio = `
================================================================================
📊 RELATÓRIO DE IMPORTAÇÃO DE PACIENTES
================================================================================
Sistema de Transporte SUS - Itabaiana/PB
Data: ${new Date().toLocaleString('pt-BR')}

📈 ESTATÍSTICAS GERAIS:
────────────────────────────────────────────────────────────────────────────────
  Total de linhas no Excel:        ${stats.total_linhas.toLocaleString('pt-BR')}
  
  ✅ Pacientes importados:          ${stats.pacientes_importados.toLocaleString('pt-BR')}
  ❌ Pacientes com erro:            ${stats.pacientes_erro.toLocaleString('pt-BR')}
  ⚠️  Sem CPF (ignorados):           ${stats.sem_cpf.toLocaleString('pt-BR')}
  ⚠️  CPF duplicado (ignorados):     ${stats.cpf_duplicado.toLocaleString('pt-BR')}
  
  🏥 UBS criadas:                   ${stats.ubs_criadas.toLocaleString('pt-BR')}
  👥 Agentes criados:               ${stats.agentes_criados.toLocaleString('pt-BR')}

📊 TAXA DE SUCESSO:
────────────────────────────────────────────────────────────────────────────────
  ${((stats.pacientes_importados / stats.total_linhas) * 100).toFixed(2)}%

${stats.erros.length > 0 ? `
⚠️  ERROS ENCONTRADOS (Primeiros 20):
────────────────────────────────────────────────────────────────────────────────
${stats.erros.slice(0, 20).map((e, i) => 
  `  ${i + 1}. CPF: ${e.cpf} | Nome: ${e.nome}\n     Erro: ${e.erro}`
).join('\n')}
${stats.erros.length > 20 ? `\n  ... e mais ${stats.erros.length - 20} erros` : ''}
` : '✅ Nenhum erro encontrado!'}

================================================================================
`;
  
  return relatorio;
}

// ============================================
// FUNÇÃO PRINCIPAL
// ============================================
async function main() {
  console.log('================================================================================');
  console.log('🚀 IMPORTAÇÃO DE PACIENTES - Sistema de Transporte SUS');
  console.log('================================================================================\n');
  
  let client;
  
  try {
    // 1. Ler Excel
    const dadosExcel = lerExcel();
    
    // 2. Conectar ao banco
    console.log('\n🔌 Conectando ao banco de dados...');
    client = await conectarBanco();
    console.log('✅ Conectado ao PostgreSQL!\n');
    
    // 3. Iniciar transação
    console.log('🔄 Iniciando transação...\n');
    await client.query('BEGIN');
    
    // 4. Importar dados
    await importarEmLotes(client, dadosExcel);
    
    // 5. Commit
    console.log('\n💾 Salvando dados no banco (COMMIT)...');
    await client.query('COMMIT');
    console.log('✅ Dados salvos com sucesso!\n');
    
    // 6. Gerar relatório
    const relatorio = gerarRelatorio();
    console.log(relatorio);
    
    // 7. Salvar relatório em arquivo
    const nomeArquivo = `relatorio_importacao_${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
    fs.writeFileSync(nomeArquivo, relatorio);
    console.log(`📄 Relatório salvo em: ${nomeArquivo}\n`);
    
  } catch (erro) {
    console.error('\n❌ ERRO FATAL:', erro.message);
    console.error(erro.stack);
    
    if (client) {
      console.log('\n🔙 Fazendo ROLLBACK...');
      await client.query('ROLLBACK');
      console.log('✅ Rollback executado. Nenhum dado foi alterado.\n');
    }
    
    process.exit(1);
    
  } finally {
    if (client) {
      await client.end();
      console.log('🔌 Conexão com o banco encerrada.\n');
    }
  }
  
  console.log('================================================================================');
  console.log('✅ IMPORTAÇÃO CONCLUÍDA COM SUCESSO!');
  console.log('================================================================================\n');
}

// Executar
main();