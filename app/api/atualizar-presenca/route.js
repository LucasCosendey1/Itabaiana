// app/api/atualizar-presenca/route.js
import { NextResponse } from 'next/server';
import { Client } from 'pg';

/**
 * API PARA ATUALIZAR A PRESENÇA DO PACIENTE NA VIAGEM
 * Atualiza o campo 'compareceu' na tabela viagem_pacientes
 */

async function conectarBanco() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  await client.connect();
  return client;
}

export async function PATCH(request) {
  let client;
  
  try {
    const dados = await request.json();
    
    // Validação
    if (!dados.id || dados.compareceu === undefined) {
      return NextResponse.json(
        { erro: 'ID do vínculo e status de comparecimento são obrigatórios' },
        { status: 400 }
      );
    }

    client = await conectarBanco();

    // Atualizar o campo compareceu
    const resultado = await client.query(
      `UPDATE viagem_pacientes 
       SET compareceu = $1 
       WHERE id = $2 
       RETURNING id, compareceu`,
      [dados.compareceu, dados.id]
    );

    if (resultado.rows.length === 0) {
      return NextResponse.json(
        { erro: 'Vínculo paciente-viagem não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        mensagem: dados.compareceu ? 'Presença confirmada com sucesso!' : 'Presença cancelada',
        compareceu: resultado.rows[0].compareceu
      },
      { status: 200 }
    );

  } catch (erro) {
    console.error('Erro ao atualizar presença:', erro);
    return NextResponse.json(
      { erro: 'Erro ao atualizar presença do paciente' },
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.end();
    }
  }
}