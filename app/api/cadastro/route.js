// app/api/cadastro/route.js
import { NextResponse } from 'next/server';
import { Client } from 'pg';
import bcrypt from 'bcryptjs';

/**
 * API ROUTE PARA CADASTRO DE NOVOS USUÁRIOS
 * Suporta cadastro de Administradores e Pacientes
 */

// Conexão com o banco de dados
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
    // Parse do body
    const dados = await request.json();
    
    // Validações básicas
    if (!dados.tipo_usuario || !dados.cpf || !dados.email || !dados.senha) {
      return NextResponse.json(
        { erro: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      );
    }

    // Validar campo SEXO (obrigatório)
    if (!dados.sexo || !['Masculino', 'Feminino', 'Outro'].includes(dados.sexo)) {
      return NextResponse.json(
        { erro: 'Sexo é obrigatório e deve ser Masculino, Feminino ou Outro' },
        { status: 400 }
      );
    }

    // Verificar se é um tipo permitido para cadastro público
    if (!['administrador', 'paciente'].includes(dados.tipo_usuario)) {
      return NextResponse.json(
        { erro: 'Tipo de usuário não permitido para cadastro público' },
        { status: 400 }
      );
    }

    // Conectar ao banco
    client = await conectarBanco();

    // Verificar se CPF já existe
    const cpfExistente = await client.query(
      'SELECT id FROM usuarios WHERE cpf = $1',
      [dados.cpf]
    );

    if (cpfExistente.rows.length > 0) {
      return NextResponse.json(
        { erro: 'CPF já cadastrado no sistema' },
        { status: 400 }
      );
    }

    // Verificar se email já existe
    const emailExistente = await client.query(
      'SELECT id FROM usuarios WHERE email = $1',
      [dados.email]
    );

    if (emailExistente.rows.length > 0) {
      return NextResponse.json(
        { erro: 'E-mail já cadastrado no sistema' },
        { status: 400 }
      );
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(dados.senha, 10);

    // Iniciar transação
    await client.query('BEGIN');

    try {
      // Inserir usuário base
      const resultUsuario = await client.query(
        `INSERT INTO usuarios 
        (cpf, nome_completo, email, telefone, senha_hash, endereco, cep, tipo_usuario, sexo) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
        RETURNING id`,
        [
          dados.cpf,
          dados.nome_completo,
          dados.email,
          dados.telefone,
          senhaHash,
          dados.endereco,
          dados.cep,
          dados.tipo_usuario,
          dados.sexo
        ]
      );
      const usuarioId = resultUsuario.rows[0].id;

      // Inserir dados específicos baseado no tipo
      if (dados.tipo_usuario === 'paciente') {
        // Validar campos obrigatórios do paciente
        if (!dados.paciente || !dados.paciente.cartao_sus || !dados.paciente.nome_mae || !dados.paciente.data_nascimento) {
          throw new Error('Dados obrigatórios do paciente não fornecidos');
        }

        // Verificar se Cartão SUS já existe
        const susExistente = await client.query(
          'SELECT id FROM pacientes WHERE cartao_sus = $1',
          [dados.paciente.cartao_sus]
        );

        if (susExistente.rows.length > 0) {
          throw new Error('Cartão SUS já cadastrado no sistema');
        }

        await client.query(
          `INSERT INTO pacientes 
          (usuario_id, cartao_sus, nome_pai, nome_mae, data_nascimento, ubs_cadastro_id, agente_id, microarea, responsavel_familiar) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            usuarioId,
            dados.paciente.cartao_sus,
            dados.paciente.nome_pai || null,
            dados.paciente.nome_mae,
            dados.paciente.data_nascimento,
            dados.paciente.ubs_cadastro_id || null,
            dados.paciente.agente_id || null,
            dados.paciente.microarea || null,
            dados.paciente.responsavel_familiar || false
          ]
        );
      } // <--- FECHAMENTO DE CHAVES ADICIONADO AQUI
      
      else if (dados.tipo_usuario === 'administrador') {
        // Validar campos obrigatórios do administrador
        if (!dados.administrador || !dados.administrador.cargo) {
          throw new Error('Dados obrigatórios do administrador não fornecidos');
        }

        await client.query(
          `INSERT INTO administradores 
           (usuario_id, cargo, nivel_acesso, setor) 
           VALUES ($1, $2, $3, $4)`,
          [
            usuarioId,
            dados.administrador.cargo,
            1, // Nível de acesso básico por padrão
            'Geral' // Setor padrão
          ]
        );
      }

      // Commit da transação
      await client.query('COMMIT');

      // Retornar sucesso
      return NextResponse.json(
        {
          mensagem: 'Cadastro realizado com sucesso',
          usuario_id: usuarioId,
          tipo_usuario: dados.tipo_usuario
        },
        { status: 201 }
      );

    } catch (erro) {
      // Rollback em caso de erro
      await client.query('ROLLBACK');
      throw erro;
    }

  } catch (erro) {
    console.error('Erro ao processar cadastro:', erro);
    
    return NextResponse.json(
      { erro: erro.message || 'Erro ao processar cadastro' },
      { status: 500 }
    );
    
  } finally {
    // Fechar conexão
    if (client) {
      await client.end();
    }
  }
}