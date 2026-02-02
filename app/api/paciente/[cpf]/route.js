// app/api/paciente/[cpf]/route.js
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
    const { cpf } = await params; // ✅ Adicionei await para Next.js 15
    
    if (!cpf) {
      return NextResponse.json(
        { erro: 'CPF é obrigatório' },
        { status: 400 }
      );
    }

    const cpfLimpo = cpf.replace(/\D/g, '');
    console.log('🔍 Buscando paciente com CPF:', cpfLimpo);

    client = await conectarBanco();

    // 1. Buscar informações completas do paciente
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
      console.log('❌ Paciente não encontrado');
      return NextResponse.json(
        { erro: 'Paciente não encontrado' },
        { status: 404 }
      );
    }

    const paciente = resultado.rows[0];
    console.log('✅ Paciente encontrado:', paciente.nome_completo);

    // 2. Buscar viagens do paciente
    const resViagens = await client.query(
      `SELECT 
        v.id as viagem_id,
        v.codigo_viagem,
        TO_CHAR(v.data_viagem, 'YYYY-MM-DD') as data_viagem,
        v.horario_saida,
        v.status,
        v.hospital_destino,
        v.confirmado_em,
        -- Dados específicos do paciente nesta viagem
        vp.motivo,
        vp.horario_consulta,
        vp.observacoes,
        vp.compareceu,
        -- Médico
        m_usr.nome_completo as medico_nome,
        med.crm as medico_crm,
        med.especializacao as medico_especializacao,
        -- Motorista
        mot_usr.nome_completo as motorista_nome,
        mot.veiculo_placa,
        mot.veiculo_modelo,
        -- UBS Destino
        ubs.nome as ubs_destino_nome
      FROM viagem_pacientes vp
      INNER JOIN viagens v ON vp.viagem_id = v.id
      LEFT JOIN medicos med ON vp.medico_id = med.id
      LEFT JOIN usuarios m_usr ON med.usuario_id = m_usr.id
      LEFT JOIN motoristas mot ON v.motorista_id = mot.id
      LEFT JOIN usuarios mot_usr ON mot.usuario_id = mot_usr.id
      LEFT JOIN ubs ON v.ubs_destino_id = ubs.id
      WHERE vp.paciente_id = $1
      ORDER BY 
        CASE 
          WHEN v.status IN ('pendente', 'confirmado') THEN 0
          ELSE 1
        END,
        v.data_viagem DESC,
        v.horario_saida ASC`,
      [paciente.paciente_id]
    );

    console.log(`✅ ${resViagens.rows.length} viagens encontradas`);

    // ✅ NORMALIZAR OS CAMPOS PARA O FRONTEND (CardViagem espera esses nomes)
    const viagensFormatadas = resViagens.rows.map(v => ({
      // IDs (vários formatos para compatibilidade)
      viagem_id: v.viagem_id,
      id: v.viagem_id,
      codigo_viagem: v.codigo_viagem,
      codigo: v.codigo_viagem,
      
      // Data e Hora (AMBOS OS FORMATOS)
      dataViagem: v.data_viagem,
      data_viagem: v.data_viagem,
      horarioViagem: v.horario_saida,
      horario_saida: v.horario_saida,
      horarioConsulta: v.horario_consulta,
      horario_consulta: v.horario_consulta,
      
      // Status
      status: v.status,
      status_viagem: v.status,
      
      // Destino
      hospital: v.ubs_destino_nome || v.hospital_destino,
      hospital_destino: v.ubs_destino_nome || v.hospital_destino,
      
      // Consulta
      motivo: v.motivo,
      observacoes: v.observacoes,
      compareceu: v.compareceu,
      
      // Médico
      medico: v.medico_nome,
      medico_nome: v.medico_nome,
      medico_crm: v.medico_crm,
      medico_especializacao: v.medico_especializacao,
      
      // Motorista
      motorista: v.motorista_nome,
      motorista_nome: v.motorista_nome,
      veiculo: v.veiculo_placa ? `${v.veiculo_placa} - ${v.veiculo_modelo}` : null,
      
      // Outros
      confirmado_em: v.confirmado_em
    }));

    return NextResponse.json(
      { 
        paciente: paciente,
        viagens: viagensFormatadas,
        total_viagens: viagensFormatadas.length
      },
      { status: 200 }
    );

  } catch (erro) {
    console.error('❌ Erro ao buscar paciente:', erro.message);
    
    return NextResponse.json(
      { erro: 'Erro ao buscar informações do paciente', detalhes: erro.message },
      { status: 500 }
    );
    
  } finally {
    if (client) {
      await client.end();
    }
  }
}