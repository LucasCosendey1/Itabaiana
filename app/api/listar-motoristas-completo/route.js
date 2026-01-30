import { NextResponse } from 'next/server';
import { Client } from 'pg';

async function conectarBanco() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  return client;
}

export async function GET() {
  let client;
  try {
    client = await conectarBanco();
    
    // ✅ ADICIONADO: validade_cnh
    const query = `
      SELECT 
        m.id as motorista_id, 
        m.cnh, 
        m.categoria_cnh, 
        m.validade_cnh, 
        m.disponivel,
        u.nome_completo,
        u.cpf, 
        u.ativo
      FROM motoristas m
      INNER JOIN usuarios u ON m.usuario_id = u.id
      ORDER BY u.nome_completo ASC
    `;

    const result = await client.query(query);

    return NextResponse.json({ motoristas: result.rows }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ erro: 'Erro ao listar' }, { status: 500 });
  } finally {
    if (client) await client.end();
  }
}