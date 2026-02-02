// app/api/login/route.js
import { NextResponse } from 'next/server';
import { Client } from 'pg';
import bcrypt from 'bcryptjs';

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
    const { cpf, senha } = await request.json();
    
    if (!cpf || !senha) {
      return NextResponse.json(
        { erro: 'CPF e senha são obrigatórios' },
        { status: 400 }
      );
    }

    client = await conectarBanco();

    // 1. Buscar usuário por CPF
    const resultado = await client.query(
      `SELECT id, cpf, nome_completo, email, tipo_usuario, senha_hash, ativo 
       FROM usuarios 
       WHERE cpf = $1`,
      [cpf]
    );

    if (resultado.rows.length === 0) {
      return NextResponse.json(
        { erro: 'CPF ou senha incorretos' },
        { status: 401 }
      );
    }

    const usuario = resultado.rows[0];

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

    // ✅ 2. BUSCAR ID ESPECÍFICO BASEADO NO TIPO DE USUÁRIO
    let idEspecifico = null;

    if (usuario.tipo_usuario === 'motorista') {
      const resMotorista = await client.query(
        `SELECT id FROM motoristas WHERE usuario_id = $1`,
        [usuario.id]
      );
      if (resMotorista.rows.length > 0) {
        idEspecifico = resMotorista.rows[0].id;
      }
    } else if (usuario.tipo_usuario === 'medico') {
      const resMedico = await client.query(
        `SELECT id FROM medicos WHERE usuario_id = $1`,
        [usuario.id]
      );
      if (resMedico.rows.length > 0) {
        idEspecifico = resMedico.rows[0].id;
      }
    } else if (usuario.tipo_usuario === 'paciente') {
      const resPaciente = await client.query(
        `SELECT id FROM pacientes WHERE usuario_id = $1`,
        [usuario.id]
      );
      if (resPaciente.rows.length > 0) {
        idEspecifico = resPaciente.rows[0].id;
      }
    } else if (usuario.tipo_usuario === 'administrador') {
      const resAdmin = await client.query(
        `SELECT id FROM administradores WHERE usuario_id = $1`,
        [usuario.id]
      );
      if (resAdmin.rows.length > 0) {
        idEspecifico = resAdmin.rows[0].id;
      }
    }

    // ✅ 3. MONTAR RESPOSTA COM TODOS OS IDs NECESSÁRIOS
    const dadosUsuario = {
      id: usuario.id,
      cpf: usuario.cpf,
      nome_completo: usuario.nome_completo,
      email: usuario.email,
      tipo_usuario: usuario.tipo_usuario
    };

    // Adicionar ID específico baseado no tipo
    if (idEspecifico) {
      if (usuario.tipo_usuario === 'motorista') {
        dadosUsuario.motorista_id = idEspecifico;
      } else if (usuario.tipo_usuario === 'medico') {
        dadosUsuario.medico_id = idEspecifico;
      } else if (usuario.tipo_usuario === 'paciente') {
        dadosUsuario.paciente_id = idEspecifico;
      } else if (usuario.tipo_usuario === 'administrador') {
        dadosUsuario.administrador_id = idEspecifico;
      }
    }

    console.log('✅ Login bem-sucedido:', dadosUsuario);

    return NextResponse.json(
      {
        mensagem: 'Login realizado com sucesso',
        usuario: dadosUsuario
      },
      { status: 200 }
    );

  } catch (erro) {
    console.error('❌ Erro ao processar login:', erro.message);
    
    return NextResponse.json(
      { erro: 'Erro ao processar login', detalhes: erro.message },
      { status: 500 }
    );
    
  } finally {
    if (client) {
      await client.end();
    }
  }
}