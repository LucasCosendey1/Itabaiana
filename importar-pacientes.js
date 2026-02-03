// ============================================
// SCRIPT DE ATUALIZAÇÃO - ACS E MICROÁREA
// Sistema de Transporte SUS - Itabaiana/PB
// ============================================

const { Client } = require('pg');
const xlsx = require('xlsx');
const fs = require('fs');
require('dotenv').config();

// ============================================
// CONFIGURAÇÕES
// ============================================
const ARQUIVO_EXCEL = 'C:\\Users\\lukec\\OneDrive\\Área de Trabalho\\agoravai.xlsx';
const NOME_PLANILHA = 'ANALITICO';
const BATCH_SIZE = 100;

// ============================================
// ESTATÍSTICAS
// ============================================
let stats = {
  total_linhas: 0,
  atualizados: 0,
  nao_encontrados: 0,
  sem_cpf: 0,
  erros: 0
};

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function formatarCPF(cpf) {
  if (!cpf) return null;
  let cpfLimpo = cpf.toString().replace(/\D/g, '');
  cpfLimpo = cpfLimpo.padStart(11, '0');
  if (cpfLimpo.length !== 11) return null;
  return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

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
  console.log(`   Planilha: ${NOME_PLANILHA}`);
  
  if (!fs.existsSync(ARQUIVO_EXCEL)) {
    throw new Error(`Arquivo não encontrado: ${ARQUIVO_EXCEL}`);
  }
  
  const workbook = xlsx.readFile(ARQUIVO_EXCEL);
  
  if (!workbook.SheetNames.includes(NOME_PLANILHA)) {
    throw new Error(`Planilha "${NOME_PLANILHA}" não encontrada.`);
  }
  
  const worksheet = workbook.Sheets[NOME_PLANILHA];
  const dados = xlsx.utils.sheet_to_json(worksheet, { defval: null });
  
  console.log(`✅ ${dados.length} linhas lidas do Excel\n`);
  stats.total_linhas = dados.length;
  
  return dados;
}

// ============================================
// ATUALIZAR PACIENTE
// ============================================
async function atualizarPaciente(client, dados) {
  const cpf = formatarCPF(dados.CPF);
  
  if (!cpf) {
    stats.sem_cpf++;
    return { sucesso: false, motivo: 'sem_cpf' };
  }
  
  try {
    // 1. Buscar paciente pelo CPF
    const resultado = await client.query(
      `SELECT p.id, p.microarea, p.agente_nome
       FROM pacientes p
       INNER JOIN usuarios u ON p.usuario_id = u.id
       WHERE u.cpf = $1`,
      [cpf]
    );
    
    if (resultado.rows.length === 0) {
      stats.nao_encontrados++;
      return { sucesso: false, motivo: 'nao_encontrado', cpf };
    }
    
    const paciente = resultado.rows[0];
    
    // 2. Extrair dados da planilha
    const microarea = dados['MICROÁREA'] || dados['MICRO ÁREA'] || null;
    const agenteNome = dados.ACS || dados['AGENTE'] || dados['AGENTE UBS'] || null;
    
    // 3. Verificar se precisa atualizar
    const microareaStr = microarea ? microarea.toString().trim() : null;
    const agenteStr = agenteNome ? agenteNome.toString().trim() : null;
    
    const precisaAtualizar = 
      (microareaStr && microareaStr !== paciente.microarea) ||
      (agenteStr && agenteStr !== paciente.agente_nome);
    
    if (!precisaAtualizar) {
      return { sucesso: true, motivo: 'ja_atualizado' };
    }
    
    // 4. Atualizar paciente
    await client.query(
      `UPDATE pacientes 
       SET microarea = $1, agente_nome = $2
       WHERE id = $3`,
      [microareaStr, agenteStr, paciente.id]
    );
    
    stats.atualizados++;
    return { sucesso: true };
    
  } catch (erro) {
    stats.erros++;
    console.error(`   ❌ ERRO ao atualizar CPF ${cpf}:`, erro.message);
    return { sucesso: false, motivo: 'erro_bd', erro: erro.message };
  }
}

