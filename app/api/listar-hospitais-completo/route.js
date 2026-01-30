// app/api/listar-hospitais-completo/route.js
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
    
    // Lista unidades e conta médicos vinculados
    const query = `
      SELECT 
        u.*,
        (SELECT COUNT(*) FROM medico_vinculos mv WHERE mv.ubs_id = u.id) as total_medicos
      FROM ubs u
      ORDER BY u.tipo DESC, u.nome ASC
    `;

    const result = await client.query(query);
    return NextResponse.json({ unidades: result.rows }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ erro: 'Erro ao listar' }, { status: 500 });
  } finally {
    if (client) await client.end();
  }
}