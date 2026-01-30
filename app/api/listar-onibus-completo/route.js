// app/api/listar-onibus-completo/route.js
import { NextResponse } from 'next/server';
import { Client } from 'pg';

async function conectarBanco() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  await client.connect();
  return client;
}

export async function GET() {
  let client;
  
  try {
    client = await conectarBanco();

    // Query para buscar todos os ônibus
    // Ordenado por disponibilidade (ativos primeiro) e depois por modelo
    const query = `
      SELECT 
        id,
        placa,
        modelo,
        ano,
        capacidade_passageiros,
        cor,
        disponivel
      FROM onibus
      ORDER BY disponivel DESC, modelo ASC
    `;

    const resultado = await client.query(query);

    return NextResponse.json(
      { 
        onibus: resultado.rows,
        total: resultado.rows.length
      },
      { status: 200 }
    );

  } catch (erro) {
    console.error('Erro ao listar ônibus:', erro);
    
    // Tratamento para tabela inexistente (comum no inicio)
    if (erro.message.includes('relation "onibus" does not exist')) {
       return NextResponse.json(
        { onibus: [], total: 0, erro: 'Tabela ainda não criada' },
        { status: 200 } // Retorna 200 vazio para não quebrar o front
      );
    }

    return NextResponse.json(
      { erro: 'Erro ao buscar lista de ônibus' },
      { status: 500 }
    );
    
  } finally {
    if (client) {
      await client.end();
    }
  }
}