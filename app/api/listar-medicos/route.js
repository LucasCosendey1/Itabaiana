// app/api/listar-medicos/route.js
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
        m.id,
        u.nome_completo,
        m.crm,
        m.especializacao,
        m.hospital_vinculado
      FROM medicos m
      INNER JOIN usuarios u ON m.usuario_id = u.id
      WHERE u.ativo = true
      ORDER BY u.nome_completo`
    );

    return NextResponse.json(
      { medicos: resultado.rows },
      { status: 200 }
    );

  } catch (erro) {
    console.error('Erro ao listar médicos:', erro);
    
    return NextResponse.json(
      { erro: 'Erro ao listar médicos' },
      { status: 500 }
    );
    
  } finally {
    if (client) {
      await client.end();
    }
  }
}