// app/api/listar-medicos-completo/route.js
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
    const result = await client.query(
      `SELECT m.id, m.crm, m.especializacao, u.nome_completo 
       FROM medicos m
       INNER JOIN usuarios u ON m.usuario_id = u.id
       ORDER BY u.nome_completo ASC`
    );
    return NextResponse.json({ medicos: result.rows }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ erro: 'Erro ao listar' }, { status: 500 });
  } finally {
    if (client) await client.end();
  }
}