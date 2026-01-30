import { NextResponse } from 'next/server';
import { Client } from 'pg';

async function conectarBanco() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  return client;
}

export async function GET(request, { params }) {
  let client;
  
  try {
    const { id } = await params;

    if (!id || id === 'undefined') {
      return NextResponse.json({ erro: 'Identificador inválido' }, { status: 400 });
    }

    client = await conectarBanco();

    console.log('🔍 API Viagem Detalhes - Buscando:', id);

    // =================================================================
    // 🧠 LÓGICA INTELIGENTE (A CORREÇÃO ESTÁ AQUI)
    // =================================================================
    
    // Verifica se o ID é APENAS números (ex: "10") ou se tem letras (ex: "V010")
    const ehApenasNumeros = /^\d+$/.test(id);
    
    let queryWhere = '';
    let parametroBusca = '';

    if (ehApenasNumeros) {
      // Se for número puro (ex: "14"), busca pelo ID da tabela
      console.log('👉 Identificado como ID Numérico');
      queryWhere = 'v.id = $1';
      parametroBusca = parseInt(id, 10); 
    } else {
      // Se tiver letras (ex: "V010"), busca pelo CÓDIGO_VIAGEM
      console.log('👉 Identificado como Código de Texto');
      queryWhere = 'v.codigo_viagem = $1';
      parametroBusca = id; // Mantém como texto!
    }

    // 1. Buscar Detalhes da Viagem
    const queryViagem = `
      SELECT 
        v.id as viagem_id,
        v.codigo_viagem,
        TO_CHAR(v.data_viagem, 'YYYY-MM-DD') as data_viagem,
        v.horario_saida,
        v.status,
        v.numero_vagas,
        v.observacoes,
        v.motivo,
        
        -- Destino
        v.hospital_destino,
        v.endereco_destino,
        v.ubs_destino_id,
        ubs.nome as ubs_destino_nome,

        -- Motorista
        v.motorista_id,
        u_mot.nome_completo as motorista_nome,
        u_mot.telefone as motorista_telefone,
        m.veiculo_modelo,

        -- Ônibus
        v.onibus_id,
        o.placa as onibus_placa,
        o.modelo as onibus_modelo,
        o.cor as onibus_cor

      FROM viagens v
      LEFT JOIN ubs ON v.ubs_destino_id = ubs.id
      LEFT JOIN motoristas m ON v.motorista_id = m.id
      LEFT JOIN usuarios u_mot ON m.usuario_id = u_mot.id
      LEFT JOIN onibus o ON v.onibus_id = o.id
      WHERE ${queryWhere}
    `;

    const resViagem = await client.query(queryViagem, [parametroBusca]);

    if (resViagem.rows.length === 0) {
      return NextResponse.json({ erro: 'Viagem não encontrada' }, { status: 404 });
    }

    const viagem = resViagem.rows[0];

    // 2. Buscar Pacientes (Sempre usa o ID numérico que pegamos na busca acima)
    const resPacientes = await client.query(
      `SELECT 
        vp.id,
        vp.paciente_id,
        u.nome_completo,
        u.cpf,
        p.cartao_sus,
        ubs.nome as paciente_ubs_nome,
        vp.motivo,
        vp.nome_acompanhante,
        vp.vai_acompanhado,
        vp.compareceu -- Puxa se compareceu ou não
       FROM viagem_pacientes vp
       INNER JOIN pacientes p ON vp.paciente_id = p.id
       INNER JOIN usuarios u ON p.usuario_id = u.id
       LEFT JOIN ubs ON p.ubs_cadastro_id = ubs.id
       WHERE vp.viagem_id = $1
       ORDER BY u.nome_completo ASC`,
      [viagem.viagem_id]
    );

    return NextResponse.json({
      viagem: viagem,
      pacientes: resPacientes.rows
    }, { status: 200 });

  } catch (erro) {
    console.error('❌ Erro API Viagem:', erro);
    return NextResponse.json({ erro: 'Erro interno ao buscar viagem', detalhe: erro.message }, { status: 500 });
  } finally {
    if (client) await client.end();
  }
}