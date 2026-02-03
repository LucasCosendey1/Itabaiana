-- ============================================
-- SCRIPT DE ANÁLISE COMPLETA DO BANCO DE DADOS
-- Sistema de Transporte SUS - Itabaiana/PB
-- Versão 2.0 - Adaptativo
-- ============================================

-- ============================================
-- 1. LISTAR TODAS AS TABELAS DO BANCO
-- ============================================
\echo '============================================'
\echo '1. TABELAS DO BANCO DE DADOS'
\echo '============================================'
SELECT
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- ============================================
-- 2. ESTRUTURA DA TABELA: usuarios
-- ============================================
\echo ''
\echo '============================================'
\echo '2. ESTRUTURA: usuarios'
\echo '============================================'
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'usuarios'
ORDER BY ordinal_position;

-- ============================================
-- 3. ESTRUTURA DA TABELA: pacientes
-- ============================================
\echo ''
\echo '============================================'
\echo '3. ESTRUTURA: pacientes'
\echo '============================================'
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'pacientes'
ORDER BY ordinal_position;

-- ============================================
-- 4. ESTRUTURA DA TABELA: administradores
-- ============================================
\echo ''
\echo '============================================'
\echo '4. ESTRUTURA: administradores'
\echo '============================================'
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'administradores'
ORDER BY ordinal_position;

-- ============================================
-- 5. ESTRUTURA DA TABELA: medicos
-- ============================================
\echo ''
\echo '============================================'
\echo '5. ESTRUTURA: medicos'
\echo '============================================'
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'medicos'
ORDER BY ordinal_position;

-- ============================================
-- 6. ESTRUTURA DA TABELA: motoristas
-- ============================================
\echo ''
\echo '============================================'
\echo '6. ESTRUTURA: motoristas'
\echo '============================================'
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'motoristas'
ORDER BY ordinal_position;

-- ============================================
-- 7. ESTRUTURA DA TABELA: onibus
-- ============================================
\echo ''
\echo '============================================'
\echo '7. ESTRUTURA: onibus'
\echo '============================================'
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'onibus'
ORDER BY ordinal_position;

-- ============================================
-- 8. ESTRUTURA DA TABELA: viagens
-- ============================================
\echo ''
\echo '============================================'
\echo '8. ESTRUTURA: viagens'
\echo '============================================'
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'viagens'
ORDER BY ordinal_position;

-- ============================================
-- 9. ESTRUTURA DA TABELA: viagem_pacientes
-- ============================================
\echo ''
\echo '============================================'
\echo '9. ESTRUTURA: viagem_pacientes'
\echo '============================================'
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'viagem_pacientes'
ORDER BY ordinal_position;

-- ============================================
-- 10. CONSTRAINTS E FOREIGN KEYS
-- ============================================
\echo ''
\echo '============================================'
\echo '10. CONSTRAINTS E FOREIGN KEYS'
\echo '============================================'
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_type;

-- ============================================
-- 11. ÍNDICES
-- ============================================
\echo ''
\echo '============================================'
\echo '11. ÍNDICES'
\echo '============================================'
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================
-- 12. CONTAGEM DE REGISTROS
-- ============================================
\echo ''
\echo '============================================'
\echo '12. CONTAGEM DE REGISTROS'
\echo '============================================'

SELECT 'usuarios' as tabela, COUNT(*) as total FROM usuarios
UNION ALL
SELECT 'pacientes', COUNT(*) FROM pacientes
UNION ALL
SELECT 'administradores', COUNT(*) FROM administradores
UNION ALL
SELECT 'medicos', COUNT(*) FROM medicos
UNION ALL
SELECT 'motoristas', COUNT(*) FROM motoristas
UNION ALL
SELECT 'onibus', COUNT(*) FROM onibus
UNION ALL
SELECT 'viagens', COUNT(*) FROM viagens
UNION ALL
SELECT 'viagem_pacientes', COUNT(*) FROM viagem_pacientes
ORDER BY tabela;

