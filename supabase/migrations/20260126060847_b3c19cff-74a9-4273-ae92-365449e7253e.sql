-- Add new year groups to the enum
ALTER TYPE year_group ADD VALUE IF NOT EXISTS 'DP2';
ALTER TYPE year_group ADD VALUE IF NOT EXISTS 'G10';