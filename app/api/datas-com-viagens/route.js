// app/api/datas-com-viagens/route.js
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
    const { searchParams } = new URL(request.url);
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');

    if (!dataInicio || !dataFim) {
      return NextResponse.json(
        { erro: 'Datas de início e fim são obrigatórias' },
        { status: 400 }
      );
    }

    client = await conectarBanco();

    // ✅ QUERY CORRIGIDA - Agrupa corretamente e conta pacientes
    const query = `
      SELECT 
        TO_CHAR(v.data_viagem, 'YYYY-MM-DD') as data,
        COUNT(DISTINCT v.id) as total_viagens,
        COUNT(vp.id) as total_pacientes
      FROM viagens v
      LEFT JOIN viagem_pacientes vp ON v.id = vp.viagem_id
      WHERE v.data_viagem BETWEEN $1 AND $2
      GROUP BY TO_CHAR(v.data_viagem, 'YYYY-MM-DD'), v.data_viagem
      ORDER BY v.data_viagem ASC
    `;

    const resultado = await client.query(query, [dataInicio, dataFim]);

    // ✅ Log para debug (você verá isso no terminal do servidor)
    console.log('📅 Datas com viagens encontradas:', resultado.rows);

    return NextResponse.json(
      { 
        datas: resultado.rows
      },
      { status: 200 }
    );

  } catch (erro) {
    console.error('❌ Erro ao buscar datas com viagens:', erro);
    
    return NextResponse.json(
      { erro: 'Erro ao buscar datas', detalhes: erro.message },
      { status: 500 }
    );
    
  } finally {
    if (client) {
      await client.end();
    }
  }
}