-- ============================================
-- 13. AMOSTRA: Usuarios (primeiros 5)
-- ============================================
\echo ''
\echo '============================================'
\echo '13. AMOSTRA: Usuarios'
\echo '============================================'
SELECT 
    id,
    cpf,
    nome_completo,
    email,
    tipo_usuario,
    ativo
FROM usuarios
LIMIT 5;

-- ============================================
-- 14. AMOSTRA: Pacientes (primeiros 5)
-- ============================================
\echo ''
\echo '============================================'
\echo '14. AMOSTRA: Pacientes'
\echo '============================================'
SELECT 
    p.id,
    u.nome_completo,
    u.cpf,
    p.cartao_sus,
    p.data_nascimento,
    p.tipo_sanguineo
FROM pacientes p
INNER JOIN usuarios u ON p.usuario_id = u.id
LIMIT 5;

-- ============================================
-- 15. AMOSTRA: Administradores
-- ============================================
\echo ''
\echo '============================================'
\echo '15. AMOSTRA: Administradores'
\echo '============================================'
SELECT 
    a.id,
    u.nome_completo,
    u.cpf,
    a.cargo,
    a.nivel_acesso
FROM administradores a
INNER JOIN usuarios u ON a.usuario_id = u.id
LIMIT 5;

-- ============================================
-- 16. AMOSTRA: Medicos
-- ============================================
\echo ''
\echo '============================================'
\echo '16. AMOSTRA: Medicos'
\echo '============================================'
SELECT 
    m.id,
    u.nome_completo,
    m.crm,
    m.especializacao,
    m.hospital_vinculado
FROM medicos m
INNER JOIN usuarios u ON m.usuario_id = u.id
LIMIT 5;

-- ============================================
-- 17. AMOSTRA: Motoristas
-- ============================================
\echo ''
\echo '============================================'
\echo '17. AMOSTRA: Motoristas'
\echo '============================================'
SELECT 
    mot.id,
    u.nome_completo,
    mot.cnh,
    mot.veiculo_modelo,
    mot.veiculo_placa,
    mot.disponivel
FROM motoristas mot
INNER JOIN usuarios u ON mot.usuario_id = u.id
LIMIT 5;

-- ============================================
-- 18. AMOSTRA: Onibus
-- ============================================
\echo ''
\echo '============================================'
\echo '18. AMOSTRA: Onibus'
\echo '============================================'
SELECT 
    id,
    placa,
    modelo,
    ano,
    capacidade_passageiros,
    cor,
    disponivel
FROM onibus
LIMIT 5;

-- ============================================
-- 19. AMOSTRA: Viagens (últimas 10)
-- ============================================
\echo ''
\echo '============================================'
\echo '19. AMOSTRA: Viagens (últimas 10)'
\echo '============================================'
SELECT 
    v.id,
    v.codigo_viagem,
    v.data_viagem,
    v.horario_saida,
    v.hospital_destino,
    v.numero_vagas,
    v.status,
    v.motorista_id,
    v.onibus_id
FROM viagens v
ORDER BY v.data_viagem DESC
LIMIT 10;

-- ============================================
-- 20. AMOSTRA: Viagem_Pacientes (últimas 10)
-- ============================================
\echo ''
\echo '============================================'
\echo '20. AMOSTRA: Viagem_Pacientes'
\echo '============================================'
SELECT 
    vp.id,
    v.codigo_viagem,
    u.nome_completo as paciente_nome,
    vp.motivo,
    vp.horario_consulta
FROM viagem_pacientes vp
INNER JOIN viagens v ON vp.viagem_id = v.id
INNER JOIN pacientes p ON vp.paciente_id = p.id
INNER JOIN usuarios u ON p.usuario_id = u.id
ORDER BY v.data_viagem DESC
LIMIT 10;

-- ============================================
-- 21. ANÁLISE: Viagens com Motoristas e Ônibus
-- ============================================
\echo ''
\echo '============================================'
\echo '21. ANÁLISE: Viagens com Motoristas e Ônibus'
\echo '============================================'
SELECT 
    v.codigo_viagem,
    v.data_viagem,
    v.hospital_destino,
    mot_usr.nome_completo as motorista,
    o.placa as onibus,
    COUNT(vp.id) as total_pacientes,
    v.numero_vagas,
    v.status
