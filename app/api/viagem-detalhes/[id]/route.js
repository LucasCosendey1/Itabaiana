// app/api/viagem-detalhes/[id]/route.js
import { NextResponse } from 'next/server';
import { Client } from 'pg';

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

    // Buscar informações da viagem
    const viagemResult = await client.query(
      `SELECT 
        v.id as viagem_id,
        v.codigo_viagem,
        TO_CHAR(v.data_viagem, 'YYYY-MM-DD') as data_viagem,
        v.horario_saida,
        v.status,
        v.hospital_destino,
        v.endereco_destino,
        v.numero_vagas,
        -- Motorista
        mot_usr.nome_completo as motorista_nome,
        mot_usr.telefone as motorista_telefone,
        mot.veiculo_modelo,
        mot.veiculo_placa,
        -- Ônibus
        o.placa as onibus_placa,
        o.modelo as onibus_modelo,
        o.ano as onibus_ano,
        o.cor as onibus_cor,
        o.capacidade_passageiros as onibus_capacidade,
        -- UBS Destino
        ubs.id as ubs_destino_id,
        ubs.nome as ubs_destino_nome,
        ubs.endereco as ubs_destino_endereco,
        ubs.telefone as ubs_destino_telefone
      FROM viagens v
      LEFT JOIN motoristas mot ON v.motorista_id = mot.id
      LEFT JOIN usuarios mot_usr ON mot.usuario_id = mot_usr.id
      LEFT JOIN onibus o ON v.onibus_id = o.id
      LEFT JOIN ubs ON v.ubs_destino_id = ubs.id
      WHERE v.codigo_viagem = $1`,
      [id]
    );

    if (viagemResult.rows.length === 0) {
      return NextResponse.json(
        { erro: 'Viagem não encontrada' },
        { status: 404 }
      );
    }

    const viagem = viagemResult.rows[0];

    // Buscar pacientes associados à viagem
    const pacientesResult = await client.query(
      `SELECT 
        vp.id as viagem_paciente_id,
        p.id as paciente_id,
        u.cpf,
        u.nome_completo,
        u.telefone,
        u.sexo,
        p.cartao_sus,
        vp.motivo,
        vp.horario_consulta,
        vp.observacoes,
        -- Médico
        m_usr.nome_completo as medico_nome,
        med.crm as medico_crm,
        med.especializacao as medico_especializacao,
        -- UBS do Paciente
        ubs.nome as paciente_ubs_nome
      FROM viagem_pacientes vp
      INNER JOIN pacientes p ON vp.paciente_id = p.id
      INNER JOIN usuarios u ON p.usuario_id = u.id
      LEFT JOIN medicos med ON vp.medico_id = med.id
      LEFT JOIN usuarios m_usr ON med.usuario_id = m_usr.id
      LEFT JOIN ubs ON p.ubs_cadastro_id = ubs.id
      WHERE vp.viagem_id = $1
      ORDER BY u.nome_completo`,
      [viagem.viagem_id]
    );

    return NextResponse.json(
      { 
        viagem: viagem,
        pacientes: pacientesResult.rows
      },
      { status: 200 }
    );

  } catch (erro) {
    console.error('Erro ao buscar detalhes da viagem:', erro);
    
    return NextResponse.json(
      { erro: 'Erro ao buscar detalhes da viagem' },
      { status: 500 }
    );
    
  } finally {
    if (client) {
      await client.end();
    }
  }
}