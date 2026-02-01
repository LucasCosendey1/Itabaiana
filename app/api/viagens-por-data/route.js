import { NextResponse } from 'next/server';
import { Client } from 'pg';

async function conectarBanco() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  return client;
}

export async function GET(request) {
  let client;
  
  try {
    const { searchParams } = new URL(request.url);
    const data = searchParams.get('data'); // Formato esperado: YYYY-MM-DD

    if (!data) return NextResponse.json({ erro: 'Data obrigatória' }, { status: 400 });

    client = await conectarBanco();

    // --------------------------------------------------------------------------------
    // QUERY PRINCIPAL (Tenta buscar o veículo vinculado diretamente à viagem)
    // --------------------------------------------------------------------------------
    const queryPrincipal = `
      SELECT 
        v.id as viagem_id,
        v.codigo_viagem,
        TO_CHAR(v.data_viagem, 'YYYY-MM-DD') as data_viagem,
        v.horario_saida,
        v.status,
        v.hospital_destino,
        v.numero_vagas,
        
        -- Dados do Motorista
        mot.id as motorista_id,
        mot_usr.nome_completo as motorista_nome,
        mot_usr.cpf as motorista_cpf,
        mot_usr.telefone as motorista_telefone,
        mot.cnh as motorista_cnh,
        
        -- ✅ VEÍCULO DA VIAGEM (Corrigido: capacidade_passageiros)
        o.placa as veiculo_placa,
        o.modelo as veiculo_modelo,
        o.cor as veiculo_cor,
        o.capacidade_passageiros as veiculo_capacidade, -- Nome correto da coluna
        
        -- UBS Destino
        ubs.id as ubs_destino_id,
        ubs.nome as ubs_destino_nome,
        ubs.endereco as ubs_destino_endereco
        
      FROM viagens v
      LEFT JOIN motoristas mot ON v.motorista_id = mot.id
      LEFT JOIN usuarios mot_usr ON mot.usuario_id = mot_usr.id
      LEFT JOIN ubs ON v.ubs_destino_id = ubs.id
      LEFT JOIN onibus o ON v.onibus_id = o.id 
      WHERE TO_CHAR(v.data_viagem, 'YYYY-MM-DD') = $1
      ORDER BY v.horario_saida ASC
    `;

    // --------------------------------------------------------------------------------
    // QUERY FALLBACK (Plano B: Se a coluna onibus_id não existir, usa o veículo do motorista)
    // --------------------------------------------------------------------------------
    const queryFallback = `
      SELECT 
        v.id as viagem_id,
        v.codigo_viagem,
        TO_CHAR(v.data_viagem, 'YYYY-MM-DD') as data_viagem,
        v.horario_saida,
        v.status,
        v.hospital_destino,
        v.numero_vagas,
        
        mot.id as motorista_id,
        mot_usr.nome_completo as motorista_nome,
        mot_usr.cpf as motorista_cpf,
        mot_usr.telefone as motorista_telefone,
        mot.cnh as motorista_cnh,
        
        -- ⚠️ Fallback: Pega do cadastro do MOTORISTA
        mot.veiculo_placa,
        mot.veiculo_modelo,
        mot.capacidade_passageiros as veiculo_capacidade,
        'N/A' as veiculo_cor,
        
        ubs.id as ubs_destino_id,
        ubs.nome as ubs_destino_nome,
        ubs.endereco as ubs_destino_endereco
        
      FROM viagens v
      LEFT JOIN motoristas mot ON v.motorista_id = mot.id
      LEFT JOIN usuarios mot_usr ON mot.usuario_id = mot_usr.id
      LEFT JOIN ubs ON v.ubs_destino_id = ubs.id
      WHERE TO_CHAR(v.data_viagem, 'YYYY-MM-DD') = $1
      ORDER BY v.horario_saida ASC
    `;

    let resultadoViagens;

    try {
      // Tenta executar a query correta (com onibus_id e capacidade_passageiros)
      resultadoViagens = await client.query(queryPrincipal, [data]);
    } catch (erroQuery) {
      // Se der erro de coluna não existe, executa o Plano B
      if (erroQuery.message.includes('does not exist') || erroQuery.message.includes('não existe')) {
        console.warn('⚠️ Erro na query principal. Tentando fallback...', erroQuery.message);
        resultadoViagens = await client.query(queryFallback, [data]);
      } else {
        throw erroQuery; // Se for outro erro, repassa
      }
    }

    console.log(`📊 Viagens encontradas: ${resultadoViagens.rows.length}`);

    // Buscar Passageiros para cada viagem encontrada
    const viagensComPacientes = [];

    for (const viagem of resultadoViagens.rows) {
      const queryPacientes = `
        SELECT 
          p.id as paciente_id,
          u.nome_completo as paciente_nome,
          u.cpf as paciente_cpf,
          u.telefone as paciente_telefone,
          COALESCE(p.id::text, 'N/A') as paciente_endereco, -- Ajuste temporário se endereco não existir
          TO_CHAR(p.data_nascimento, 'YYYY-MM-DD') as paciente_data_nascimento,
          p.cartao_sus,
          vp.motivo,
          vp.horario_consulta,
          
          -- Médico
          med_usr.nome_completo as medico_nome,
          med.crm as medico_crm,
          
          -- UBS Origem
          ubs_pac.nome as paciente_ubs_nome
          
        FROM viagem_pacientes vp
        INNER JOIN pacientes p ON vp.paciente_id = p.id
        INNER JOIN usuarios u ON p.usuario_id = u.id
        LEFT JOIN medicos med ON vp.medico_id = med.id
        LEFT JOIN usuarios med_usr ON med.usuario_id = med_usr.id
        LEFT JOIN ubs ubs_pac ON p.ubs_cadastro_id = ubs_pac.id
        WHERE vp.viagem_id = $1
        ORDER BY u.nome_completo ASC
      `;

      const resultadoPacientes = await client.query(queryPacientes, [viagem.viagem_id]);

      viagensComPacientes.push({
        ...viagem,
        pacientes: resultadoPacientes.rows
      });
    }

    return NextResponse.json({ 
      viagens: viagensComPacientes,
      data: data,
      aviso: 'Sucesso'
    }, { status: 200 });

  } catch (erro) {
    console.error('❌ Erro CRÍTICO na API:', erro.message);
    return NextResponse.json({ erro: 'Erro interno ao buscar dados.', detalhe: erro.message }, { status: 500 });
  } finally {
    if (client) await client.end();
  }
}