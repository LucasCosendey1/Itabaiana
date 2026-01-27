// app/api/cadastrar-onibus/route.js
import { NextResponse } from 'next/server';
import { Client } from 'pg';

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
    
    console.log('📦 Dados recebidos:', dados);
    
    // Validações
    if (!dados.placa || !dados.modelo || !dados.ano || !dados.capacidade_passageiros || !dados.cor) {
      return NextResponse.json(
        { erro: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      );
    }

    client = await conectarBanco();

    // Verificar se placa já existe
    const placaExistente = await client.query(
      'SELECT id FROM onibus WHERE placa = $1',
      [dados.placa]
    );

    if (placaExistente.rows.length > 0) {
      return NextResponse.json(
        { erro: 'Já existe um ônibus cadastrado com esta placa' },
        { status: 400 }
      );
    }

    // Inserir novo ônibus
    const resultado = await client.query(
      `INSERT INTO onibus 
       (placa, modelo, ano, capacidade_passageiros, cor, disponivel) 
       VALUES ($1, $2, $3, $4, $5, true) 
       RETURNING id, placa`,
      [
        dados.placa,
        dados.modelo,
        dados.ano,
        dados.capacidade_passageiros,
        dados.cor
      ]
    );

    console.log('✅ Ônibus cadastrado:', resultado.rows[0]);

    return NextResponse.json(
      {
        mensagem: 'Ônibus cadastrado com sucesso',
        onibus: {
          id: resultado.rows[0].id,
          placa: resultado.rows[0].placa
        }
      },
      { status: 201 }
    );

  } catch (erro) {
    console.error('❌ Erro ao cadastrar ônibus:', erro);
    
    // Se for erro de tabela não existe
    if (erro.message.includes('relation "onibus" does not exist')) {
      return NextResponse.json(
        { erro: 'Tabela onibus não existe. Execute o arquivo bus.sql primeiro!' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { erro: erro.message || 'Erro ao cadastrar ônibus' },
      { status: 500 }
    );
    
  } finally {
    if (client) {
      await client.end();
    }
  }
}