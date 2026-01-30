// PATCH para atualizar campos da viagem
import { NextResponse } from 'next/server';
import { Client } from 'pg';

async function conectarBanco() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  await client.connect();
  return client;
}

export async function PATCH(request, { params }) {
  let client;
  
  try {
    const { id } = params;
    const dados = await request.json();
    
    client = await conectarBanco();

    // Construir query dinamicamente baseado nos campos enviados
    const campos = [];
    const valores = [];
    let index = 1;

    if (dados.motorista_id !== undefined) {
      campos.push(`motorista_id = $${index}`);
      valores.push(dados.motorista_id);
      index++;
    }

    if (dados.onibus_id !== undefined) {
      campos.push(`onibus_id = $${index}`);
      valores.push(dados.onibus_id);
      index++;
    }

    if (dados.ubs_destino_id !== undefined) {
      campos.push(`ubs_destino_id = $${index}`);
      valores.push(dados.ubs_destino_id);
      index++;
    }

    if (dados.hospital_destino !== undefined) {
      campos.push(`hospital_destino = $${index}`);
      valores.push(dados.hospital_destino);
      index++;
    }

    if (dados.endereco_destino !== undefined) {
      campos.push(`endereco_destino = $${index}`);
      valores.push(dados.endereco_destino);
      index++;
    }

    if (dados.data_viagem !== undefined) {
      campos.push(`data_viagem = $${index}`);
      valores.push(dados.data_viagem);
      index++;
    }

    if (dados.horario_saida !== undefined) {
      campos.push(`horario_saida = $${index}`);
      valores.push(dados.horario_saida);
      index++;
    }

    if (campos.length === 0) {
      return NextResponse.json(
        { erro: 'Nenhum campo para atualizar' },
        { status: 400 }
      );
    }

    valores.push(id);
    const query = `UPDATE viagens SET ${campos.join(', ')}, data_atualizacao = CURRENT_TIMESTAMP WHERE codigo_viagem = $${index} RETURNING id`;

    await client.query(query, valores);

    return NextResponse.json(
      { mensagem: 'Viagem atualizada com sucesso' },
      { status: 200 }
    );

  } catch (erro) {
    console.error('Erro ao atualizar viagem:', erro);
    return NextResponse.json(
      { erro: 'Erro ao atualizar viagem' },
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.end();
    }
  }
}