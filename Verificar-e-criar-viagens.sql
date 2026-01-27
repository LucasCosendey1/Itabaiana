-- ============================================
-- VERIFICAR VIAGENS EXISTENTES
-- ============================================

SELECT 
  v.id,
  v.codigo_viagem,
  v.data_viagem,
  v.horario_saida,
  v.status,
  v.hospital_destino,
  v.numero_vagas,
  COUNT(vp.id) as total_pacientes_associados
FROM viagens v
LEFT JOIN viagem_pacientes vp ON v.id = vp.viagem_id
GROUP BY v.id, v.codigo_viagem, v.data_viagem, v.horario_saida, v.status, v.hospital_destino, v.numero_vagas
ORDER BY v.data_viagem DESC;

-- ============================================
-- CRIAR VIAGENS DE TESTE (SE NÃO EXISTIREM)
-- ============================================

-- Viagem 1: Futuras
INSERT INTO viagens (codigo_viagem, hospital_destino, endereco_destino, data_viagem, horario_saida, numero_vagas, motorista_id, status)
SELECT 'V2026001', 'Hospital Regional de Campina Grande', 'Av. Brasília, 1000, Campina Grande-PB', '2026-02-15', '07:00', 20, 1, 'pendente'
WHERE NOT EXISTS (SELECT 1 FROM viagens WHERE codigo_viagem = 'V2026001');

INSERT INTO viagens (codigo_viagem, hospital_destino, endereco_destino, data_viagem, horario_saida, numero_vagas, motorista_id, status)
SELECT 'V2026002', 'Hospital Universitário - João Pessoa', 'Campus I UFPB, João Pessoa-PB', '2026-02-20', '05:30', 15, 2, 'pendente'
WHERE NOT EXISTS (SELECT 1 FROM viagens WHERE codigo_viagem = 'V2026002');

INSERT INTO viagens (codigo_viagem, hospital_destino, endereco_destino, data_viagem, horario_saida, numero_vagas, motorista_id, status)
SELECT 'V2026003', 'Hospital de Trauma de Campina Grande', 'Rua João da Mata, 500, Campina Grande-PB', '2026-02-25', '06:00', 18, 1, 'pendente'
WHERE NOT EXISTS (SELECT 1 FROM viagens WHERE codigo_viagem = 'V2026003');

-- Viagem 2: Próximas
INSERT INTO viagens (codigo_viagem, hospital_destino, endereco_destino, data_viagem, horario_saida, numero_vagas, status)
SELECT 'V2026004', 'Hospital Regional de Campina Grande', 'Av. Brasília, 1000, Campina Grande-PB', '2026-03-10', '08:00', 25, 'pendente'
WHERE NOT EXISTS (SELECT 1 FROM viagens WHERE codigo_viagem = 'V2026004');

INSERT INTO viagens (codigo_viagem, hospital_destino, endereco_destino, data_viagem, horario_saida, numero_vagas, motorista_id, status)
SELECT 'V2026005', 'Hospital Universitário - João Pessoa', 'Campus I UFPB, João Pessoa-PB', '2026-03-15', '06:30', 20, 2, 'pendente'
WHERE NOT EXISTS (SELECT 1 FROM viagens WHERE codigo_viagem = 'V2026005');

-- ============================================
-- VERIFICAR RESULTADO
-- ============================================

SELECT 
  codigo_viagem,
  hospital_destino,
  data_viagem,
  horario_saida,
  numero_vagas,
  status
FROM viagens
ORDER BY data_viagem DESC;