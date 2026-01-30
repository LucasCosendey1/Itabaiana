// executar-alteracoes-banco.js
/**
 * SCRIPT PARA EXECUTAR ALTERAÇÕES NO BANCO DE DADOS
 * Sistema de Transporte SUS - Itabaiana/PB
 * 
 * Este script adiciona:
 * 1. Tabela viagem_paradas (paradas intermediárias das viagens)
 * 2. Novas colunas em viagem_pacientes (acompanhante, buscar em casa, etc.)
 * 3. Views auxiliares para facilitar consultas
 */

const { Client } = require('pg');
require('dotenv').config();

async function executarAlteracoes() {
  const client = new Client({
    connectionString: process.env.POSTGRES_URL
  });

  try {
    console.log('🔌 Conectando ao banco de dados...');
    await client.connect();
    console.log('✅ Conectado com sucesso!\n');

    // ============================================
    // 1. CRIAR TABELA viagem_paradas
    // ============================================
    console.log('📋 Criando tabela viagem_paradas...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS viagem_paradas (
        id SERIAL PRIMARY KEY,
        viagem_id INTEGER NOT NULL,
        ordem INTEGER NOT NULL,
        nome_parada VARCHAR(255) NOT NULL,
        endereco_parada TEXT,
        horario_parada TIME,
        observacoes TEXT,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT fk_viagem_paradas_viagem 
          FOREIGN KEY (viagem_id) 
          REFERENCES viagens(id) 
          ON DELETE CASCADE,
        
        CONSTRAINT unique_viagem_ordem 
          UNIQUE (viagem_id, ordem)
      )
    `);
    
    console.log('✅ Tabela viagem_paradas criada!\n');

    // Criar índices
    console.log('📊 Criando índices para viagem_paradas...');
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_viagem_paradas_viagem_id 
      ON viagem_paradas(viagem_id)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_viagem_paradas_ordem 
      ON viagem_paradas(viagem_id, ordem)
    `);
    
    console.log('✅ Índices criados!\n');

    // ============================================
    // 2. ADICIONAR COLUNAS EM viagem_pacientes
    // ============================================
    console.log('📋 Adicionando novas colunas em viagem_pacientes...');
    
    // vai_acompanhado
    try {
      await client.query(`
        ALTER TABLE viagem_pacientes 
        ADD COLUMN IF NOT EXISTS vai_acompanhado BOOLEAN DEFAULT false
      `);
      console.log('  ✅ Coluna vai_acompanhado adicionada');
    } catch (e) {
      console.log('  ℹ️  Coluna vai_acompanhado já existe');
    }

    // nome_acompanhante
    try {
      await client.query(`
        ALTER TABLE viagem_pacientes 
        ADD COLUMN IF NOT EXISTS nome_acompanhante VARCHAR(255)
      `);
      console.log('  ✅ Coluna nome_acompanhante adicionada');
    } catch (e) {
      console.log('  ℹ️  Coluna nome_acompanhante já existe');
    }

    // buscar_em_casa
    try {
      await client.query(`
        ALTER TABLE viagem_pacientes 
        ADD COLUMN IF NOT EXISTS buscar_em_casa BOOLEAN DEFAULT false
      `);
      console.log('  ✅ Coluna buscar_em_casa adicionada');
    } catch (e) {
      console.log('  ℹ️  Coluna buscar_em_casa já existe');
    }

    // endereco_coleta
    try {
      await client.query(`
        ALTER TABLE viagem_pacientes 
        ADD COLUMN IF NOT EXISTS endereco_coleta TEXT
      `);
      console.log('  ✅ Coluna endereco_coleta adicionada');
    } catch (e) {
      console.log('  ℹ️  Coluna endereco_coleta já existe');
    }

    // parada_coleta_id
    try {
      await client.query(`
        ALTER TABLE viagem_pacientes 
        ADD COLUMN IF NOT EXISTS parada_coleta_id INTEGER
      `);
      console.log('  ✅ Coluna parada_coleta_id adicionada');
    } catch (e) {
      console.log('  ℹ️  Coluna parada_coleta_id já existe');
    }

    // horario_coleta
    try {
      await client.query(`
        ALTER TABLE viagem_pacientes 
        ADD COLUMN IF NOT EXISTS horario_coleta TIME
      `);
      console.log('  ✅ Coluna horario_coleta adicionada');
    } catch (e) {
      console.log('  ℹ️  Coluna horario_coleta já existe');
    }

    // observacoes_coleta
    try {
      await client.query(`
        ALTER TABLE viagem_pacientes 
        ADD COLUMN IF NOT EXISTS observacoes_coleta TEXT
      `);
      console.log('  ✅ Coluna observacoes_coleta adicionada');
    } catch (e) {
      console.log('  ℹ️  Coluna observacoes_coleta já existe');
    }

    console.log('\n✅ Todas as colunas processadas!\n');

    // Adicionar Foreign Key para parada_coleta_id
    console.log('🔗 Adicionando Foreign Key para parada_coleta_id...');
    try {
      await client.query(`
        ALTER TABLE viagem_pacientes
        ADD CONSTRAINT fk_viagem_pacientes_parada_coleta
          FOREIGN KEY (parada_coleta_id)
          REFERENCES viagem_paradas(id)
          ON DELETE SET NULL
      `);
      console.log('✅ Foreign Key adicionada!\n');
    } catch (e) {
      console.log('ℹ️  Foreign Key já existe ou erro:', e.message, '\n');
    }

    // Criar índice para parada_coleta_id
    console.log('📊 Criando índice para parada_coleta_id...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_viagem_pacientes_parada_coleta 
      ON viagem_pacientes(parada_coleta_id)
    `);
    console.log('✅ Índice criado!\n');

    // ============================================
    // 3. CRIAR VIEWS AUXILIARES
    // ============================================
    console.log('👁️  Criando views auxiliares...');

    // View 1: vw_viagens_com_paradas
    await client.query(`
      CREATE OR REPLACE VIEW vw_viagens_com_paradas AS
      SELECT 
        v.id as viagem_id,
        v.codigo_viagem,
        v.data_viagem,
        v.horario_saida,
        v.hospital_destino,
        v.endereco_destino,
        v.numero_vagas,
        v.status,
        COUNT(DISTINCT vp.id) as total_paradas,
        COUNT(DISTINCT pac.id) as total_pacientes,
        json_agg(
          json_build_object(
            'ordem', vp.ordem,
            'nome', vp.nome_parada,
            'endereco', vp.endereco_parada,
            'horario', vp.horario_parada,
            'observacoes', vp.observacoes
          ) ORDER BY vp.ordem
        ) FILTER (WHERE vp.id IS NOT NULL) as paradas
      FROM viagens v
      LEFT JOIN viagem_paradas vp ON v.id = vp.viagem_id
      LEFT JOIN viagem_pacientes pac ON v.id = pac.viagem_id
      GROUP BY v.id, v.codigo_viagem, v.data_viagem, v.horario_saida, 
               v.hospital_destino, v.endereco_destino, v.numero_vagas, v.status
    `);
    console.log('  ✅ View vw_viagens_com_paradas criada');

    // View 2: vw_pacientes_viagem_completo
    await client.query(`
      CREATE OR REPLACE VIEW vw_pacientes_viagem_completo AS
      SELECT 
        vp.id as viagem_paciente_id,
        v.id as viagem_id,
        v.codigo_viagem,
        v.data_viagem,
        v.horario_saida,
        p.id as paciente_id,
        u.cpf as paciente_cpf,
        u.nome_completo as paciente_nome,
        u.telefone as paciente_telefone,
        u.endereco as paciente_endereco_cadastro,
        u.sexo as paciente_sexo,
        vp.motivo,
        vp.horario_consulta,
        vp.observacoes,
        vp.vai_acompanhado,
        vp.nome_acompanhante,
        vp.buscar_em_casa,
        vp.endereco_coleta,
        vp.parada_coleta_id,
        vp.horario_coleta,
        vp.observacoes_coleta,
        para.nome_parada as parada_nome,
        para.endereco_parada as parada_endereco,
        para.horario_parada as parada_horario,
        para.ordem as parada_ordem,
        COALESCE(
          vp.endereco_coleta, 
          para.endereco_parada, 
          u.endereco
        ) as endereco_coleta_final,
        COALESCE(
          vp.horario_coleta,
          para.horario_parada
        ) as horario_coleta_final
      FROM viagem_pacientes vp
      INNER JOIN viagens v ON vp.viagem_id = v.id
      INNER JOIN pacientes p ON vp.paciente_id = p.id
      INNER JOIN usuarios u ON p.usuario_id = u.id
      LEFT JOIN viagem_paradas para ON vp.parada_coleta_id = para.id
      ORDER BY v.data_viagem DESC, v.horario_saida, u.nome_completo
    `);
    console.log('  ✅ View vw_pacientes_viagem_completo criada\n');

    // ============================================
    // 4. VERIFICAÇÃO FINAL
    // ============================================
    console.log('🔍 Verificando estrutura final...\n');

    // Verificar viagem_paradas
    const checkParadas = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'viagem_paradas'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Tabela viagem_paradas:');
    checkParadas.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });
    console.log('');

    // Verificar viagem_pacientes
    const checkPacientes = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'viagem_pacientes'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Tabela viagem_pacientes (novas colunas):');
    const novasColunas = [
      'vai_acompanhado', 
      'nome_acompanhante', 
      'buscar_em_casa', 
      'endereco_coleta', 
      'parada_coleta_id', 
      'horario_coleta', 
      'observacoes_coleta'
    ];
    
    checkPacientes.rows
      .filter(col => novasColunas.includes(col.column_name))
      .forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type})`);
      });
    console.log('');

    // Verificar views
    const checkViews = await client.query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'vw_%'
      ORDER BY table_name
    `);
    
    console.log('👁️  Views criadas:');
    checkViews.rows.forEach(view => {
      console.log(`  - ${view.table_name}`);
    });
    console.log('');

    console.log('✅✅✅ ALTERAÇÕES CONCLUÍDAS COM SUCESSO! ✅✅✅\n');

    console.log('📝 Próximos passos:');
    console.log('  1. Atualizar a página de criação de viagens para incluir paradas');
    console.log('  2. Atualizar a página de adicionar paciente com novas opções');
    console.log('  3. Criar o relatório diário com as informações de coleta');
    console.log('  4. Atualizar os comprovantes para incluir informações de paradas\n');

  } catch (erro) {
    console.error('❌ ERRO ao executar alterações:', erro);
    console.error('Detalhes:', erro.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Conexão encerrada.');
  }
}

// Executar
executarAlteracoes();