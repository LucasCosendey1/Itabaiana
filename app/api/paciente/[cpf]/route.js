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
        u.sexo,
        u.ativo,
        p.id as paciente_id,
        p.cartao_sus,
        p.nome_pai,
        p.nome_mae,
        TO_CHAR(p.data_nascimento, 'YYYY-MM-DD') as data_nascimento,
        p.tipo_sanguineo,
        p.alergias,
        p.observacoes_medicas,
        p.microarea,
        p.responsavel_familiar,
        EXTRACT(YEAR FROM AGE(p.data_nascimento)) as idade,
        -- UBS de Cadastro
        ubs.id as ubs_id,
        ubs.nome as ubs_nome,
        ubs.endereco as ubs_endereco,
        ubs.telefone as ubs_telefone,
        -- Agente Comunitário
        acs.id as agente_id,
        acs_usr.nome_completo as agente_nome,
        acs_usr.telefone as agente_telefone,
        acs.microarea as agente_microarea
      FROM usuarios u
      INNER JOIN pacientes p ON u.id = p.usuario_id
      LEFT JOIN ubs ON p.ubs_cadastro_id = ubs.id
      LEFT JOIN agentes_comunitarios acs ON p.agente_id = acs.id
      LEFT JOIN usuarios acs_usr ON acs.usuario_id = acs_usr.id
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

    // Buscar viagens do paciente (CORRIGIDO: Usando tabela intermediária viagem_pacientes)
    const viagens = await client.query(
      `SELECT 
        v.id as viagem_id,
        v.codigo_viagem,
        TO_CHAR(v.data_viagem, 'YYYY-MM-DD') as data_viagem,
        v.horario_saida,
        v.status as status_viagem,
        v.hospital_destino,
        v.confirmado_em,
        -- Dados específicos do paciente nesta viagem (tabela intermediária)
        vp.motivo,
        vp.horario_consulta,
        vp.observacoes,
        -- Médico (geralmente ligado ao agendamento/paciente)
        m_usr.nome_completo as medico_nome,
        med.crm as medico_crm,
        med.especializacao as medico_especializacao,
        -- Motorista
        mot_usr.nome_completo as motorista_nome,
        mot.veiculo_placa,
        mot.veiculo_modelo
      FROM viagem_pacientes vp
      INNER JOIN viagens v ON vp.viagem_id = v.id
      LEFT JOIN medicos med ON vp.medico_id = med.id
      LEFT JOIN usuarios m_usr ON med.usuario_id = m_usr.id
      LEFT JOIN motoristas mot ON v.motorista_id = mot.id
      LEFT JOIN usuarios mot_usr ON mot.usuario_id = mot_usr.id
      WHERE vp.paciente_id = $1
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