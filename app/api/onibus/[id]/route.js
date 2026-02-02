///app/api/onibus/[id]/route.js
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
    const { id } = await params;
    console.log(`>>> Buscando ônibus ID: ${id}`); // ✅ Mantive seu log

    if (!id) {
      return NextResponse.json(
        { erro: 'ID do ônibus é obrigatório' },
        { status: 400 }
      );
    }

    client = await conectarBanco();

    // 1. BUSCAR DADOS DO ÔNIBUS
    const queryOnibus = `
      SELECT 
        id,
        placa,
        modelo,
        ano,
        capacidade_passageiros,
        cor,
        disponivel,
        created_at,
        updated_at
      FROM onibus
      WHERE id = $1
    `;

    const resultadoOnibus = await client.query(queryOnibus, [parseInt(id)]);

    if (resultadoOnibus.rows.length === 0) {
      console.log('>>> Ônibus não encontrado no banco.'); // ✅ Mantive seu log
      return NextResponse.json(
        { erro: 'Ônibus não encontrado' },
        { status: 404 }
      );
    }

    const onibus = resultadoOnibus.rows[0];
    console.log('>>> Ônibus encontrado:', onibus.placa); // ✅ Mantive seu log

    // 2. BUSCAR VIAGENS DESTE ÔNIBUS (COM INFORMAÇÕES COMPLETAS)
    const queryViagens = `
      SELECT 
        v.id,
        v.codigo_viagem,
        TO_CHAR(v.data_viagem, 'YYYY-MM-DD') as data_viagem,
        v.horario_saida,
        v.status,
        v.hospital_destino,
        
        -- Motorista (COM JOIN NAS TABELAS CORRETAS)
        mot_usr.nome_completo as motorista_nome,
        mot_usr.cpf as motorista_cpf,
        mot_usr.telefone as motorista_telefone,
        mot.cnh as motorista_cnh,
        
        -- Total de passageiros (CONTA OS REGISTROS EM viagem_pacientes)
        COUNT(vp.id) as total_passageiros
        
      FROM viagens v
      LEFT JOIN motoristas mot ON v.motorista_id = mot.id
      LEFT JOIN usuarios mot_usr ON mot.usuario_id = mot_usr.id
      LEFT JOIN viagem_pacientes vp ON v.id = vp.viagem_id
      
      WHERE v.onibus_id = $1
      GROUP BY v.id, v.codigo_viagem, v.data_viagem, v.horario_saida, 
               v.status, v.hospital_destino, 
               mot_usr.nome_completo, mot_usr.cpf, mot_usr.telefone, mot.cnh
      ORDER BY v.data_viagem DESC, v.horario_saida DESC
      LIMIT 50
    `;

    const resultadoViagens = await client.query(queryViagens, [parseInt(id)]);
    console.log(`>>> ${resultadoViagens.rows.length} viagens encontradas.`); // ✅ Mantive seu log

    return NextResponse.json(
      { 
        onibus: onibus,
        viagens: resultadoViagens.rows
      },
      { status: 200 }
    );

  } catch (erro) {
    console.error('❌ ERRO ao buscar dados do ônibus:', erro.message); // ✅ Melhorei o log
    
    return NextResponse.json(
      { erro: 'Erro ao buscar dados do ônibus', detalhes: erro.message },
      { status: 500 }
    );
    
  } finally {
    if (client) {
      await client.end();
    }
  }
}