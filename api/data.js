// Supabase适配 - Express App for Vercel
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');

const app = express();
const router = express.Router();

// 从环境变量获取Supabase配置
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// 初始化Supabase客户端
let supabase;
if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('Supabase client initialized');
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error.message);
  }
} else {
  console.warn('Missing Supabase credentials in environment variables');
}

// 全局中间件
app.use(cors());
app.use(express.json());

// Vercel rewrite fallback: map /api/data/:path* -> /api/data?path=:path*
app.use((req, _res, next) => {
  const rewrittenPath = req.query && req.query.path;
  if (rewrittenPath) {
    const normalizedPath = Array.isArray(rewrittenPath)
      ? rewrittenPath.join('/')
      : rewrittenPath;
    const cleanPath = String(normalizedPath).replace(/^\/+/, '');
    if (cleanPath) {
      req.url = `/${cleanPath}`;
    }
  }
  next();
});

// 记录请求日志
app.use((req, res, next) => {
  console.log(`API Request: ${req.method} ${req.url} `);
  next();
});

// === 辅助函数：字段名标准化 ===
// PostgreSQL 默认返回小写字段名，这里将其转换为前端需要的驼峰命名
const normalizeProject = (p) => ({
  ...p,
  completionDates: p.completionDates || p.completiondates || [],
  // 移除可能存在的重复小写字段，保持整洁
  completiondates: undefined
});

const normalizePurchaseRecord = (r) => ({
  ...r,
  consumableId: r.consumableId || r.consumableid,
  purchaseDate: r.purchaseDate || r.purchasedate,
  consumableid: undefined,
  purchasedate: undefined
});

// === 路由定义 ===

router.get('/', async (req, res) => {
  // 获取所有数据
  try {
    if (!supabase) throw new Error('No Supabase client available. Check environment variables.');

    const [projectsRes, consumablesRes, riceScoreRes, purchaseRes] = await Promise.all([
      supabase.from('project').select('*'),
      supabase.from('consumable').select('*'),
      supabase.from('ricescore').select('*').limit(1),
      supabase.from('purchaserecord').select('*'),
    ]);

    if (projectsRes.error) throw projectsRes.error;
    if (consumablesRes.error) throw consumablesRes.error;

    const riceScore = (riceScoreRes.data && riceScoreRes.data.length > 0 && riceScoreRes.data[0].score) || 0;

    // 标准化数据格式
    const projects = (projectsRes.data || []).map(normalizeProject);
    const purchaseRecords = (purchaseRes.data || []).map(normalizePurchaseRecord);

    res.status(200).json({
      projects,
      consumables: consumablesRes.data || [],
      riceScore,
      purchaseRecords,
    });
  } catch (error) {
    console.error('Error fetching data:', error.message);
    res.status(500).json({ message: error.message });
  }
});

