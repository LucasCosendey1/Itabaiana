//api/medico/[id]/route.js
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

    // ✅ LÓGICA INTELIGENTE: Tenta ID primeiro, depois CPF
    let queryWhere = '';
    let parametroBusca = '';

    // Verifica se é número puro (ID) ou se tem pontos/traços (CPF)
    const ehApenasNumeros = /^\d+$/.test(id);
    
    if (ehApenasNumeros && id.length <= 10) {
      // É um ID numérico curto
      queryWhere = 'mot.id = $1';
      parametroBusca = parseInt(id, 10);
    } else {
      // É CPF (com ou sem formatação)
      queryWhere = 'u.cpf = $1';
      parametroBusca = id.replace(/\D/g, ''); // Remove formatação
      
      // Formata CPF para o padrão do banco (XXX.XXX.XXX-XX)
      if (parametroBusca.length === 11) {
        parametroBusca = parametroBusca.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      }
    }

    console.log(`🔍 Buscando motorista: ${queryWhere} com valor: ${parametroBusca}`);

    // 1. Buscar informações do motorista
    const queryMotorista = `
      SELECT 
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
      WHERE ${queryWhere}
    `;

    const resultado = await client.query(queryMotorista, [parametroBusca]);

    if (resultado.rows.length === 0) {
      return NextResponse.json({ erro: 'Motorista não encontrado' }, { status: 404 });
    }

    const motorista = resultado.rows[0];
    console.log(`✅ Motorista encontrado: ${motorista.nome_completo}`);

    // 2. Buscar histórico de viagens (usando o ID encontrado)
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
            o.modelo as veiculo_modelo,
            COUNT(vp.id) as total_passageiros
          FROM viagens v
          LEFT JOIN ubs ON v.ubs_destino_id = ubs.id
          LEFT JOIN onibus o ON v.onibus_id = o.id
          LEFT JOIN viagem_pacientes vp ON v.id = vp.viagem_id
          WHERE v.motorista_id = $1
          GROUP BY v.id, v.codigo_viagem, v.data_viagem, v.horario_saida, 
                   v.status, v.hospital_destino, v.numero_vagas, 
                   ubs.nome, o.placa, o.modelo
          ORDER BY v.data_viagem DESC, v.horario_saida DESC
          LIMIT 50`,
          [motorista.motorista_id] // ✅ Usa o ID que encontramos
        );
        
        viagens = resViagens.rows.map(v => ({
            id: v.viagem_id,
            viagem_id: v.viagem_id, // Mantém os dois
            codigo_viagem: v.codigo_viagem,
            codigo: v.codigo_viagem,
            data_viagem: v.data_viagem,
            data: v.data_viagem,
            horario_saida: v.horario_saida,
            horario: v.horario_saida,
            status: v.status,
            destino: v.ubs_destino_nome || v.hospital_destino,
            hospital_destino: v.ubs_destino_nome || v.hospital_destino,
            veiculo: v.veiculo_placa ? `${v.veiculo_placa} (${v.veiculo_modelo})` : 'N/D',
            total_passageiros: parseInt(v.total_passageiros) || 0
        }));

        console.log(`✅ ${viagens.length} viagens encontradas`);

    } catch (e) {
        console.error('⚠️ Erro ao buscar viagens:', e.message);
    }

    // 3. Estatísticas
    let estatisticas = { total_viagens: 0, viagens_pendentes: 0, viagens_concluidas: 0 };
    try {
        const stats = await client.query(
          `SELECT 
            COUNT(*) as total_viagens,
            COUNT(CASE WHEN status = 'pendente' THEN 1 END) as viagens_pendentes,
            COUNT(CASE WHEN status = 'confirmado' OR status = 'concluido' THEN 1 END) as viagens_concluidas
          FROM viagens WHERE motorista_id = $1`,
          [motorista.motorista_id]
        );
        estatisticas = stats.rows[0];
    } catch (e) {
        console.error('⚠️ Erro ao buscar estatísticas:', e.message);
    }

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
    console.error('❌ Erro API Motorista:', erro.message);
    return NextResponse.json({ 
      erro: 'Erro interno no servidor',
      detalhes: erro.message 
    }, { status: 500 });
  } finally {
    if (client) await client.end();
  }
}