FROM viagens v
LEFT JOIN motoristas mot ON v.motorista_id = mot.id
LEFT JOIN usuarios mot_usr ON mot.usuario_id = mot_usr.id
LEFT JOIN onibus o ON v.onibus_id = o.id
LEFT JOIN viagem_pacientes vp ON v.id = vp.viagem_id
GROUP BY v.id, v.codigo_viagem, v.data_viagem, v.hospital_destino, 
         mot_usr.nome_completo, o.placa, v.numero_vagas, v.status
ORDER BY v.data_viagem DESC
LIMIT 10;

-- ============================================
-- 22. VERIFICAÇÃO: Viagens sem pacientes
-- ============================================
\echo ''
\echo '============================================'
\echo '22. VERIFICAÇÃO: Viagens sem pacientes'
\echo '============================================'
SELECT 
    v.codigo_viagem,
    v.data_viagem,
    v.hospital_destino,
    v.numero_vagas,
    v.status,
    COUNT(vp.id) as total_pacientes
FROM viagens v
LEFT JOIN viagem_pacientes vp ON v.id = vp.viagem_id
GROUP BY v.id, v.codigo_viagem, v.data_viagem, v.hospital_destino, v.numero_vagas, v.status
HAVING COUNT(vp.id) = 0
ORDER BY v.data_viagem DESC;

-- ============================================
-- 23. VERIFICAÇÃO: Viagens lotadas
-- ============================================
\echo ''
\echo '============================================'
\echo '23. VERIFICAÇÃO: Viagens lotadas'
\echo '============================================'
SELECT 
    v.codigo_viagem,
    v.data_viagem,
    v.hospital_destino,
    v.numero_vagas,
    COUNT(vp.id) as total_pacientes,
    v.numero_vagas - COUNT(vp.id) as vagas_disponiveis,
    CASE 
        WHEN COUNT(vp.id) >= v.numero_vagas THEN 'LOTADA'
        ELSE 'COM VAGAS'
    END as situacao
FROM viagens v
LEFT JOIN viagem_pacientes vp ON v.id = vp.viagem_id
GROUP BY v.id, v.codigo_viagem, v.data_viagem, v.hospital_destino, v.numero_vagas
ORDER BY v.data_viagem DESC;

-- ============================================
-- 24. ESTATÍSTICAS: Resumo geral
-- ============================================
\echo ''
\echo '============================================'
\echo '24. ESTATÍSTICAS: Resumo Geral'
\echo '============================================'
SELECT 
    (SELECT COUNT(*) FROM usuarios) as total_usuarios,
    (SELECT COUNT(*) FROM pacientes) as total_pacientes,
    (SELECT COUNT(*) FROM administradores) as total_administradores,
    (SELECT COUNT(*) FROM medicos) as total_medicos,
    (SELECT COUNT(*) FROM motoristas) as total_motoristas,
    (SELECT COUNT(*) FROM onibus) as total_onibus,
    (SELECT COUNT(*) FROM viagens) as total_viagens,
    (SELECT COUNT(*) FROM viagem_pacientes) as total_associacoes;

-- ============================================
-- 25. ESTATÍSTICAS: Viagens por status
-- ============================================
\echo ''
\echo '============================================'
\echo '25. ESTATÍSTICAS: Viagens por Status'
\echo '============================================'
SELECT 
    status,
    COUNT(*) as total
FROM viagens
GROUP BY status
ORDER BY total DESC;

-- ============================================
-- 26. ESTATÍSTICAS: Usuários por tipo
-- ============================================
\echo ''
\echo '============================================'
\echo '26. ESTATÍSTICAS: Usuários por Tipo'
\echo '============================================'
SELECT 
    tipo_usuario,
    COUNT(*) as total,
    COUNT(CASE WHEN ativo = true THEN 1 END) as ativos,
    COUNT(CASE WHEN ativo = false THEN 1 END) as inativos
FROM usuarios
GROUP BY tipo_usuario
ORDER BY total DESC;

\echo ''
\echo '============================================'
\echo 'ANÁLISE COMPLETA FINALIZADA!'
\echo '============================================'