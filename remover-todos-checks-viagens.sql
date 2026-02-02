-- ============================================
-- DESCOBRIR E REMOVER TODOS OS CHECK CONSTRAINTS
-- Sistema de Transporte SUS - Itabaiana/PB
-- ============================================

\echo ''
\echo '============================================'
\echo '🔍 DESCOBRINDO CHECK CONSTRAINTS EM VIAGENS'
\echo '============================================'
\echo ''

-- Listar todos os constraints da tabela viagens
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'viagens'
AND constraint_type = 'CHECK';

\echo ''
\echo '============================================'
\echo '🗑️  REMOVENDO TODOS OS CHECK CONSTRAINTS'
\echo '============================================'
\echo ''

-- Remover viagens_data_viagem_check
\echo '🔹 Removendo viagens_data_viagem_check...'
ALTER TABLE viagens DROP CONSTRAINT IF EXISTS viagens_data_viagem_check CASCADE;

-- Remover viagens_status_check
\echo '🔹 Removendo viagens_status_check...'
ALTER TABLE viagens DROP CONSTRAINT IF EXISTS viagens_status_check CASCADE;

-- Remover viagens_check (se existir)
\echo '🔹 Removendo viagens_check...'
ALTER TABLE viagens DROP CONSTRAINT IF EXISTS viagens_check CASCADE;

-- Remover qualquer outro check constraint genérico
\echo '🔹 Removendo possíveis outros checks...'
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'viagens' 
        AND constraint_type = 'CHECK'
    )
    LOOP
        EXECUTE 'ALTER TABLE viagens DROP CONSTRAINT IF EXISTS ' || r.constraint_name || ' CASCADE';
        RAISE NOTICE 'Removido: %', r.constraint_name;
    END LOOP;
END $$;

\echo ''
\echo '✅ Todos os CHECK constraints removidos!'
\echo ''

-- Agora podemos setar os campos legados como NULL
\echo '============================================'
\echo '🧹 LIMPANDO CAMPOS LEGADOS'
\echo '============================================'
\echo ''

\echo '🔹 Setando paciente_id = NULL...'
UPDATE viagens SET paciente_id = NULL WHERE paciente_id IS NOT NULL;

\echo '🔹 Setando medico_id = NULL...'
UPDATE viagens SET medico_id = NULL WHERE medico_id IS NOT NULL;

\echo '🔹 Setando motivo = NULL...'
UPDATE viagens SET motivo = NULL WHERE motivo IS NOT NULL;

\echo '🔹 Setando horario_consulta = NULL...'
UPDATE viagens SET horario_consulta = NULL WHERE horario_consulta IS NOT NULL;

\echo ''
\echo '✅ Campos legados limpos com sucesso!'
\echo ''

-- Verificar resultado final
\echo '============================================'
\echo '📊 VERIFICAÇÃO FINAL'
\echo '============================================'
\echo ''

SELECT 
    codigo_viagem,
    data_viagem,
    hospital_destino,
    status,
    numero_vagas,
    paciente_id,
    medico_id,
    motivo,
    horario_consulta
FROM viagens
ORDER BY data_viagem DESC
LIMIT 10;

\echo ''
\echo '✅ Verificar constraints restantes:'
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'viagens'
ORDER BY constraint_type, constraint_name;

\echo ''
\echo '============================================'
\echo '🎉 BANCO 100% LIMPO E PRONTO!'
\echo '============================================'
\echo ''