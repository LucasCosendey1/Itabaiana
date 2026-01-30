// app/api/listar-pacientes-completo/route.js
import { NextResponse } from 'next/server';
import { Client } from 'pg';

async function conectarBanco() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  await client.connect();
  return client;
}

export async function GET(request) {
  let client;
  
  try {
    client = await conectarBanco();

    const resultado = await client.query(
      `SELECT 
        p.id as paciente_id,
        u.id as usuario_id,
        u.cpf,
        u.nome_completo,
        u.email,
        u.telefone,
        u.endereco,
        u.cep,
        u.sexo,
        u.ativo,
        p.cartao_sus,
        p.nome_pai,
        p.nome_mae,
        TO_CHAR(p.data_nascimento, 'YYYY-MM-DD') as data_nascimento,
        EXTRACT(YEAR FROM AGE(p.data_nascimento)) as idade,
        p.tipo_sanguineo,
        p.microarea,
        p.responsavel_familiar,
        -- UBS de Cadastro
        ubs.id as ubs_id,
        ubs.nome as ubs_nome,
        -- Agente Comunitário
        acs.id as agente_id,
        acs_usr.nome_completo as agente_nome,
        -- Estatísticas
        (SELECT COUNT(*) FROM viagem_pacientes vp WHERE vp.paciente_id = p.id) as total_viagens,
        (SELECT COUNT(*) 
         FROM viagem_pacientes vp 
         INNER JOIN viagens v ON vp.viagem_id = v.id 
         WHERE vp.paciente_id = p.id AND v.status = 'pendente') as viagens_pendentes,
        (SELECT COUNT(*) 
         FROM viagem_pacientes vp 
         INNER JOIN viagens v ON vp.viagem_id = v.id 
         WHERE vp.paciente_id = p.id AND v.status IN ('concluido', 'realizado')) as viagens_concluidas
      FROM pacientes p
      INNER JOIN usuarios u ON p.usuario_id = u.id
      LEFT JOIN ubs ON p.ubs_cadastro_id = ubs.id
      LEFT JOIN agentes_comunitarios acs ON p.agente_id = acs.id
      LEFT JOIN usuarios acs_usr ON acs.usuario_id = acs_usr.id
      ORDER BY u.nome_completo`
    );

    return NextResponse.json(
      { 
        pacientes: resultado.rows,
        total: resultado.rows.length
      },
      { status: 200 }
    );

  } catch (erro) {
    console.error('Erro ao listar pacientes:', erro);
    
    return NextResponse.json(
      { erro: 'Erro ao listar pacientes' },
      { status: 500 }
    );
    
  } finally {
    if (client) {
      await client.end();
    }
  }
}