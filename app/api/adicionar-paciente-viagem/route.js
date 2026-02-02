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
    
    // Validações básicas
    if (!dados.viagem_id || !dados.paciente_id || !dados.motivo) {
      return NextResponse.json(
        { erro: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      );
    }

    client = await conectarBanco();

    // Verificar se viagem existe
    const viagemResult = await client.query(
      `SELECT id FROM viagens WHERE id = $1`,
      [dados.viagem_id]
    );

    if (viagemResult.rows.length === 0) {
      return NextResponse.json(
        { erro: 'Viagem não encontrada' },
        { status: 404 }
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

    // Verificar vagas disponíveis (ÚNICA VERIFICAÇÃO CORRETA)
    const resultadoVagas = await client.query(
      `SELECT 
        v.numero_vagas,
        COALESCE(COUNT(vp.id), 0) as total_pacientes
       FROM viagens v
       LEFT JOIN viagem_pacientes vp ON v.id = vp.viagem_id
       WHERE v.id = $1
       GROUP BY v.numero_vagas`,
      [dados.viagem_id]
    );

    if (resultadoVagas.rows.length > 0) {
      const { numero_vagas, total_pacientes } = resultadoVagas.rows[0];
      const vagasNecessarias = dados.vai_acompanhado ? 2 : 1;
      const vagasDisponiveis = numero_vagas - parseInt(total_pacientes);
      
      if (vagasDisponiveis < vagasNecessarias) {
        return NextResponse.json(
          { erro: `Viagem não possui vagas suficientes. Necessário: ${vagasNecessarias}, Disponível: ${vagasDisponiveis}` },
          { status: 400 }
        );
      }
    }

    // Inserir paciente na viagem
    const resultado = await client.query(
      `INSERT INTO viagem_pacientes 
       (
         viagem_id, 
         paciente_id, 
         medico_id, 
         motivo, 
         horario_consulta, 
         observacoes,
         vai_acompanhado,
         nome_acompanhante,
         buscar_em_casa,
         endereco_coleta,
         parada_coleta_id,
         horario_coleta,
         observacoes_coleta
       ) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
       RETURNING id`,
      [
        dados.viagem_id,
        dados.paciente_id,
        dados.medico_id || null,
        dados.motivo,
        dados.horario_consulta || null,
        dados.observacoes || null,
        dados.vai_acompanhado || false,
        dados.nome_acompanhante || null,
        dados.buscar_em_casa || false,
        dados.endereco_coleta || null,
        dados.parada_coleta_id || null,
        dados.horario_coleta || null,
        dados.observacoes_coleta || null
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