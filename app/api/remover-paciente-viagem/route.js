// DELETE para remover paciente da viagem
import { NextResponse } from 'next/server';
import { Client } from 'pg';

async function conectarBanco() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  await client.connect();
  return client;
}

export async function DELETE(request) {
  let client;
  
  try {
    const dados = await request.json();
    
    if (!dados.viagem_id || !dados.paciente_id) {
      return NextResponse.json(
        { erro: 'viagem_id e paciente_id são obrigatórios' },
        { status: 400 }
      );
    }

    client = await conectarBanco();

    await client.query(
      'DELETE FROM viagem_pacientes WHERE viagem_id = $1 AND paciente_id = $2',
      [dados.viagem_id, dados.paciente_id]
    );

    return NextResponse.json(
      { mensagem: 'Paciente removido da viagem' },
      { status: 200 }
    );

  } catch (erro) {
    console.error('Erro ao remover paciente:', erro);
    return NextResponse.json(
      { erro: 'Erro ao remover paciente' },
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.end();
    }
  }
}