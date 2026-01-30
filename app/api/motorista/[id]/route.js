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
    // ✅ CORREÇÃO: await params (obrigatório no Next.js 15)
    const { id } = await params;
    
    if (!id || id === 'undefined') {
      return NextResponse.json({ erro: 'ID inválido' }, { status: 400 });
    }

    client = await conectarBanco();

    // 1. Buscar informações do motorista
    const resultado = await client.query(
      `SELECT 
        mot.id as motorista_id,
        u.nome_completo,
        u.cpf,
        u.email,
        u.telefone,
        u.ativo,
        mot.cnh,
        mot.categoria_cnh,
        TO_CHAR(mot.validade_cnh, 'YYYY-MM-DD') as validade_cnh,
        mot.veiculo_placa,
        mot.veiculo_modelo,
        mot.capacidade_passageiros,
        mot.disponivel
      FROM motoristas mot
      INNER JOIN usuarios u ON mot.usuario_id = u.id
      WHERE mot.id = $1`,
      [id]
    );

    if (resultado.rows.length === 0) {
      return NextResponse.json({ erro: 'Motorista não encontrado' }, { status: 404 });
    }

    const motorista = resultado.rows[0];

    // 2. Buscar histórico de viagens
    let viagens = [];
    try {
        const resViagens = await client.query(
          `SELECT 
            v.id as viagem_id,
            v.codigo_viagem,
            TO_CHAR(v.data_viagem, 'YYYY-MM-DD') as data_viagem,
            v.horario_saida,
            v.status,
            v.hospital_destino,
            v.numero_vagas,
            ubs.nome as ubs_destino_nome,
            o.placa as veiculo_placa,
            o.modelo as veiculo_modelo
          FROM viagens v
          LEFT JOIN ubs ON v.ubs_destino_id = ubs.id
          LEFT JOIN onibus o ON v.onibus_id = o.id
          WHERE v.motorista_id = $1
          ORDER BY v.data_viagem DESC
          LIMIT 50`,
          [id]
        );
        
        // Formatar para o frontend
        viagens = resViagens.rows.map(v => ({
            ...v,
            destino: v.ubs_destino_nome || v.hospital_destino,
            veiculo: v.veiculo_placa ? `${v.veiculo_placa} (${v.veiculo_modelo})` : 'N/D'
        }));

    } catch (e) {
        console.warn('Erro ao buscar viagens:', e.message);
    }

    // 3. Estatísticas
    let estatisticas = { total_viagens: 0 };
    try {
        const stats = await client.query(
          `SELECT 
            COUNT(*) as total_viagens,
            COUNT(CASE WHEN status = 'pendente' THEN 1 END) as viagens_pendentes,
            COUNT(CASE WHEN status = 'concluido' THEN 1 END) as viagens_concluidas
          FROM viagens WHERE motorista_id = $1`,
          [id]
        );
        estatisticas = stats.rows[0];
    } catch (e) {}

    return NextResponse.json(
      { 
        motorista,
        viagens,
        estatisticas,
        total_viagens: viagens.length
      },
      { status: 200 }
    );

  } catch (erro) {
    console.error('❌ Erro API Motorista:', erro);
    return NextResponse.json({ erro: 'Erro interno no servidor' }, { status: 500 });
  } finally {
    if (client) await client.end();
  }
}