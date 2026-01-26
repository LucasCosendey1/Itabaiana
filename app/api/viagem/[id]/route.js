// app/api/viagem/[id]/route.js
import { NextResponse } from 'next/server';
import { Client } from 'pg';

/**
 * API ROUTE PARA BUSCAR DETALHES DE UMA VIAGEM
 */

async function conectarBanco() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  await client.connect();
  return client;
}

export async function GET(request, { params }) {
  let client;
  
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { erro: 'ID da viagem é obrigatório' },
        { status: 400 }
      );
    }

    client = await conectarBanco();

    // Buscar viagem com todas as informações
    const resultado = await client.query(
      `SELECT 
        v.id as viagem_id,
        v.codigo_viagem,
        v.data_viagem,
        v.horario_saida,
        v.horario_consulta,
        v.horario_retorno_previsto,
        v.status,
        v.motivo,
        v.hospital_destino,
        v.endereco_destino,
        v.confirmado_em,
        v.observacoes,
        -- Paciente
        p_usr.id as paciente_usuario_id,
        p_usr.cpf as paciente_cpf,
        p_usr.nome_completo as paciente_nome,
        p_usr.email as paciente_email,
        p_usr.telefone as paciente_telefone,
        p_usr.endereco as paciente_endereco,
        p_usr.cep as paciente_cep,
        pac.cartao_sus,
        pac.nome_pai,
        pac.nome_mae,
        pac.data_nascimento,
        pac.tipo_sanguineo,
        pac.alergias,
        -- Médico
        m_usr.nome_completo as medico_nome,
        m_usr.telefone as medico_telefone,
        med.crm as medico_crm,
        med.especializacao as medico_especializacao,
        med.hospital_vinculado as medico_hospital,
        -- Motorista
        mot_usr.nome_completo as motorista_nome,
        mot_usr.telefone as motorista_telefone,
        mot.cnh as motorista_cnh,
        mot.categoria_cnh as motorista_categoria,
        mot.veiculo_placa,
        mot.veiculo_modelo,
        mot.capacidade_passageiros
      FROM viagens v
      INNER JOIN pacientes pac ON v.paciente_id = pac.id
      INNER JOIN usuarios p_usr ON pac.usuario_id = p_usr.id
      LEFT JOIN medicos med ON v.medico_id = med.id
      LEFT JOIN usuarios m_usr ON med.usuario_id = m_usr.id
      LEFT JOIN motoristas mot ON v.motorista_id = mot.id
      LEFT JOIN usuarios mot_usr ON mot.usuario_id = mot_usr.id
      WHERE v.codigo_viagem = $1`,
      [id]
    );

    if (resultado.rows.length === 0) {
      return NextResponse.json(
        { erro: 'Viagem não encontrada' },
        { status: 404 }
      );
    }

    const viagem = resultado.rows[0];

    // Buscar histórico de mudanças de status
    const historico = await client.query(
      `SELECT 
        h.status_anterior,
        h.status_novo,
        h.observacao,
        h.data_alteracao,
        u.nome_completo as alterado_por
      FROM historico_viagens h
      LEFT JOIN usuarios u ON h.alterado_por = u.id
      WHERE h.viagem_id = $1
      ORDER BY h.data_alteracao DESC`,
      [viagem.viagem_id]
    );

    return NextResponse.json(
      { 
        viagem: viagem,
        historico: historico.rows
      },
      { status: 200 }
    );

  } catch (erro) {
    console.error('Erro ao buscar viagem:', erro);
    
    return NextResponse.json(
      { erro: 'Erro ao buscar viagem' },
      { status: 500 }
    );
    
  } finally {
    if (client) {
      await client.end();
    }
  }
}

// PUT - Confirmar presença
export async function PUT(request, { params }) {
  let client;
  
  try {
    const { id } = params;
    const body = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { erro: 'ID da viagem é obrigatório' },
        { status: 400 }
      );
    }

    client = await conectarBanco();

    // Buscar viagem
    const viagemExiste = await client.query(
      'SELECT id, status FROM viagens WHERE codigo_viagem = $1',
      [id]
    );

    if (viagemExiste.rows.length === 0) {
      return NextResponse.json(
        { erro: 'Viagem não encontrada' },
        { status: 404 }
      );
    }

    const viagem = viagemExiste.rows[0];

    if (viagem.status !== 'pendente') {
      return NextResponse.json(
        { erro: 'Viagem já foi confirmada ou não está mais pendente' },
        { status: 400 }
      );
    }

    // Confirmar presença
    await client.query(
      `UPDATE viagens 
       SET status = 'confirmado', confirmado_em = CURRENT_TIMESTAMP
       WHERE codigo_viagem = $1`,
      [id]
    );

    return NextResponse.json(
      { mensagem: 'Presença confirmada com sucesso' },
      { status: 200 }
    );

  } catch (erro) {
    console.error('Erro ao confirmar presença:', erro);
    
    return NextResponse.json(
      { erro: 'Erro ao confirmar presença' },
      { status: 500 }
    );
    
  } finally {
    if (client) {
      await client.end();
    }
  }
}