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
    const { id, pacienteId } = await params; // id = viagem_id

    client = await conectarBanco();

    // Busca dados do paciente + status específico nesta viagem
    const query = `
      SELECT 
        vp.id as vinculo_id,
        vp.compareceu,
        vp.motivo as motivo_viagem,
        vp.acompanhante,
        vp.vai_acompanhado,
        
        -- Dados do Paciente
        p.id as paciente_id,
        p.data_nascimento,
        p.tipo_sanguineo,
        p.alergias,
        p.observacoes_medicas,
        p.cartao_sus,
        p.nome_mae,
        
        -- Dados do Usuário
        u.nome_completo,
        u.cpf,
        u.telefone,
        u.endereco,
        u.cep,
        u.sexo,
        
        -- Dados da Viagem (para contexto)
        v.codigo_viagem,
        v.hospital_destino,
        ubs.nome as ubs_destino_nome

      FROM viagem_pacientes vp
      INNER JOIN pacientes p ON vp.paciente_id = p.id
      INNER JOIN usuarios u ON p.usuario_id = u.id
      INNER JOIN viagens v ON vp.viagem_id = v.id
      LEFT JOIN ubs ON v.ubs_destino_id = ubs.id
      WHERE vp.viagem_id = $1 AND vp.paciente_id = $2
    `;

    const resultado = await client.query(query, [id, pacienteId]);

    if (resultado.rows.length === 0) {
      return NextResponse.json({ erro: 'Vínculo não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ dados: resultado.rows[0] }, { status: 200 });

  } catch (error) {
    console.error('Erro API Check-in:', error);
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 });
  } finally {
    if (client) await client.end();
  }
}