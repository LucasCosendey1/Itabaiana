// app/api/listar-ubs/route.js
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
        id,
        nome,
        endereco,
        telefone,
        responsavel,
        ativo
      FROM ubs
      WHERE ativo = true
      ORDER BY nome`
    );

    return NextResponse.json(
      { ubs: resultado.rows },
      { status: 200 }
    );

  } catch (erro) {
    console.error('Erro ao listar UBS:', erro);
    
    return NextResponse.json(
      { erro: 'Erro ao listar UBS' },
      { status: 500 }
    );
    
  } finally {
    if (client) {
      await client.end();
    }
  }
}