// ============================================
// ATUALIZAR EM LOTES
// ============================================
async function atualizarEmLotes(client, dadosExcel) {
  console.log('\n📥 Iniciando atualização em lotes...');
  console.log(`   Tamanho do lote: ${BATCH_SIZE} registros\n`);
  
  const totalLotes = Math.ceil(dadosExcel.length / BATCH_SIZE);
  
  for (let i = 0; i < dadosExcel.length; i += BATCH_SIZE) {
    const loteAtual = Math.floor(i / BATCH_SIZE) + 1;
    const lote = dadosExcel.slice(i, i + BATCH_SIZE);
    
    console.log(`📦 Lote ${loteAtual}/${totalLotes} (${i + 1} a ${Math.min(i + BATCH_SIZE, dadosExcel.length)} de ${dadosExcel.length})`);
    
    // Testar conexão e reconectar se necessário
    try {
      await client.query('SELECT 1');
    } catch (erro) {
      console.log('   ⚠️  Conexão perdida! Reconectando...');
      try {
        await client.end();
      } catch (e) {}
      
      client = await conectarBanco();
      console.log('   ✅ Reconectado!\n');
    }
    
    for (const linha of lote) {
      await atualizarPaciente(client, linha);
    }
    
    const percentual = ((i + BATCH_SIZE) / dadosExcel.length * 100).toFixed(1);
    console.log(`   ✅ Progresso: ${stats.atualizados} atualizados | ${stats.nao_encontrados} não encontrados | ${stats.sem_cpf} sem CPF | ${stats.erros} erros (${percentual}%)\n`);
  }
  
  return client;
}

// ============================================
// GERAR RELATÓRIO
// ============================================
function gerarRelatorio() {
  const relatorio = `
================================================================================
📊 RELATÓRIO DE ATUALIZAÇÃO - ACS E MICROÁREA
================================================================================
Sistema de Transporte SUS - Itabaiana/PB
Data: ${new Date().toLocaleString('pt-BR')}

📈 ESTATÍSTICAS:
────────────────────────────────────────────────────────────────────────────────
  Total de linhas no Excel:        ${stats.total_linhas.toLocaleString('pt-BR')}
  
  ✅ Pacientes atualizados:         ${stats.atualizados.toLocaleString('pt-BR')}
  ⚠️  Pacientes não encontrados:    ${stats.nao_encontrados.toLocaleString('pt-BR')}
  ⚠️  Sem CPF (ignorados):           ${stats.sem_cpf.toLocaleString('pt-BR')}
  ❌ Erros:                         ${stats.erros.toLocaleString('pt-BR')}

📊 TAXA DE SUCESSO:
────────────────────────────────────────────────────────────────────────────────
  ${((stats.atualizados / stats.total_linhas) * 100).toFixed(2)}%

================================================================================
`;
  
  return relatorio;
}

// ============================================
// FUNÇÃO PRINCIPAL
// ============================================
async function main() {
  console.log('================================================================================');
  console.log('🔄 ATUALIZAÇÃO - ACS E MICROÁREA');
  console.log('================================================================================\n');
  
  let client;
  
  try {
    const dadosExcel = lerExcel();
    
    console.log('🔌 Conectando ao banco de dados...');
    client = await conectarBanco();
    console.log('✅ Conectado ao PostgreSQL!\n');
    
    client = await atualizarEmLotes(client, dadosExcel);
    
    const relatorio = gerarRelatorio();
    console.log(relatorio);
    
    const nomeArquivo = `relatorio_atualizacao_${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
    fs.writeFileSync(nomeArquivo, relatorio);
    console.log(`📄 Relatório salvo em: ${nomeArquivo}\n`);
    
  } catch (erro) {
    console.error('\n❌ ERRO FATAL:', erro.message);
    console.error(erro.stack);
    process.exit(1);
    
  } finally {
    if (client) {
      await client.end();
      console.log('🔌 Conexão com o banco encerrada.\n');
    }
  }
  
  console.log('================================================================================');
  console.log('✅ ATUALIZAÇÃO CONCLUÍDA COM SUCESSO!');
  console.log('================================================================================\n');
}

main();