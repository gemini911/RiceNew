-- RiceApp 数据库表更新SQL
-- 请在你的Supabase项目的SQL编辑器中执行此代码来更新现有表结构

-- 1. 为项目表添加缺失的字段
ALTER TABLE public.project 
ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT '⭐';

ALTER TABLE public.project 
ADD COLUMN IF NOT EXISTS period INTEGER DEFAULT 7;

-- 2. 确保completionDates字段存在且类型正确
ALTER TABLE public.project 
ADD COLUMN IF NOT EXISTS completionDates TEXT[] DEFAULT '{}';

-- 3. 如果completionDates字段存在但类型不正确，尝试转换
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'project' 
               AND column_name = 'completionDates' 
               AND data_type != 'ARRAY') THEN
        -- 如果字段存在但类型不是数组，尝试转换为数组类型
        ALTER TABLE public.project 
        ALTER COLUMN completionDates TYPE TEXT[] 
        USING CASE 
            WHEN completionDates IS NULL THEN '{}'::TEXT[]
            WHEN completionDates = '' THEN '{}'::TEXT[]
            ELSE ARRAY[completionDates]::TEXT[]
        END;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- 如果转换失败，删除字段并重新创建
        ALTER TABLE public.project DROP COLUMN IF EXISTS completionDates;
        ALTER TABLE public.project ADD COLUMN completionDates TEXT[] DEFAULT '{}';
END $$;

-- 4. 验证表结构更新
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'project'
ORDER BY ordinal_position;