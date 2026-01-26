// app/api/buscar-paciente/route.js
import { NextResponse } from 'next/server';
import { Client } from 'pg';

/**
 * API ROUTE PARA BUSCAR PACIENTES
 * Busca por CPF ou nome
 */

async function conectarBanco() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  await client.connect();
  return client;
}

export async function GET(request) {
  let client;
  
  try {
    const { searchParams } = new URL(request.url);
    const busca = searchParams.get('busca');
    
    if (!busca) {
      return NextResponse.json(
        { erro: 'Parâmetro de busca é obrigatório' },
        { status: 400 }
      );
    }

    client = await conectarBanco();

    // Verificar se é CPF (apenas números) ou nome
    const apenasNumeros = busca.replace(/\D/g, '');
    const isCPF = apenasNumeros.length >= 11;

    let resultado;

    if (isCPF) {
      // Busca por CPF
      resultado = await client.query(
        `SELECT 
          u.id as usuario_id,
          u.cpf,
          u.nome_completo,
          u.email,
          u.telefone,
          u.endereco,
          u.cep,
          p.id as paciente_id,
          p.cartao_sus,
          p.nome_pai,
          p.nome_mae,
          p.data_nascimento,
          p.tipo_sanguineo,
          p.alergias
        FROM usuarios u
        INNER JOIN pacientes p ON u.id = p.usuario_id
        WHERE u.cpf LIKE $1 AND u.tipo_usuario = 'paciente' AND u.ativo = true
        LIMIT 1`,
        [`%${apenasNumeros}%`]
      );
    } else {
      // Busca por nome
      resultado = await client.query(
        `SELECT 
          u.id as usuario_id,
          u.cpf,
          u.nome_completo,
          u.email,
          u.telefone,
          u.endereco,
          u.cep,
          p.id as paciente_id,
          p.cartao_sus,
          p.nome_pai,
          p.nome_mae,
          p.data_nascimento,
          p.tipo_sanguineo,
          p.alergias
        FROM usuarios u
        INNER JOIN pacientes p ON u.id = p.usuario_id
        WHERE LOWER(u.nome_completo) LIKE LOWER($1) 
        AND u.tipo_usuario = 'paciente' 
        AND u.ativo = true
        ORDER BY u.nome_completo
        LIMIT 10`,
        [`%${busca}%`]
      );
    }

    if (resultado.rows.length === 0) {
      return NextResponse.json(
        { pacientes: [], mensagem: 'Nenhum paciente encontrado' },
        { status: 200 }
      );
    }

    // Buscar viagens de cada paciente encontrado
    const pacientesComViagens = await Promise.all(
      resultado.rows.map(async (paciente) => {
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
            mot.cnh as motorista_cnh,
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

        return {
          ...paciente,
          viagens: viagens.rows
        };
      })
    );

    return NextResponse.json(
      { 
        pacientes: pacientesComViagens,
        total: pacientesComViagens.length
      },
      { status: 200 }
    );

  } catch (erro) {
    console.error('Erro ao buscar paciente:', erro);
    
    return NextResponse.json(
      { erro: 'Erro ao buscar paciente' },
      { status: 500 }
    );
    
  } finally {
    if (client) {
      await client.end();
    }
  }
}