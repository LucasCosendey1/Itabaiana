// app/api/medico/[id]/route.js
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

    // 1. Dados do Médico
    const resMedico = await client.query(
      `SELECT 
        m.id, m.crm, m.especializacao,
        u.nome_completo, u.cpf, u.email, u.telefone
       FROM medicos m
       INNER JOIN usuarios u ON m.usuario_id = u.id
       WHERE m.id = $1`,
      [id]
    );

    if (resMedico.rows.length === 0) {
      return NextResponse.json({ erro: 'Médico não encontrado' }, { status: 404 });
    }

    // 2. Vínculos Hospitalares
    const resVinculos = await client.query(
      `SELECT 
        mv.*, 
        ubs.nome as ubs_nome 
       FROM medico_vinculos mv
       LEFT JOIN ubs ON mv.ubs_id = ubs.id
       WHERE mv.medico_id = $1`,
      [id]
    );

    // 3. Histórico de Viagens (Onde ele foi o médico responsável pelo paciente)
    const resViagens = await client.query(
      `SELECT 
        vp.id, vp.motivo,
        p.nome_completo as paciente_nome,
        v.id as viagem_id,
        TO_CHAR(v.data_viagem, 'YYYY-MM-DD') as data_viagem
       FROM viagem_pacientes vp
       INNER JOIN viagens v ON vp.viagem_id = v.id
       INNER JOIN pacientes pac ON vp.paciente_id = pac.id
       INNER JOIN usuarios p ON pac.usuario_id = p.id
       WHERE vp.medico_id = $1
       ORDER BY v.data_viagem DESC
       LIMIT 50`,
      [id]
    );

    return NextResponse.json({
      medico: resMedico.rows[0],
      vinculos: resVinculos.rows,
      viagens: resViagens.rows
    }, { status: 200 });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 });
  } finally {
    if (client) await client.end();
  }
}