// app/api/criar-viagem/route.js
import { NextResponse } from 'next/server';
import { Client } from 'pg';

async function conectarBanco() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  await client.connect();
  return client;
}

function gerarCodigoViagem() {
  const timestamp = Date.now().toString().slice(-6);
  return `V${timestamp}`;
}

export async function POST(request) {
  let client;
  
  try {
    const dados = await request.json();
    
    // Validações básicas
    if (!dados.hospital_destino || !dados.data_viagem || !dados.horario_saida) {
      return NextResponse.json(
        { erro: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      );
    }

    if (!dados.numero_vagas || dados.numero_vagas < 1) {
      return NextResponse.json(
        { erro: 'Número de vagas deve ser maior que zero' },
        { status: 400 }
      );
    }

    client = await conectarBanco();

    // Gerar código único para a viagem
    const codigoViagem = gerarCodigoViagem();

    // Inserir viagem (sem paciente)
    const resultado = await client.query(
      `INSERT INTO viagens 
       (codigo_viagem, motorista_id, hospital_destino, endereco_destino, data_viagem, horario_saida, numero_vagas, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pendente') 
       RETURNING id, codigo_viagem`,
      [
        codigoViagem,
        dados.motorista_id || null,
        dados.hospital_destino,
        dados.endereco_destino || dados.hospital_destino,
        dados.data_viagem,
        dados.horario_saida,
        dados.numero_vagas
      ]
    );

    return NextResponse.json(
      {
        mensagem: 'Viagem criada com sucesso',
        viagem: {
          id: resultado.rows[0].id,
          codigo_viagem: resultado.rows[0].codigo_viagem
        }
      },
      { status: 201 }
    );

  } catch (erro) {
    console.error('Erro ao criar viagem:', erro);
    
    return NextResponse.json(
      { erro: erro.message || 'Erro ao criar viagem' },
      { status: 500 }
    );
    
  } finally {
    if (client) {
      await client.end();
    }
  }
}