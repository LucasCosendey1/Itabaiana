// app/api/hospital/[id]/route.js
import { NextResponse } from 'next/server';
import { Client } from 'pg';

async function conectarBanco() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  return client;
}

export async function GET(request, { params }) {
  let client;
  const { id } = params;

  try {
    client = await conectarBanco();

    // 1. Dados da Unidade
    const resUnidade = await client.query(`SELECT * FROM ubs WHERE id = $1`, [id]);
    
    if (resUnidade.rows.length === 0) {
      return NextResponse.json({ erro: 'Unidade não encontrada' }, { status: 404 });
    }

    // 2. Médicos Vinculados
    const resMedicos = await client.query(
      `SELECT 
        mv.id, mv.atuacao, mv.dias_atendimento, mv.horario_atendimento,
        m.id as medico_id, u.nome_completo
       FROM medico_vinculos mv
       INNER JOIN medicos m ON mv.medico_id = m.id
       INNER JOIN usuarios u ON m.usuario_id = u.id
       WHERE mv.ubs_id = $1`,
      [id]
    );

    // 3. Pacientes (apenas contagem ou lista simples se for UBS)
    // Se for hospital, geralmente não tem pacientes "cadastrados", eles são encaminhados
    let pacientes = [];
    if (resUnidade.rows[0].tipo === 'ubs') {
        const resPacientes = await client.query(
            `SELECT id FROM pacientes WHERE ubs_cadastro_id = $1`,
            [id]
        );
        pacientes = resPacientes.rows;
    }

    return NextResponse.json({
      unidade: resUnidade.rows[0],
      medicos: resMedicos.rows,
      pacientes: pacientes
    }, { status: 200 });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 });
  } finally {
    if (client) await client.end();
  }
}