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