router.post('/projects', async (req, res) => {
  const newProjectData = req.body;
  try {
    if (!supabase) throw new Error('No Supabase client available');

    // 转换驼峰命名到下划线命名
    const normalizedData = {
      name: newProjectData.name,
      icon: newProjectData.icon || '⭐',
      points: newProjectData.points || 0,
      period: newProjectData.period || 7,
      description: newProjectData.description,
      completiondates: newProjectData.completionDates || [],
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase.from('project').insert([normalizedData]).select();
    if (error) throw error;

    res.status(201).json(normalizeProject(data[0]));
  } catch (error) {
    console.error('Error adding project:', error.message);
    res.status(500).json({ message: error.message });
  }
});

router.post('/projects/:id/complete', async (req, res) => {
  const { id } = req.params;
  const date = new Date().toISOString().slice(0, 10);

  try {
    if (!supabase) throw new Error('No Supabase client available');

    const { data: project, error: pError } = await supabase.from('project').select('*').eq('id', id).single();
    if (pError) throw pError;

    // 兼容小写字段
    const currentDates = project.completionDates || project.completiondates || [];
    const completionDates = Array.isArray(currentDates) ? currentDates : [];

    if (!completionDates.includes(date)) {
      const updatedDates = [...completionDates, date];
      const points = project.points || 0;

      // 更新时使用 completionDates，Supabase 应该能映射到 completiondates
      // 如果不行，可能需要改为 completiondates: updatedDates
      const { error: uError } = await supabase.from('project').update({ completiondates: updatedDates }).eq('id', id);
      if (uError) throw uError;

      // Update score
      const { data: riceScoreData } = await supabase.from('ricescore').select('*').limit(1).single();
      let riceScoreObject = riceScoreData;
      if (!riceScoreObject) {
        const { data: newScore } = await supabase.from('ricescore').insert([{ score: 0 }]).select();
        riceScoreObject = newScore[0];
      }
      const updatedScore = riceScoreObject.score + points;
      await supabase.from('ricescore').update({ score: updatedScore }).eq('id', riceScoreObject.id);

      const { data: serverProject } = await supabase.from('project').select('*').eq('id', id).single();
      res.status(200).json({
        message: 'Project completed',
        project: normalizeProject(serverProject),
        riceScore: updatedScore
      });
    } else {
      res.status(200).json({ message: 'Already completed today', project: normalizeProject(project) });
    }
  } catch (error) {
    console.error('Error completing project:', error.message);
    res.status(500).json({ message: error.message });
  }
});

router.post('/projects/:id/completions/toggle', async (req, res) => {
  const { id } = req.params;
  const { date } = req.body;

  try {
    if (!supabase) throw new Error('No Supabase client available');

    // 1. 获取项目信息
    const { data: project, error: pError } = await supabase.from('project').select('*').eq('id', id).single();
    if (pError) throw pError;

    const points = project.points || 0;
    // 兼容小写字段
    const currentDates = project.completionDates || project.completiondates || [];
    const completionDates = Array.isArray(currentDates) ? currentDates : [];
    const has = completionDates.includes(date);

    let updatedDates;
    if (has) {
      updatedDates = completionDates.filter(d => d !== date);
    } else {
      updatedDates = [...completionDates, date];
    }

    // 2. 更新项目日期 (使用小写字段名以确保兼容)
    const { error: uError } = await supabase.from('project').update({ completiondates: updatedDates }).eq('id', id);
    if (uError) throw uError;

    // 3. 更新分数
    const { data: riceScoreData } = await supabase.from('ricescore').select('*').limit(1).single();
    let riceScoreObject = riceScoreData;

    // 如果没有分数记录，创建一个
    if (!riceScoreObject) {
      const { data: newScore } = await supabase.from('ricescore').insert([{ score: 0 }]).select();
      riceScoreObject = newScore[0];
    }

    const currentScore = riceScoreObject.score;
    const updatedScore = currentScore + (has ? -points : points);

    await supabase.from('ricescore').update({ score: updatedScore }).eq('id', riceScoreObject.id);

    // 4. 返回最新数据
    const { data: serverProject } = await supabase.from('project').select('*').eq('id', id).single();
    res.status(200).json({
      project: normalizeProject(serverProject),
      riceScore: updatedScore
    });

  } catch (error) {
    console.error('Error toggling completion:', error.message);
    res.status(500).json({ message: error.message });
  }
});

router.post('/consumables', async (req, res) => {
  const newConsumableData = req.body;
  try {
    if (!supabase) throw new Error('No Supabase client available');
    const { data, error } = await supabase.from('consumable').insert([newConsumableData]).select();
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Error adding consumable:', error.message);
    res.status(500).json({ message: error.message });
  }
});

router.post('/consumables/:id/buy', async (req, res) => {
  const { id } = req.params;
  const { date } = req.body;

  try {
    if (!supabase) throw new Error('No Supabase client available');

    const { data: consumable, error: cError } = await supabase.from('consumable').select('*').eq('id', id).single();
    if (cError) throw cError;

    // 创建购买记录 (使用小写字段名)
    const { data: purchaseRecord, error: pError } = await supabase.from('purchaserecord').insert([{
      consumableid: id,
      name: consumable.name,
      cost: consumable.cost,
      purchasedate: date,
    }]).select();
    if (pError) throw pError;

    // 更新分数
    const { data: riceScoreData } = await supabase.from('ricescore').select('*').limit(1).single();
    let riceScoreObject = riceScoreData;
    if (!riceScoreObject) {
      const { data: newScore } = await supabase.from('ricescore').insert([{ score: 0 }]).select();
      riceScoreObject = newScore[0];
    }

    const updatedScore = riceScoreObject.score - consumable.cost;
    await supabase.from('ricescore').update({ score: updatedScore }).eq('id', riceScoreObject.id);

    res.status(200).json({
      purchaseRecord: normalizePurchaseRecord(purchaseRecord[0]),
      riceScore: updatedScore,
    });
  } catch (error) {
    console.error('Error buying consumable:', error.message);
    res.status(500).json({ message: error.message });
  }
});

// 取消购买/退还米粒
const handleRefundConsumable = async (req, res) => {
  const { id } = req.params;
  const { date } = req.body || {};

  try {
    if (!supabase) throw new Error('No Supabase client available');

    // 查找指定日期的购买记录
    const { data: purchaseRecord, error: findError } = await supabase
      .from('purchaserecord')
      .select('*')
      .eq('consumableid', id)
      .eq('purchasedate', date)
      .single();

    if (findError || !purchaseRecord) {
      return res.status(404).json({ message: 'Purchase record not found' });
    }

    // 获取消耗品信息
    const { data: consumable, error: cError } = await supabase.from('consumable').select('*').eq('id', id).single();
    if (cError) throw cError;

    // 删除购买记录
    const { error: deleteError } = await supabase.from('purchaserecord').delete().eq('id', purchaseRecord.id);
    if (deleteError) throw deleteError;

    // 更新分数（返还米粒）
    const { data: riceScoreData } = await supabase.from('ricescore').select('*').limit(1).single();
    let riceScoreObject = riceScoreData;
    if (!riceScoreObject) {
      const { data: newScore } = await supabase.from('ricescore').insert([{ score: 0 }]).select();
      riceScoreObject = newScore[0];
    }

    const updatedScore = riceScoreObject.score + consumable.cost;
    await supabase.from('ricescore').update({ score: updatedScore }).eq('id', riceScoreObject.id);

    res.status(200).json({
      message: 'Refund successful',
      riceScore: updatedScore,
    });
  } catch (error) {
    console.error('Error refunding consumable:', error.message);
    res.status(500).json({ message: error.message });
  }
};

router.delete('/consumables/:id/refund', handleRefundConsumable);
router.post('/consumables/:id/refund', handleRefundConsumable);

router.put('/projects/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (!supabase) throw new Error('No Supabase client available');
    await supabase.from('project').update(req.body).eq('id', id);
    const { data } = await supabase.from('project').select('*').eq('id', id).single();
    res.status(200).json(normalizeProject(data));
  } catch (error) {
    console.error('Error updating project:', error.message);
    res.status(500).json({ message: error.message });
  }
});

