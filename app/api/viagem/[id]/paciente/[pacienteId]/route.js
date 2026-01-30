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
    const { id, pacienteId } = await params;

    console.log(`🔍 Check-in API: Viagem=${id}, Paciente=${pacienteId}`);

    client = await conectarBanco();

    // 1. TRADUÇÃO DE ID (Código "V010" -> ID 15)
    let idViagemNumerico = id;
    
    // Se não for número puro, busca o ID pelo código
    if (isNaN(id)) {
        const resBusca = await client.query(
            'SELECT id FROM viagens WHERE codigo_viagem = $1', 
            [id]
        );
        
        if (resBusca.rows.length === 0) {
            return NextResponse.json({ erro: 'Viagem não encontrada' }, { status: 404 });
        }
        
        idViagemNumerico = resBusca.rows[0].id;
        console.log(`🔄 Código ${id} traduzido para ID ${idViagemNumerico}`);
    }

    // 2. BUSCA SEGURA (Apenas colunas confirmadas)
    // Removi 'vp.acompanhante' que provavelmente não existe e causava o erro
    const query = `
      SELECT 
        vp.id as vinculo_id,
        vp.compareceu,
        vp.motivo as motivo_viagem,
        vp.observacoes,
        vp.horario_consulta,
        
        -- Paciente
        p.id as paciente_id,
        TO_CHAR(p.data_nascimento, 'YYYY-MM-DD') as data_nascimento,
        p.tipo_sanguineo,
        p.alergias,
        p.observacoes_medicas,
        p.cartao_sus,
        
        -- Usuário
        u.nome_completo,
        u.cpf,
        u.telefone,
        u.endereco,
        
        -- Viagem
        v.hospital_destino,
        v.codigo_viagem,
        ubs.nome as ubs_destino_nome

      FROM viagem_pacientes vp
      INNER JOIN pacientes p ON vp.paciente_id = p.id
      INNER JOIN usuarios u ON p.usuario_id = u.id
      INNER JOIN viagens v ON vp.viagem_id = v.id
      LEFT JOIN ubs ON v.ubs_destino_id = ubs.id
      
      WHERE vp.viagem_id = $1 AND vp.paciente_id = $2
    `;

    // Garante que os IDs sejam inteiros para o banco
    const valores = [parseInt(idViagemNumerico), parseInt(pacienteId)];

    const resultado = await client.query(query, valores);

    if (resultado.rows.length === 0) {
      console.log('❌ Vínculo não encontrado no banco.');
      return NextResponse.json({ erro: 'Paciente não está nesta viagem' }, { status: 404 });
    }

    return NextResponse.json({ dados: resultado.rows[0] }, { status: 200 });

  } catch (error) {
    // Esse log vai aparecer no seu terminal e nos dirá exatamente o erro
    console.error('🔴 ERRO FATAL API CHECK-IN:', error.message);
    return NextResponse.json({ 
        erro: 'Erro interno ao carregar dados',
        detalhe: error.message 
    }, { status: 500 });
  } finally {
    if (client) await client.end();
  }
}