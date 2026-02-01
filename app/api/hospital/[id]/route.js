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
    // Correção para Next.js 15
    const { id } = await params;
    
    if (!id || id === 'undefined') {
      return NextResponse.json({ erro: 'ID inválido' }, { status: 400 });
    }

    client = await conectarBanco();

    // 1. DADOS DA UNIDADE (Hospital/UBS)
    const resUnidade = await client.query(
      `SELECT * FROM ubs WHERE id = $1`, 
      [id]
    );

    if (resUnidade.rows.length === 0) {
      return NextResponse.json({ erro: 'Unidade não encontrada' }, { status: 404 });
    }
    const unidade = resUnidade.rows[0];

    // 2. CORPO CLÍNICO (Médicos Vinculados)
    // ✅ CORREÇÃO: Tabela 'medico_vinculos' (singular) em vez de 'medicos_vinculos'
    const resMedicos = await client.query(
      `SELECT 
        m.id,
        m.id as medico_id,
        u.nome_completo,
        m.crm,
        m.especializacao,
        mv.dias_atendimento,
        mv.horario_atendimento,
        mv.atuacao,
        -- Subqueries para contar as viagens deste médico
        (SELECT COUNT(*) FROM viagem_pacientes vp 
         LEFT JOIN viagens v ON vp.viagem_id = v.id 
         WHERE vp.medico_id = m.id AND v.status IN ('pendente', 'agendado')) as total_agendadas,
        (SELECT COUNT(*) FROM viagem_pacientes vp 
         LEFT JOIN viagens v ON vp.viagem_id = v.id 
         WHERE vp.medico_id = m.id AND v.status IN ('concluido', 'confirmado')) as total_realizadas
       FROM medicos m
       INNER JOIN usuarios u ON m.usuario_id = u.id
       INNER JOIN medico_vinculos mv ON m.id = mv.medico_id
       WHERE mv.ubs_id = $1`,
      [id]
    );

    // 3. HISTÓRICO DE VIAGENS RECEBIDAS (Destino = Esta Unidade)
    const resViagens = await client.query(
      `SELECT 
        v.id as viagem_id,
        v.codigo_viagem,
        TO_CHAR(v.data_viagem, 'YYYY-MM-DD') as data_viagem,
        v.horario_saida,
        v.status,
        v.motivo,
        u_mot.nome_completo as motorista_nome
       FROM viagens v
       LEFT JOIN motoristas mot ON v.motorista_id = mot.id
       LEFT JOIN usuarios u_mot ON mot.usuario_id = u_mot.id
       WHERE v.ubs_destino_id = $1
       ORDER BY v.data_viagem DESC
       LIMIT 50`,
      [id]
    );

    // 4. PACIENTES CADASTRADOS (Apenas se for UBS)
    let pacientes = [];
    if (unidade.tipo === 'ubs') {
        const resPacientes = await client.query(
          `SELECT 
            p.id,
            p.cartao_sus,
            u.nome_completo,
            u.cpf,
            u.telefone,
            TO_CHAR(p.data_nascimento, 'YYYY-MM-DD') as data_nascimento
           FROM pacientes p
           INNER JOIN usuarios u ON p.usuario_id = u.id
           WHERE p.ubs_cadastro_id = $1
           ORDER BY u.nome_completo ASC`,
          [id]
        );
        pacientes = resPacientes.rows;
    }

    return NextResponse.json({
      unidade,
      medicos: resMedicos.rows,
      viagens: resViagens.rows,
      pacientes: pacientes
    });

  } catch (erro) {
    console.error('❌ Erro API Hospital:', erro);
    // Retorna o erro detalhado no console para facilitar depuração futura
    return NextResponse.json({ erro: 'Erro interno ao buscar dados do hospital', detalhe: erro.message }, { status: 500 });
  } finally {
    if (client) await client.end();
  }
}