// app/api/listar-motoristas/route.js
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
        mot.id,
        u.nome_completo,
        mot.cnh,
        mot.veiculo_placa,
        mot.veiculo_modelo,
        mot.capacidade_passageiros,
        mot.disponivel
      FROM motoristas mot
      INNER JOIN usuarios u ON mot.usuario_id = u.id
      WHERE u.ativo = true AND mot.disponivel = true
      ORDER BY u.nome_completo`
    );

    return NextResponse.json(
      { motoristas: resultado.rows },
      { status: 200 }
    );

  } catch (erro) {
    console.error('Erro ao listar motoristas:', erro);
    
    return NextResponse.json(
      { erro: 'Erro ao listar motoristas' },
      { status: 500 }
    );
    
  } finally {
    if (client) {
      await client.end();
    }
  }
}