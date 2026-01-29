// app/api/gerar-comprovante-paciente/[codigoViagem]/[cpfPaciente]/route.js
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
  return hora.substring(0, 5).replace(':', 'h');
}

export async function GET(request, { params }) {
  let client;
  
  try {
    const { codigoViagem, cpfPaciente } = params;
    
    if (!codigoViagem || !cpfPaciente) {
      return NextResponse.json(
        { erro: 'Código da viagem e CPF do paciente são obrigatórios' },
        { status: 400 }
      );
    }

    client = await conectarBanco();

    // Limpar CPF (remover formatação)
    const cpfLimpo = cpfPaciente.replace(/\D/g, '');

    // Buscar dados completos do paciente nesta viagem
    const resultado = await client.query(
      `SELECT 
        v.id as viagem_id,
        v.codigo_viagem,
        TO_CHAR(v.data_viagem, 'YYYY-MM-DD') as data_viagem,
        v.horario_saida,
        v.status,
        v.hospital_destino,
        v.endereco_destino,
        -- Paciente
        u.cpf as paciente_cpf,
        u.nome_completo as paciente_nome,
        u.telefone as paciente_telefone,
        u.sexo as paciente_sexo,
        p.cartao_sus,
        -- Dados da viagem-paciente
        vp.motivo,
        vp.horario_consulta,
        vp.observacoes,
        -- Médico
        m_usr.nome_completo as medico_nome,
        med.crm as medico_crm,
        -- Motorista
        mot_usr.nome_completo as motorista_nome,
        mot_usr.telefone as motorista_telefone,
        -- Ônibus
        o.placa as onibus_placa,
        o.modelo as onibus_modelo,
        o.ano as onibus_ano,
        o.cor as onibus_cor,
        -- UBS Destino
        ubs.nome as ubs_destino_nome,
        ubs.endereco as ubs_destino_endereco
      FROM viagens v
      INNER JOIN viagem_pacientes vp ON v.id = vp.viagem_id
      INNER JOIN pacientes p ON vp.paciente_id = p.id
      INNER JOIN usuarios u ON p.usuario_id = u.id
      LEFT JOIN medicos med ON vp.medico_id = med.id
      LEFT JOIN usuarios m_usr ON med.usuario_id = m_usr.id
      LEFT JOIN motoristas mot ON v.motorista_id = mot.id
      LEFT JOIN usuarios mot_usr ON mot.usuario_id = mot_usr.id
      LEFT JOIN onibus o ON v.onibus_id = o.id
      LEFT JOIN ubs ON v.ubs_destino_id = ubs.id
      WHERE v.codigo_viagem = $1 
        AND REPLACE(REPLACE(REPLACE(u.cpf, '.', ''), '-', ''), ' ', '') = $2`,
      [codigoViagem, cpfLimpo]
    );

    if (resultado.rows.length === 0) {
      return NextResponse.json(
        { erro: 'Paciente não encontrado nesta viagem' },
        { status: 404 }
      );
    }

    const dados = resultado.rows[0];

    // Criar PDF
    const doc = new PDFDocument({ 
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });

    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));

    const azulPrimario = '#2563eb';
    const cinzaEscuro = '#1f2937';
    const cinzaClaro = '#6b7280';

    // CABEÇALHO
    doc.rect(0, 0, doc.page.width, 100).fill(azulPrimario);

    doc.fillColor('#ffffff')
       .fontSize(24)
       .font('Helvetica-Bold')
       .text('COMPROVANTE DE VIAGEM', 50, 30, { align: 'center' });

    doc.fontSize(12)
       .font('Helvetica')
       .text('Transporte SUS - Itabaiana/PB', 50, 60, { align: 'center' });

    doc.fontSize(10)
       .text(`Código: ${dados.codigo_viagem}`, 50, 80, { align: 'center' });

    let y = 130;

    // INFORMAÇÕES DO PACIENTE
    doc.fillColor(azulPrimario)
       .fontSize(14)
       .font('Helvetica-Bold')
       .text('DADOS DO PACIENTE', 50, y);

    y += 25;
    doc.rect(50, y - 5, doc.page.width - 100, 120).stroke('#e5e7eb');

    doc.fillColor(cinzaEscuro)
       .fontSize(11)
       .font('Helvetica-Bold')
       .text('Nome:', 60, y);
    doc.font('Helvetica')
       .text(dados.paciente_nome, 150, y);

    y += 20;
    doc.font('Helvetica-Bold')
       .text('CPF:', 60, y);
    doc.font('Helvetica')
       .text(dados.paciente_cpf, 150, y);

    y += 20;
    doc.font('Helvetica-Bold')
       .text('Sexo:', 60, y);
    doc.font('Helvetica')
       .text(dados.paciente_sexo || 'Não informado', 150, y);

    y += 20;
    doc.font('Helvetica-Bold')
       .text('Cartão SUS:', 60, y);
    doc.font('Helvetica')
       .text(dados.cartao_sus, 150, y);

    y += 20;
    doc.font('Helvetica-Bold')
       .text('Telefone:', 60, y);
    doc.font('Helvetica')
       .text(dados.paciente_telefone || 'Não informado', 150, y);

    y += 40;

    // INFORMAÇÕES DA VIAGEM
    doc.fillColor(azulPrimario)
       .fontSize(14)
       .font('Helvetica-Bold')
       .text('INFORMAÇÕES DA VIAGEM', 50, y);

    y += 25;
    doc.rect(50, y - 5, doc.page.width - 100, 140).stroke('#e5e7eb');

    doc.fillColor(cinzaEscuro)
       .fontSize(11)
       .font('Helvetica-Bold')
       .text('Data da Viagem:', 60, y);
    doc.font('Helvetica')
       .text(formatarData(dados.data_viagem), 200, y);

    y += 20;
    doc.font('Helvetica-Bold')
       .text('Horário de Saída:', 60, y);
    doc.font('Helvetica')
       .text(formatarHora(dados.horario_saida), 200, y);

    y += 20;
    if (dados.horario_consulta) {
      doc.font('Helvetica-Bold')
         .text('Horário da Consulta:', 60, y);
      doc.font('Helvetica')
         .text(formatarHora(dados.horario_consulta), 200, y);
      y += 20;
    }

    doc.font('Helvetica-Bold')
       .text('Motivo:', 60, y);
    doc.font('Helvetica')
       .text(dados.motivo || 'Não informado', 200, y, { width: 300 });

    y += 20;
    doc.font('Helvetica-Bold')
       .text('Destino:', 60, y);
    doc.font('Helvetica')
       .text(dados.ubs_destino_nome || dados.hospital_destino, 200, y, { width: 300 });

    y += 20;
    doc.font('Helvetica-Bold')
       .text('Endereço:', 60, y);
    doc.font('Helvetica')
       .text(dados.ubs_destino_endereco || dados.endereco_destino || '-', 200, y, { width: 300 });

    y += 20;
    if (dados.medico_nome) {
      doc.font('Helvetica-Bold')
         .text('Médico:', 60, y);
      doc.font('Helvetica')
         .text(`${dados.medico_nome} (CRM: ${dados.medico_crm || '-'})`, 200, y, { width: 300 });
      y += 20;
    }

    y += 20;

    // MOTORISTA E VEÍCULO
    if (dados.motorista_nome || dados.onibus_placa) {
      doc.fillColor(azulPrimario)
         .fontSize(14)
         .font('Helvetica-Bold')
         .text('MOTORISTA E VEÍCULO', 50, y);
      
      y += 25;
      const alturaBox = (dados.motorista_nome ? 60 : 0) + (dados.onibus_placa ? 60 : 0);
      doc.rect(50, y - 5, doc.page.width - 100, alturaBox).stroke('#e5e7eb');
      
      if (dados.motorista_nome) {
        doc.fillColor(cinzaEscuro)
           .fontSize(11)
           .font('Helvetica-Bold')
           .text('Motorista:', 60, y);
        doc.font('Helvetica')
           .text(dados.motorista_nome, 200, y);
        
        y += 20;
        doc.font('Helvetica-Bold')
           .text('Telefone:', 60, y);
        doc.font('Helvetica')
           .text(dados.motorista_telefone || 'Não informado', 200, y);
        
        y += 20;
      }
      
      if (dados.onibus_placa) {
        doc.font('Helvetica-Bold')
           .text('Ônibus:', 60, y);
        doc.font('Helvetica')
           .text(`Placa: ${dados.onibus_placa}`, 200, y);
        
        y += 20;
        doc.font('Helvetica-Bold')
           .text('Modelo/Cor:', 60, y);
        doc.font('Helvetica')
           .text(`${dados.onibus_modelo || '-'} - ${dados.onibus_cor || '-'} (${dados.onibus_ano || '-'})`, 200, y);
        
        y += 20;
      }
    }

    // RODAPÉ
    const rodapeY = doc.page.height - 80;
    doc.rect(0, rodapeY, doc.page.width, 80).fill('#f3f4f6');

    doc.fillColor(cinzaClaro)
       .fontSize(9)
       .font('Helvetica')
       .text('Este comprovante é válido para apresentação junto ao motorista', 50, rodapeY + 20, { align: 'center' });

    doc.fontSize(8)
       .text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 50, rodapeY + 40, { align: 'center' });

    doc.fontSize(8)
       .fillColor(azulPrimario)
       .text('Prefeitura Municipal de Itabaiana - Secretaria de Saúde', 50, rodapeY + 55, { align: 'center' });

    doc.end();

    await new Promise((resolve) => {
      doc.on('end', resolve);
    });

    const pdfBuffer = Buffer.concat(chunks);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Comprovante-${dados.paciente_nome.replace(/\s+/g, '-')}-${dados.codigo_viagem}.pdf"`,
      },
    });

  } catch (erro) {
    console.error('Erro ao gerar comprovante:', erro);
    
    return NextResponse.json(
      { erro: 'Erro ao gerar comprovante do paciente' },
      { status: 500 }
    );
    
  } finally {
    if (client) {
      await client.end();
    }
  }
}