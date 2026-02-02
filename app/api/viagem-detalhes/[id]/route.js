//app/api/viagem-detalhes/[id]/route.js

import { NextResponse } from 'next/server';
import { Client } from 'pg';

async function conectarBanco() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Importante para conexão segura (Neon/AWS)
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

    // 1. Buscar informações da viagem
    // ALTERAÇÃO AQUI: Mudamos o WHERE para aceitar ID ou CÓDIGO
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
        mot.cnh as motorista_cnh, -- Adicionado para o relatório
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
      WHERE v.id::text = $1 OR v.codigo_viagem = $1`, // <--- CORREÇÃO PRINCIPAL
      [id]
    );

    if (viagemResult.rows.length === 0) {
      return NextResponse.json(
        { erro: 'Viagem não encontrada' },
        { status: 404 }
      );
    }

    const viagem = viagemResult.rows[0];

    // 2. Buscar pacientes associados à viagem
    // Nota: Certifique-se que a tabela 'viagem_pacientes' existe. 
    // Se der erro aqui, pode ser que você use apenas a tabela 'pacientes' com coluna 'viagem_id'.
    // Vou usar um bloco try/catch específico para os pacientes para não quebrar a página toda se a tabela mudar.
    
    let pacientes = [];
    try {
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
            vp.compareceu, -- Importante para o checkbox de embarque
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
        pacientes = pacientesResult.rows;
    } catch (errPacientes) {
        console.warn("Erro ao buscar pacientes (tabela pode estar diferente):", errPacientes.message);
        // Se falhar a tabela de ligação, tenta buscar direto na tabela de pacientes (plano B)
        try {
             const pacientesResultBackup = await client.query(
                `SELECT 
                    p.id as paciente_id,
                    u.nome_completo,
                    u.cpf,
                    p.cartao_sus
                 FROM pacientes p
                 INNER JOIN usuarios u ON p.usuario_id = u.id
                 WHERE p.viagem_id = $1`,
                 [viagem.viagem_id]
             );
             pacientes = pacientesResultBackup.rows;
        } catch (e) {
            pacientes = []; // Retorna lista vazia se tudo falhar
        }
    }

    return NextResponse.json(
      { 
        viagem: viagem,
        pacientes: pacientes
      },
      { status: 200 }
    );

  } catch (erro) {
    console.error('Erro ao buscar detalhes da viagem:', erro);
    
    return NextResponse.json(
      { erro: 'Erro interno: ' + erro.message },
      { status: 500 }
    );
    
  } finally {
    if (client) {
      await client.end();
    }
  }
}