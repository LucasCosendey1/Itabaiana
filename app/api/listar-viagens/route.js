// app/api/listar-viagens/route.js
import { NextResponse } from 'next/server';
import { Client } from 'pg';

async function conectarBanco() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  await client.connect();
  return client;
}

export async function GET(request) {
  let client;
  
  try {
    client = await conectarBanco();

    const resultado = await client.query(
      `SELECT 
        v.id as viagem_id,
        v.codigo_viagem,
        TO_CHAR(v.data_viagem, 'YYYY-MM-DD') as data_viagem,
        v.horario_saida,
        v.status,
        v.hospital_destino,
        v.numero_vagas,
        v.confirmado_em,
        -- Motorista
        mot_usr.nome_completo as motorista_nome,
        mot.cnh as motorista_cnh,
        -- Ônibus (Join adicionado)
        o.placa as onibus_placa,
        o.modelo as onibus_modelo,
        o.cor as onibus_cor,
        -- UBS Destino
        ubs.id as ubs_destino_id,
        ubs.nome as ubs_destino_nome,
        -- Contagem de pacientes
        (SELECT COUNT(*) FROM viagem_pacientes vp WHERE vp.viagem_id = v.id) as total_pacientes
      FROM viagens v
      LEFT JOIN motoristas mot ON v.motorista_id = mot.id
      LEFT JOIN usuarios mot_usr ON mot.usuario_id = mot_usr.id
      LEFT JOIN onibus o ON v.onibus_id = o.id
      LEFT JOIN ubs ON v.ubs_destino_id = ubs.id
      ORDER BY v.data_viagem DESC, v.horario_saida DESC`
    );

    return NextResponse.json(
      { viagens: resultado.rows },
      { status: 200 }
    );

  } catch (erro) {
    console.error('Erro ao listar viagens:', erro);
    
    return NextResponse.json(
      { erro: 'Erro ao listar viagens' },
      { status: 500 }
    );
    
  } finally {
    if (client) {
      await client.end();
    }
  }
}