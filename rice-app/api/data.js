import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ message: 'Method Not Allowed' });
    return;
  }

  // 获取Supabase配置
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    res.status(500).json({ message: 'Supabase credentials missing' });
    return;
  }

  // 初始化Supabase客户端
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // Fetch Projects
    const { data: projects, error: projectsError } = await supabase.from('Project').select('*');
    if (projectsError) throw projectsError;

    // Fetch Consumables
    const { data: consumables, error: consumablesError } = await supabase.from('Consumable').select('*');
    if (consumablesError) throw consumablesError;

    // Fetch RiceScores
    const { data: riceScores, error: riceScoresError } = await supabase.from('RiceScore').select('*');
    if (riceScoresError) throw riceScoresError;

    // Fetch PurchaseRecords
    const { data: purchaseRecords, error: purchaseRecordsError } = await supabase.from('PurchaseRecord').select('*');
    if (purchaseRecordsError) throw purchaseRecordsError;

    res.status(200).json({
      projects: projects || [],
      consumables: consumables || [],
      riceScores: riceScores || [],
      purchaseRecords: purchaseRecords || [],
    });
  } catch (error) {
    console.error('Error fetching data from Supabase:', error);
    res.status(500).json({ message: 'Failed to fetch data from Supabase', error: error.message });
  }
}