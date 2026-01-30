import { NextResponse } from 'next/server';
import { Client } from 'pg';

/**
 * API ROUTE PARA BUSCAR DETALHES DE UMA VIAGEM
 * Retorna dados da viagem + lista de passageiros
 * Aceita ID numérico ou Código da Viagem (ex: V010)
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
    const { id } = await params; 
    
    if (!id || id === 'undefined') {
      return NextResponse.json(
        { erro: 'Identificador da viagem é obrigatório' },
        { status: 400 }
      );
    }

    client = await conectarBanco();

    // 🧠 LÓGICA DE DECISÃO INTELIGENTE (IGUAL À OUTRA API)
    // Verifica se o ID é APENAS números (ex: "10") ou se tem letras (ex: "V010")
    const ehApenasNumeros = /^\d+$/.test(id);
    
    let queryWhere = '';
    let parametroBusca = '';

    if (ehApenasNumeros) {
      // Se for número puro, busca pelo ID da tabela
      queryWhere = 'v.id = $1';
      parametroBusca = parseInt(id, 10); 
    } else {
      // Se tiver letras, busca pelo CÓDIGO_VIAGEM
      queryWhere = 'v.codigo_viagem = $1';
      parametroBusca = id; 
    }

    // 1. BUSCAR DADOS DA VIAGEM (Principal)
    const queryViagem = `
      SELECT 
        v.id as viagem_id,
        v.codigo_viagem,
        TO_CHAR(v.data_viagem, 'YYYY-MM-DD') as data_viagem,
        v.horario_saida,
        v.status,
        v.numero_vagas,
        v.hospital_destino,
        v.endereco_destino,
        v.confirmado_em,
        v.observacoes,
        -- UBS Destino
        ubs.id as ubs_destino_id,
        ubs.nome as ubs_destino_nome,
        ubs.endereco as ubs_destino_endereco,
        ubs.telefone as ubs_destino_telefone,
        -- Motorista
        mot_usr.nome_completo as motorista_nome,
        mot_usr.telefone as motorista_telefone,
        mot.cnh as motorista_cnh,
        -- Ônibus
        o.placa as onibus_placa,
        o.modelo as onibus_modelo,
        o.ano as onibus_ano,
        o.cor as onibus_cor,
        o.capacidade_passageiros as onibus_capacidade
      FROM viagens v
      LEFT JOIN motoristas mot ON v.motorista_id = mot.id
      LEFT JOIN usuarios mot_usr ON mot.usuario_id = mot_usr.id
      LEFT JOIN onibus o ON v.onibus_id = o.id
      LEFT JOIN ubs ON v.ubs_destino_id = ubs.id
      WHERE ${queryWhere}
    `;

    const resultadoViagem = await client.query(queryViagem, [parametroBusca]);

    if (resultadoViagem.rows.length === 0) {
      return NextResponse.json(
        { erro: 'Viagem não encontrada' },
        { status: 404 }
      );
    }

    const viagem = resultadoViagem.rows[0];

    // 2. BUSCAR PACIENTES DESTA VIAGEM
    // Importante: Usamos o viagem.viagem_id (numérico) que recuperamos acima
    const queryPacientes = `
      SELECT 
        vp.id as vinculo_id,
        p.id as paciente_id,
        p.cartao_sus,
        u.nome_completo,
        u.cpf,
        u.sexo,
        vp.motivo,
        vp.observacoes,
        vp.horario_consulta,
        vp.compareceu,
        -- UBS do Paciente
        ubs.nome as paciente_ubs_nome
      FROM viagem_pacientes vp
      INNER JOIN pacientes p ON vp.paciente_id = p.id
      INNER JOIN usuarios u ON p.usuario_id = u.id
      LEFT JOIN ubs ON p.ubs_cadastro_id = ubs.id
      WHERE vp.viagem_id = $1
      ORDER BY u.nome_completo ASC
    `;

    const resultadoPacientes = await client.query(queryPacientes, [viagem.viagem_id]);

    // 3. BUSCAR HISTÓRICO
    const queryHistorico = `
      SELECT 
        h.status_anterior,
        h.status_novo,
        h.observacao,
        h.data_alteracao,
        u.nome_completo as alterado_por
      FROM historico_viagens h
      LEFT JOIN usuarios u ON h.alterado_por = u.id
      WHERE h.viagem_id = $1
      ORDER BY h.data_alteracao DESC
    `;

    const resultadoHistorico = await client.query(queryHistorico, [viagem.viagem_id]);

    return NextResponse.json(
      { 
        viagem: viagem,
        pacientes: resultadoPacientes.rows,
        historico: resultadoHistorico.rows
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

// PUT - Confirmar Viagem (Geral)
// Também precisa ser ajustado para aceitar ID ou Código
export async function PUT(request, { params }) {
  let client;
  
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { erro: 'ID da viagem é obrigatório' },
        { status: 400 }
      );
    }

    client = await conectarBanco();

    // Lógica inteligente para o WHERE
    const ehApenasNumeros = /^\d+$/.test(id);
    let queryWhere = '';
    let parametroBusca = '';

    if (ehApenasNumeros) {
      queryWhere = 'id = $1';
      parametroBusca = parseInt(id, 10);
    } else {
      queryWhere = 'codigo_viagem = $1';
      parametroBusca = id;
    }

    // Verificar status atual
    const queryVerificacao = `SELECT id, status FROM viagens WHERE ${queryWhere}`;
    const viagemExiste = await client.query(queryVerificacao, [parametroBusca]);

    if (viagemExiste.rows.length === 0) {
      return NextResponse.json(
        { erro: 'Viagem não encontrada' },
        { status: 404 }
      );
    }

    // Confirmar viagem (usando o WHERE dinâmico)
    const queryUpdate = `
      UPDATE viagens 
      SET status = 'confirmado', confirmado_em = CURRENT_TIMESTAMP
      WHERE ${queryWhere}
    `;
    
    await client.query(queryUpdate, [parametroBusca]);

    return NextResponse.json(
      { mensagem: 'Viagem confirmada com sucesso' },
      { status: 200 }
    );

  } catch (erro) {
    console.error('Erro ao confirmar viagem:', erro);
    return NextResponse.json(
      { erro: 'Erro ao confirmar viagem' },
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.end();
    }
  }
}