router.put('/consumables/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (!supabase) throw new Error('No Supabase client available');
    await supabase.from('consumable').update(req.body).eq('id', id);
    const { data } = await supabase.from('consumable').select('*').eq('id', id).single();
    res.status(200).json(data);
  } catch (error) {
    console.error('Error updating consumable:', error.message);
    res.status(500).json({ message: error.message });
  }
});

const handleDeleteProject = async (req, res) => {
  const { id } = req.params;
  const { clearPoints } = req.body || {};
  try {
    if (!supabase) throw new Error('No Supabase client available');

    let finalRiceScore;
    if (clearPoints) {
      const { data: project } = await supabase.from('project').select('*').eq('id', id).single();
      if (project) {
        // 兼容小写
        const dates = project.completionDates || project.completiondates || [];
        const completedCount = Array.isArray(dates) ? dates.length : 0;
        const points = project.points || 0;

        const { data: riceScoreData } = await supabase.from('ricescore').select('*').limit(1).single();
        if (riceScoreData) {
          const updatedScore = riceScoreData.score - completedCount * points;
          await supabase.from('ricescore').update({ score: updatedScore }).eq('id', riceScoreData.id);
          finalRiceScore = updatedScore;
        }
      }
    }

    await supabase.from('project').delete().eq('id', id);

    if (clearPoints) {
      res.status(200).json({ message: 'Deleted', riceScore: finalRiceScore });
    } else {
      res.status(200).json({ message: 'Deleted' });
    }
  } catch (error) {
    console.error('Error deleting project:', error.message);
    res.status(500).json({ message: error.message });
  }
};

router.delete('/projects/:id', handleDeleteProject);

router.post('/projects/:id/delete', async (req, res) => {
  return handleDeleteProject(req, res);
});

const handleDeleteConsumable = async (req, res) => {
  const { id } = req.params;
  try {
    if (!supabase) throw new Error('No Supabase client available');
    await supabase.from('consumable').delete().eq('id', id);
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting consumable:', error.message);
    res.status(500).json({ message: error.message });
  }
};

router.delete('/consumables/:id', handleDeleteConsumable);

router.post('/consumables/:id/delete', async (req, res) => {
  return handleDeleteConsumable(req, res);
});

router.get('/health', async (req, res) => {
  let dbStatus = 'unknown';
  let dbError = null;

  if (supabase) {
    try {
      // 尝试查询 project 表以验证连接和表是否存在
      const { error } = await supabase.from('project').select('id').limit(1);
      if (error) {
        dbStatus = 'error';
        dbError = error;
      } else {
        dbStatus = 'connected';
      }
    } catch (e) {
      dbStatus = 'exception';
      dbError = e.message;
    }
  } else {
    dbStatus = 'disconnected';
  }

  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    supabaseConnected: !!supabase,
    dbStatus,
    dbError
  });
});

// 挂载路由：同时支持 /api/data 前缀和根路径
app.use('/api/data', router);
app.use('/', router);

module.exports = app;
