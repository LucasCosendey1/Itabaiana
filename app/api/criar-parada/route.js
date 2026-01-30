// app/api/criar-parada/route.js
import { NextResponse } from 'next/server';
import { Client } from 'pg';

/**
 * API PARA CRIAR PARADA DE VIAGEM
 */

async function conectarBanco() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  await client.connect();
  return client;
}

export async function POST(request) {
  let client;
  
  try {
    const dados = await request.json();
    
    // Validações
    if (!dados.viagem_id || !dados.ordem || !dados.nome_parada || !dados.horario_parada) {
      return NextResponse.json(
        { erro: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      );
    }

    client = await conectarBanco();

    // Verificar se a viagem existe
    const viagemExiste = await client.query(
      'SELECT id FROM viagens WHERE id = $1',
      [dados.viagem_id]
    );

    if (viagemExiste.rows.length === 0) {
      return NextResponse.json(
        { erro: 'Viagem não encontrada' },
        { status: 404 }
      );
    }

    // Inserir parada
    const resultado = await client.query(
      `INSERT INTO viagem_paradas 
       (viagem_id, ordem, nome_parada, endereco_parada, horario_parada, observacoes) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, ordem, nome_parada`,
      [
        dados.viagem_id,
        dados.ordem,
        dados.nome_parada,
        dados.endereco_parada || null,
        dados.horario_parada,
        dados.observacoes || null
      ]
    );

    return NextResponse.json(
      {
        mensagem: 'Parada criada com sucesso',
        parada: resultado.rows[0]
      },
      { status: 201 }
    );

  } catch (erro) {
    console.error('Erro ao criar parada:', erro);
    
    // Erro de violação de unique constraint
    if (erro.code === '23505') {
      return NextResponse.json(
        { erro: 'Já existe uma parada com esta ordem nesta viagem' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { erro: erro.message || 'Erro ao criar parada' },
      { status: 500 }
    );
    
  } finally {
    if (client) {
      await client.end();
    }
  }
}