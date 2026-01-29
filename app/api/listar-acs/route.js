// app/api/listar-acs/route.js
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
        acs.id,
        u.nome_completo,
        u.telefone,
        acs.microarea,
        ubs.id as ubs_id,
        ubs.nome as ubs_nome
      FROM agentes_comunitarios acs
      INNER JOIN usuarios u ON acs.usuario_id = u.id
      LEFT JOIN ubs ON acs.ubs_id = ubs.id
      WHERE u.ativo = true AND acs.ativo = true
      ORDER BY u.nome_completo`
    );

    return NextResponse.json(
      { agentes: resultado.rows },
      { status: 200 }
    );

  } catch (erro) {
    console.error('Erro ao listar ACS:', erro);
    
    return NextResponse.json(
      { erro: 'Erro ao listar ACS' },
      { status: 500 }
    );
    
  } finally {
    if (client) {
      await client.end();
    }
  }
}