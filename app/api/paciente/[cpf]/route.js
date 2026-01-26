// app/api/paciente/[cpf]/route.js
import { NextResponse } from 'next/server';
import { Client } from 'pg';

/**
 * API ROUTE PARA BUSCAR INFORMAÇÕES COMPLETAS DO PACIENTE
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
    const { cpf } = params;
    
    if (!cpf) {
      return NextResponse.json(
        { erro: 'CPF é obrigatório' },
        { status: 400 }
      );
    }

    // Limpar CPF (remover formatação)
    const cpfLimpo = cpf.replace(/\D/g, '');

    client = await conectarBanco();

    // Buscar informações completas do paciente
    const resultado = await client.query(
      `SELECT 
        u.id as usuario_id,
        u.cpf,
        u.nome_completo,
        u.email,
        u.telefone,
        u.endereco,
        u.cep,
        u.ativo,
        p.id as paciente_id,
        p.cartao_sus,
        p.nome_pai,
        p.nome_mae,
        p.data_nascimento,
        p.tipo_sanguineo,
        p.alergias,
        p.observacoes_medicas,
        EXTRACT(YEAR FROM AGE(p.data_nascimento)) as idade
      FROM usuarios u
      INNER JOIN pacientes p ON u.id = p.usuario_id
      WHERE REPLACE(REPLACE(REPLACE(u.cpf, '.', ''), '-', ''), ' ', '') = $1
      AND u.tipo_usuario = 'paciente'
      LIMIT 1`,
      [cpfLimpo]
    );

    if (resultado.rows.length === 0) {
      return NextResponse.json(
        { erro: 'Paciente não encontrado' },
        { status: 404 }
      );
    }

    const paciente = resultado.rows[0];

    // Buscar viagens do paciente
    const viagens = await client.query(
      `SELECT 
        v.id as viagem_id,
        v.codigo_viagem,
        v.data_viagem,
        v.horario_saida,
        v.horario_consulta,
        v.status,
        v.motivo,
        v.hospital_destino,
        v.confirmado_em,
        -- Médico
        m_usr.nome_completo as medico_nome,
        med.crm as medico_crm,
        med.especializacao as medico_especializacao,
        -- Motorista
        mot_usr.nome_completo as motorista_nome,
        mot.veiculo_placa,
        mot.veiculo_modelo
      FROM viagens v
      LEFT JOIN medicos med ON v.medico_id = med.id
      LEFT JOIN usuarios m_usr ON med.usuario_id = m_usr.id
      LEFT JOIN motoristas mot ON v.motorista_id = mot.id
      LEFT JOIN usuarios mot_usr ON mot.usuario_id = mot_usr.id
      WHERE v.paciente_id = $1
      ORDER BY 
        CASE 
          WHEN v.status IN ('pendente', 'confirmado') THEN 0
          ELSE 1
        END,
        v.data_viagem DESC`,
      [paciente.paciente_id]
    );

    return NextResponse.json(
      { 
        paciente: paciente,
        viagens: viagens.rows,
        total_viagens: viagens.rows.length
      },
      { status: 200 }
    );

  } catch (erro) {
    console.error('Erro ao buscar paciente:', erro);
    
    return NextResponse.json(
      { erro: 'Erro ao buscar informações do paciente' },
      { status: 500 }
    );
    
  } finally {
    if (client) {
      await client.end();
    }
  }
}