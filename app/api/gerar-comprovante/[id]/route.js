// app/api/gerar-comprovante/[id]/route.js
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

    // Buscar informações completas da viagem
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
        p_usr.cpf as paciente_cpf,
        p_usr.nome_completo as paciente_nome,
        p_usr.telefone as paciente_telefone,
        pac.cartao_sus,
        -- Informações da viagem-paciente
        vp.motivo,
        vp.horario_consulta,
        -- Médico
        m_usr.nome_completo as medico_nome,
        med.crm as medico_crm,
        -- Motorista
        mot_usr.nome_completo as motorista_nome,
        mot_usr.telefone as motorista_telefone,
        mot.cnh as motorista_cnh,
        mot.veiculo_placa as motorista_veiculo,
        mot.veiculo_modelo as motorista_veiculo_modelo,
        -- Ônibus
        o.placa as onibus_placa,
        o.modelo as onibus_modelo,
        o.ano as onibus_ano
      FROM viagens v
      INNER JOIN viagem_pacientes vp ON v.id = vp.viagem_id
      INNER JOIN pacientes pac ON vp.paciente_id = pac.id
      INNER JOIN usuarios p_usr ON pac.usuario_id = p_usr.id
      LEFT JOIN medicos med ON vp.medico_id = med.id
      LEFT JOIN usuarios m_usr ON med.usuario_id = m_usr.id
      LEFT JOIN motoristas mot ON v.motorista_id = mot.id
      LEFT JOIN usuarios mot_usr ON mot.usuario_id = mot_usr.id
      LEFT JOIN onibus o ON v.onibus_id = o.id
      WHERE v.codigo_viagem = $1
      LIMIT 1`,
      [id]
    );

    if (resultado.rows.length === 0) {
      return NextResponse.json(
        { erro: 'Viagem não encontrada' },
        { status: 404 }
      );
    }

    const viagem = resultado.rows[0];

    // Criar PDF
    const doc = new PDFDocument({ 
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });

    // Buffer para armazenar o PDF
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));

    // Cores
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

    // Código da viagem em destaque
    doc.fontSize(10)
       .text(`Código: ${viagem.codigo_viagem}`, 50, 80, { align: 'center' });

    let y = 130;

    // INFORMAÇÕES DO PACIENTE
    doc.fillColor(azulPrimario)
       .fontSize(14)
       .font('Helvetica-Bold')
       .text('DADOS DO PACIENTE', 50, y);
    
    y += 25;
    doc.rect(50, y - 5, doc.page.width - 100, 100).stroke('#e5e7eb');
    
    doc.fillColor(cinzaEscuro)
       .fontSize(11)
       .font('Helvetica-Bold')
       .text('Nome:', 60, y);
    doc.font('Helvetica')
       .text(viagem.paciente_nome, 150, y);
    
    y += 20;
    doc.font('Helvetica-Bold')
       .text('CPF:', 60, y);
    doc.font('Helvetica')
       .text(viagem.paciente_cpf, 150, y);
    
    y += 20;
    doc.font('Helvetica-Bold')
       .text('Cartão SUS:', 60, y);
    doc.font('Helvetica')
       .text(viagem.cartao_sus, 150, y);
    
    y += 20;
    doc.font('Helvetica-Bold')
       .text('Telefone:', 60, y);
    doc.font('Helvetica')
       .text(viagem.paciente_telefone || 'Não informado', 150, y);

    y += 40;

    // INFORMAÇÕES DA VIAGEM
    doc.fillColor(azulPrimario)
       .fontSize(14)
       .font('Helvetica-Bold')
       .text('INFORMAÇÕES DA VIAGEM', 50, y);
    
    y += 25;
    doc.rect(50, y - 5, doc.page.width - 100, 120).stroke('#e5e7eb');
    
    doc.fillColor(cinzaEscuro)
       .fontSize(11)
       .font('Helvetica-Bold')
       .text('Data da Viagem:', 60, y);
    doc.font('Helvetica')
       .text(formatarData(viagem.data_viagem), 200, y);
    
    y += 20;
    doc.font('Helvetica-Bold')
       .text('Horário de Saída:', 60, y);
    doc.font('Helvetica')
       .text(formatarHora(viagem.horario_saida), 200, y);
    
    y += 20;
    doc.font('Helvetica-Bold')
       .text('Motivo:', 60, y);
    doc.font('Helvetica')
       .text(viagem.motivo || 'Não informado', 200, y, { width: 300 });
    
    y += 20;
    doc.font('Helvetica-Bold')
       .text('Destino:', 60, y);
    doc.font('Helvetica')
       .text(viagem.hospital_destino, 200, y, { width: 300 });
    
    y += 20;
    doc.font('Helvetica-Bold')
       .text('Endereço:', 60, y);
    doc.font('Helvetica')
       .text(viagem.endereco_destino || viagem.hospital_destino, 200, y, { width: 300 });

    y += 40;

    // MOTORISTA E VEÍCULO
    if (viagem.motorista_nome || viagem.onibus_placa) {
      doc.fillColor(azulPrimario)
         .fontSize(14)
         .font('Helvetica-Bold')
         .text('MOTORISTA E VEÍCULO', 50, y);
      
      y += 25;
      const alturaBox = viagem.motorista_nome && viagem.onibus_placa ? 80 : 60;
      doc.rect(50, y - 5, doc.page.width - 100, alturaBox).stroke('#e5e7eb');
      
      if (viagem.motorista_nome) {
        doc.fillColor(cinzaEscuro)
           .fontSize(11)
           .font('Helvetica-Bold')
           .text('Motorista:', 60, y);
        doc.font('Helvetica')
           .text(viagem.motorista_nome, 200, y);
        
        y += 20;
        doc.font('Helvetica-Bold')
           .text('Telefone:', 60, y);
        doc.font('Helvetica')
           .text(viagem.motorista_telefone || 'Não informado', 200, y);
        
        y += 20;
      }
      
      if (viagem.onibus_placa) {
        doc.font('Helvetica-Bold')
           .text('Ônibus:', 60, y);
        doc.font('Helvetica')
           .text(`${viagem.onibus_placa} - ${viagem.onibus_modelo || ''} (${viagem.onibus_ano || ''})`, 200, y);
        
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

    // Finalizar PDF
    doc.end();

    // Aguardar finalização e converter para buffer
    await new Promise((resolve) => {
      doc.on('end', resolve);
    });

    const pdfBuffer = Buffer.concat(chunks);

    // Retornar PDF
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Comprovante-Viagem-${viagem.codigo_viagem}.pdf"`,
      },
    });

  } catch (erro) {
    console.error('Erro ao gerar comprovante:', erro);
    
    return NextResponse.json(
      { erro: 'Erro ao gerar comprovante' },
      { status: 500 }
    );
    
  } finally {
    if (client) {
      await client.end();
    }
  }
}