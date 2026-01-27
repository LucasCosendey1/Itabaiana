// app/api/listar-onibus/route.js
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
        placa,
        modelo,
        ano,
        capacidade_passageiros,
        cor,
        disponivel
      FROM onibus
      WHERE disponivel = true
      ORDER BY placa`
    );

    return NextResponse.json(
      { onibus: resultado.rows },
      { status: 200 }
    );

  } catch (erro) {
    console.error('Erro ao listar ônibus:', erro);
    
    return NextResponse.json(
      { erro: 'Erro ao listar ônibus' },
      { status: 500 }
    );
    
  } finally {
    if (client) {
      await client.end();
    }
  }
}