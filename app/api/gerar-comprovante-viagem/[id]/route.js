// app/api/gerar-comprovante-viagem/[id]/route.js
import { NextResponse } from 'next/server';
import { Client } from 'pg';
import PDFDocument from 'pdfkit';

async function conectarBanco() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  await client.connect();
  return client;
}

function formatarData(data) {
  if (!data) return '';
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
}

function formatarHora(hora) {
  if (!hora) return '';
  return hora.replace(':', 'h');
}

export async function GET(request, { params }) {
  let client;
  
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { erro: 'ID da viagem é obrigatório' },
        { status: 400 }
      );
    }

    client = await conectarBanco();

    // Buscar viagem
    const viagemResult = await client.query(
      `SELECT 
        v.id as viagem_id,
        v.codigo_viagem,
        TO_CHAR(v.data_viagem, 'YYYY-MM-DD') as data_viagem,
        v.horario_saida,
        v.status,
        v.hospital_destino,
        v.endereco_destino,
        -- Motorista
        mot_usr.nome_completo as motorista_nome,
        mot_usr.telefone as motorista_telefone,
        -- Ônibus
        o.placa as onibus_placa,
        o.modelo as onibus_modelo,
        o.cor as onibus_cor,
        -- UBS Destino
        ubs.nome as ubs_destino_nome,
        ubs.endereco as ubs_destino_endereco
      FROM viagens v
      LEFT JOIN motoristas mot ON v.motorista_id = mot.id
      LEFT JOIN usuarios mot_usr ON mot.usuario_id = mot_usr.id
      LEFT JOIN onibus o ON v.onibus_id = o.id
      LEFT JOIN ubs ON v.ubs_destino_id = ubs.id
      WHERE v.codigo_viagem = $1`,
      [id]
    );

    if (viagemResult.rows.length === 0) {
      return NextResponse.json(
        { erro: 'Viagem não encontrada' },
        { status: 404 }
      );
    }

    const viagem = viagemResult.rows[0];

    // Buscar pacientes
    const pacientesResult = await client.query(
      `SELECT 
        u.cpf,
        u.nome_completo,
        u.telefone,
        u.sexo,
        vp.motivo,
        vp.horario_consulta,
        -- Médico
        m_usr.nome_completo as medico_nome,
        med.crm as medico_crm
      FROM viagem_pacientes vp
      INNER JOIN pacientes p ON vp.paciente_id = p.id
      INNER JOIN usuarios u ON p.usuario_id = u.id
      LEFT JOIN medicos med ON vp.medico_id = med.id
      LEFT JOIN usuarios m_usr ON med.usuario_id = m_usr.id
      WHERE vp.viagem_id = $1
      ORDER BY u.nome_completo`,
      [viagem.viagem_id]
    );

    // Criar PDF
    const doc = new PDFDocument({ 
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });

    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));

    const azulPrimario = '#2563eb';
    const cinzaEscuro = '#1f2937';

    // CABEÇALHO
    doc.rect(0, 0, doc.page.width, 100).fill(azulPrimario);
    
    doc.fillColor('#ffffff')
       .fontSize(24)
       .font('Helvetica-Bold')
       .text('LISTA DE PASSAGEIROS', 50, 30, { align: 'center' });
    
    doc.fontSize(12)
       .font('Helvetica')
       .text('Transporte SUS - Itabaiana/PB', 50, 60, { align: 'center' });

    doc.fontSize(10)
       .text(`Código: ${viagem.codigo_viagem}`, 50, 80, { align: 'center' });

    let y = 130;

    // INFORMAÇÕES DA VIAGEM
    doc.fillColor(azulPrimario)
       .fontSize(14)
       .font('Helvetica-Bold')
       .text('INFORMAÇÕES DA VIAGEM', 50, y);
    
    y += 25;
    doc.rect(50, y - 5, doc.page.width - 100, 120).stroke('#e5e7eb');
    
    doc.fillColor(cinzaEscuro).fontSize(11).font('Helvetica-Bold').text('Data:', 60, y);
    doc.font('Helvetica').text(formatarData(viagem.data_viagem), 200, y);
    
    y += 20;
    doc.font('Helvetica-Bold').text('Horário de Saída:', 60, y);
    doc.font('Helvetica').text(formatarHora(viagem.horario_saida), 200, y);
    
    y += 20;
    doc.font('Helvetica-Bold').text('Destino:', 60, y);
    doc.font('Helvetica').text(viagem.ubs_destino_nome || viagem.hospital_destino, 200, y, { width: 300 });
    
    y += 20;
    doc.font('Helvetica-Bold').text('Endereço:', 60, y);
    doc.font('Helvetica').text(viagem.ubs_destino_endereco || viagem.endereco_destino || '-', 200, y, { width: 300 });

    y += 20;
    if (viagem.motorista_nome) {
      doc.font('Helvetica-Bold').text('Motorista:', 60, y);
      doc.font('Helvetica').text(`${viagem.motorista_nome} - ${viagem.motorista_telefone || 'Sem telefone'}`, 200, y, { width: 300 });
    }

    y += 20;
    if (viagem.onibus_placa) {
      doc.font('Helvetica-Bold').text('Ônibus:', 60, y);
      doc.font('Helvetica').text(`${viagem.onibus_placa} - ${viagem.onibus_modelo} (${viagem.onibus_cor})`, 200, y, { width: 300 });
    }

    y += 40;

    // LISTA DE PACIENTES
    doc.fillColor(azulPrimario)
       .fontSize(14)
       .font('Helvetica-Bold')
       .text(`LISTA DE PACIENTES (${pacientesResult.rows.length})`, 50, y);
    
    y += 25;

    pacientesResult.rows.forEach((paciente, index) => {
      if (y > 700) {
        doc.addPage();
        y = 50;
      }

      doc.rect(50, y - 5, doc.page.width - 100, 90).stroke('#e5e7eb');
      
      doc.fillColor(cinzaEscuro).fontSize(12).font('Helvetica-Bold').text(`${index + 1}. ${paciente.nome_completo}`, 60, y);
      
      y += 20;
      doc.fontSize(10).font('Helvetica').text(`CPF: ${paciente.cpf} | Sexo: ${paciente.sexo || '-'} | Tel: ${paciente.telefone || '-'}`, 60, y);
      
      y += 15;
      doc.text(`Motivo: ${paciente.motivo || 'Não informado'}`, 60, y);
      
      y += 15;
      if (paciente.medico_nome) {
        doc.text(`Médico: ${paciente.medico_nome} (CRM: ${paciente.medico_crm || '-'})`, 60, y);
      } else {
        doc.text('Médico: Não informado', 60, y);
      }

      y += 25;
    });

    // RODAPÉ
    const rodapeY = doc.page.height - 80;
    doc.rect(0, rodapeY, doc.page.width, 80).fill('#f3f4f6');
    
    doc.fillColor('#6b7280')
       .fontSize(9)
       .font('Helvetica')
       .text('Este documento é válido para controle administrativo', 50, rodapeY + 20, { align: 'center' });
    
    doc.fontSize(8)
       .text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 50, rodapeY + 40, { align: 'center' });

    doc.end();

    await new Promise((resolve) => {
      doc.on('end', resolve);
    });

    const pdfBuffer = Buffer.concat(chunks);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Lista-Passageiros-${viagem.codigo_viagem}.pdf"`,
      },
    });

  } catch (erro) {
    console.error('Erro ao gerar lista:', erro);
    
    return NextResponse.json(
      { erro: 'Erro ao gerar lista de passageiros' },
      { status: 500 }
    );
    
  } finally {
    if (client) {
      await client.end();
    }
  }
}