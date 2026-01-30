// app/api/cadastrar-hospital/route.js
import { NextResponse } from 'next/server';
import { Client } from 'pg';

async function conectarBanco() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  await client.connect();
  return client;
}

export async function POST(request) {
  let client;
  
  try {
    const dados = await request.json();
    
    // Validações
    if (!dados.nome || !dados.endereco || !dados.cep || !dados.telefone) {
      return NextResponse.json(
        { erro: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      );
    }

    if (dados.tipo === 'hospital' && !dados.cnpj) {
      return NextResponse.json(
        { erro: 'CNPJ é obrigatório para hospitais' },
        { status: 400 }
      );
    }

    client = await conectarBanco();

    // Verificar se nome já existe
    const nomeExistente = await client.query(
      'SELECT id FROM ubs WHERE nome = $1',
      [dados.nome]
    );

    if (nomeExistente.rows.length > 0) {
      return NextResponse.json(
        { erro: 'Já existe uma unidade cadastrada com este nome' },
        { status: 400 }
      );
    }

    await client.query('BEGIN');

    try {
      // Inserir UBS/Hospital
      const resultado = await client.query(
        `INSERT INTO ubs 
         (nome, endereco, cep, telefone, email, responsavel, horario_funcionamento, tipo, cnpj, tipo_atendimento, especialidades) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
         RETURNING id`,
        [
          dados.nome,
          dados.endereco,
          dados.cep,
          dados.telefone,
          dados.email,
          dados.responsavel,
          dados.horario_funcionamento,
          dados.tipo,
          dados.cnpj,
          dados.tipo_atendimento,
          dados.especialidades
        ]
      );

      const ubsId = resultado.rows[0].id;

      // Inserir vínculos de médicos
      if (dados.medicos_vinculados && dados.medicos_vinculados.length > 0) {
        for (const vinculo of dados.medicos_vinculados) {
          await client.query(
            `INSERT INTO medico_vinculos 
             (medico_id, ubs_id, atuacao, dias_atendimento, horario_atendimento) 
             VALUES ($1, $2, $3, $4, $5)`,
            [
              vinculo.medico_id,
              ubsId,
              vinculo.atuacao,
              vinculo.dias_atendimento,
              vinculo.horario_atendimento
            ]
          );
        }
      }

      await client.query('COMMIT');

      return NextResponse.json(
        {
          mensagem: `${dados.tipo === 'ubs' ? 'UBS' : 'Hospital'} cadastrado com sucesso`,
          id: ubsId
        },
        { status: 201 }
      );

    } catch (erro) {
      await client.query('ROLLBACK');
      throw erro;
    }

  } catch (erro) {
    console.error('Erro ao cadastrar hospital/UBS:', erro);
    
    return NextResponse.json(
      { erro: erro.message || 'Erro ao cadastrar hospital/UBS' },
      { status: 500 }
    );
    
  } finally {
    if (client) {
      await client.end();
    }
  }
}