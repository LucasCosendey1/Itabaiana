// app/api/criar-viagem/route.js
import { NextResponse } from 'next/server';
import { Client } from 'pg';

async function conectarBanco() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  await client.connect();
  return client;
}

function gerarCodigoViagem() {
  const timestamp = Date.now().toString().slice(-6);
  return `V${timestamp}`;
}

// ATENÇÃO: O nome da função DEVE ser POST e NÃO pode ter "default"
export async function POST(request) {
  let client;
  
  try {
    const dados = await request.json();
    
    // Validações básicas
    if (!dados.hospital_destino && !dados.ubs_destino_id) {
      return NextResponse.json(
        { erro: 'Informe o hospital de destino ou a UBS de destino' },
        { status: 400 }
      );
    }

    if (!dados.numero_vagas || dados.numero_vagas < 1) {
      return NextResponse.json(
        { erro: 'Número de vagas deve ser maior que zero' },
        { status: 400 }
      );
    }

    client = await conectarBanco();

    // --- LÓGICA PARA EVITAR ERRO DE NOT-NULL ---
    let nomeDestinoFinal = dados.hospital_destino;
    let enderecoDestinoFinal = dados.endereco_destino;

    // Se não veio nome do hospital, mas veio UBS, buscamos o nome da UBS
    if (!nomeDestinoFinal && dados.ubs_destino_id) {
      const ubsResult = await client.query(
        'SELECT nome, endereco FROM ubs WHERE id = $1', 
        [dados.ubs_destino_id]
      );

      if (ubsResult.rows.length > 0) {
        nomeDestinoFinal = ubsResult.rows[0].nome;
        if (!enderecoDestinoFinal) {
            enderecoDestinoFinal = ubsResult.rows[0].endereco || ubsResult.rows[0].nome;
        }
      } else {
        nomeDestinoFinal = "UBS Destino (ID: " + dados.ubs_destino_id + ")";
      }
    }
    // -------------------------------------------

    // Gerar código único para a viagem
    const codigoViagem = gerarCodigoViagem();

    // Inserir viagem
    const resultado = await client.query(
      `INSERT INTO viagens 
      (codigo_viagem, motorista_id, onibus_id, hospital_destino, endereco_destino, ubs_destino_id, data_viagem, horario_saida, numero_vagas, status) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pendente') 
      RETURNING id, codigo_viagem`,
      [
        codigoViagem,
        dados.motorista_id || null,
        dados.onibus_id || null,
        nomeDestinoFinal, // Garante que não é NULL
        enderecoDestinoFinal || nomeDestinoFinal, 
        dados.ubs_destino_id || null,
        dados.data_viagem,
        dados.horario_saida,
        dados.numero_vagas
      ]
    );

    return NextResponse.json(
      {
        mensagem: 'Viagem criada com sucesso',
        viagem: {
          id: resultado.rows[0].id,
          codigo_viagem: resultado.rows[0].codigo_viagem
        }
      },
      { status: 201 }
    );

  } catch (erro) {
    console.error('Erro ao criar viagem:', erro);
    
    return NextResponse.json(
      { erro: erro.message || 'Erro ao criar viagem' },
      { status: 500 }
    );
    
  } finally {
    if (client) {
      await client.end();
    }
  }
}