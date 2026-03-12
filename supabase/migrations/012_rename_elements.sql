-- Rename positive → light, negative → dark in element arrays
-- These are text[] columns, not enums, so simple array_replace works

UPDATE herbs SET elements = array_replace(elements, 'positive', 'light')
WHERE 'positive' = ANY(elements);

UPDATE herbs SET elements = array_replace(elements, 'negative', 'dark')
WHERE 'negative' = ANY(elements);

UPDATE recipes SET elements = array_replace(elements, 'positive', 'light')
WHERE 'positive' = ANY(elements);

UPDATE recipes SET elements = array_replace(elements, 'negative', 'dark')
WHERE 'negative' = ANY(elements);
