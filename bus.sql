-- ============================================
-- ADICIONAR ÔNIBUS ÀS VIAGENS
-- ============================================

-- Adicionar coluna onibus_id na tabela viagens
ALTER TABLE viagens 
ADD COLUMN IF NOT EXISTS onibus_id INTEGER REFERENCES onibus(id);

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_viagens_onibus ON viagens(onibus_id);

-- Verificar estrutura
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'viagens' 
  AND column_name IN ('onibus_id', 'motorista_id')
ORDER BY ordinal_position;