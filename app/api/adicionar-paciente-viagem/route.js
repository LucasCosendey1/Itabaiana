// app/api/adicionar-paciente-viagem/route.js
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
    
    // Validações
    if (!dados.viagem_id || !dados.paciente_id || !dados.motivo) {
      return NextResponse.json(
        { erro: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      );
    }

    client = await conectarBanco();

    // Verificar se viagem existe e tem vagas disponíveis
    const viagemResult = await client.query(
      `SELECT 
        v.id,
        v.numero_vagas,
        (SELECT COUNT(*) FROM viagem_pacientes WHERE viagem_id = v.id) as total_pacientes
      FROM viagens v
      WHERE v.id = $1`,
      [dados.viagem_id]
    );

    if (viagemResult.rows.length === 0) {
      return NextResponse.json(
        { erro: 'Viagem não encontrada' },
        { status: 404 }
      );
    }

    const viagem = viagemResult.rows[0];
    
    if (viagem.total_pacientes >= viagem.numero_vagas) {
      return NextResponse.json(
        { erro: 'Viagem está lotada' },
        { status: 400 }
      );
    }

    // Verificar se paciente já está na viagem
    const pacienteExistente = await client.query(
      `SELECT id FROM viagem_pacientes WHERE viagem_id = $1 AND paciente_id = $2`,
      [dados.viagem_id, dados.paciente_id]
    );

    if (pacienteExistente.rows.length > 0) {
      return NextResponse.json(
        { erro: 'Paciente já está cadastrado nesta viagem' },
        { status: 400 }
      );
    }

    // Inserir paciente na viagem
    const resultado = await client.query(
      `INSERT INTO viagem_pacientes 
       (viagem_id, paciente_id, medico_id, motivo, horario_consulta, observacoes) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id`,
      [
        dados.viagem_id,
        dados.paciente_id,
        dados.medico_id || null,
        dados.motivo,
        dados.horario_consulta || null,
        dados.observacoes || null
      ]
    );

    return NextResponse.json(
      {
        mensagem: 'Paciente adicionado à viagem com sucesso',
        id: resultado.rows[0].id
      },
      { status: 201 }
    );

  } catch (erro) {
    console.error('Erro ao adicionar paciente:', erro);
    
    return NextResponse.json(
      { erro: erro.message || 'Erro ao adicionar paciente à viagem' },
      { status: 500 }
    );
    
  } finally {
    if (client) {
      await client.end();
    }
  }
}