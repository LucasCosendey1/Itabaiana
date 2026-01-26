// app/api/login/route.js
import { NextResponse } from 'next/server';
import { Client } from 'pg';
import bcrypt from 'bcryptjs';

/**
 * API ROUTE PARA LOGIN DE USUÁRIOS
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
    const { cpf, senha } = await request.json();
    
    // Validações básicas
    if (!cpf || !senha) {
      return NextResponse.json(
        { erro: 'CPF e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Conectar ao banco
    client = await conectarBanco();

    // Buscar usuário por CPF
    const resultado = await client.query(
      `SELECT id, cpf, nome_completo, email, tipo_usuario, senha_hash, ativo 
       FROM usuarios 
       WHERE cpf = $1`,
      [cpf]
    );

    // Verificar se usuário existe
    if (resultado.rows.length === 0) {
      return NextResponse.json(
        { erro: 'CPF ou senha incorretos' },
        { status: 401 }
      );
    }

    const usuario = resultado.rows[0];

    // Verificar se usuário está ativo
    if (!usuario.ativo) {
      return NextResponse.json(
        { erro: 'Usuário inativo. Entre em contato com o administrador.' },
        { status: 403 }
      );
    }

    // Verificar senha
    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
    
    if (!senhaValida) {
      return NextResponse.json(
        { erro: 'CPF ou senha incorretos' },
        { status: 401 }
      );
    }

    // Remover senha_hash antes de retornar
    delete usuario.senha_hash;

    // Login bem-sucedido
    return NextResponse.json(
      {
        mensagem: 'Login realizado com sucesso',
        usuario: {
          id: usuario.id,
          cpf: usuario.cpf,
          nome_completo: usuario.nome_completo,
          email: usuario.email,
          tipo_usuario: usuario.tipo_usuario
        }
      },
      { status: 200 }
    );

  } catch (erro) {
    console.error('Erro ao processar login:', erro);
    
    return NextResponse.json(
      { erro: 'Erro ao processar login' },
      { status: 500 }
    );
    
  } finally {
    // Fechar conexão
    if (client) {
      await client.end();
    }
  }
}