-- RiceApp 数据库表结构SQL
-- 请在你的Supabase项目的SQL编辑器中执行此代码

-- 1. 创建项目表 (project)
CREATE TABLE IF NOT EXISTS public.project (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    icon TEXT DEFAULT '⭐',
    name TEXT NOT NULL,
    points INTEGER DEFAULT 0,
    period INTEGER DEFAULT 7,
    description TEXT,
    completionDates TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 创建消耗品表 (consumable)
CREATE TABLE IF NOT EXISTS public.consumable (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    cost INTEGER DEFAULT 0,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 创建米饭分数表 (ricescore)
CREATE TABLE IF NOT EXISTS public.ricescore (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    score INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 创建购买记录表 (purchaserecord)
CREATE TABLE IF NOT EXISTS public.purchaserecord (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consumableId UUID REFERENCES public.consumable(id),
    name TEXT NOT NULL,
    cost INTEGER DEFAULT 0,
    purchaseDate TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 启用行级安全 (RLS)
ALTER TABLE public.project ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumable ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ricescore ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchaserecord ENABLE ROW LEVEL SECURITY;

-- 6. 创建允许匿名访问的策略（使用Supabase的anon密钥）
-- 项目表策略
CREATE POLICY "允许匿名访问项目表" ON public.project
    FOR ALL USING (true);

-- 消耗品表策略
CREATE POLICY "允许匿名访问消耗品表" ON public.consumable
    FOR ALL USING (true);

-- 米饭分数表策略
CREATE POLICY "允许匿名访问米饭分数表" ON public.ricescore
    FOR ALL USING (true);

-- 购买记录表策略
CREATE POLICY "允许匿名访问购买记录表" ON public.purchaserecord
    FOR ALL USING (true);

-- 7. 插入初始米饭分数记录（如果不存在）
INSERT INTO public.ricescore (score) 
SELECT 0 
WHERE NOT EXISTS (SELECT 1 FROM public.ricescore);

-- 8. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_project_completion_dates ON public.project USING gin(completionDates);
CREATE INDEX IF NOT EXISTS idx_purchaserecord_consumable_id ON public.purchaserecord(consumableId);
CREATE INDEX IF NOT EXISTS idx_purchaserecord_purchase_date ON public.purchaserecord(purchaseDate);

-- 9. 注释说明
COMMENT ON TABLE public.project IS '项目表，存储用户创建的项目信息';
COMMENT ON TABLE public.consumable IS '消耗品表，存储可购买的消耗品信息';
COMMENT ON TABLE public.ricescore IS '米饭分数表，存储用户的累计分数';
COMMENT ON TABLE public.purchaserecord IS '购买记录表，存储用户的购买历史';

-- 10. 查看表结构确认
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('project', 'consumable', 'ricescore', 'purchaserecord')
ORDER BY table_name, ordinal_position;