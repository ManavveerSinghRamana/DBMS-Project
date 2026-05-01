const { createClient } = require('@supabase/supabase-js');

// Simple, secure seed endpoint for Vercel deployments.
// Protect by setting SEED_TRIGGER_SECRET in Vercel and calling with header `x-seed-secret`.

const DEMO_ACCOUNTS = [
  {
    role: 'public_user',
    label: 'Public User',
    email: 'demo.public@reliefhub.local',
    password: 'ReliefHub@123',
    user_name: 'Demo Public User',
    user_phoneno: '9000000001',
  },
  {
    role: 'donor',
    label: 'Donor',
    email: 'demo.donor@reliefhub.local',
    password: 'ReliefHub@123',
    user_name: 'Demo Donor',
    user_phoneno: '9000000002',
  },
  {
    role: 'government',
    label: 'Government Authority',
    email: 'demo.government@reliefhub.local',
    password: 'ReliefHub@123',
    user_name: 'Demo Government Officer',
    user_phoneno: '9000000003',
  },
  {
    role: 'admin',
    label: 'Admin',
    email: 'demo.admin@reliefhub.local',
    password: 'ReliefHub@123',
    user_name: 'Demo Admin',
    user_phoneno: '9000000004',
  },
];

function createSupabaseAdminClient() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL');
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

module.exports = async function (req, res) {
  try {
    // Only allow POST
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const secret = (req.headers['x-seed-secret'] || req.headers['x-seed-token'] || '').toString();
    const expected = process.env.SEED_TRIGGER_SECRET;
    if (!expected || secret !== expected) {
      return res.status(401).json({ error: 'Unauthorized: missing or invalid seed secret' });
    }

    const supabaseAdmin = createSupabaseAdminClient();

    const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    if (listError) throw listError;

    const existingUsers = usersData.users || [];

    const results = [];

    for (const acct of DEMO_ACCOUNTS) {
      const existing = existingUsers.find((u) => (u.email || '').toLowerCase() === acct.email.toLowerCase());
      let userId = existing?.id;

      if (existing) {
        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(existing.id, {
          password: acct.password,
          email_confirm: true,
          user_metadata: {
            user_name: acct.user_name,
            user_phoneno: acct.user_phoneno,
            role: acct.role,
          },
        });
        if (error) throw error;
        userId = data.user?.id || userId;
      } else {
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email: acct.email,
          password: acct.password,
          email_confirm: true,
          user_metadata: {
            user_name: acct.user_name,
            user_phoneno: acct.user_phoneno,
            role: acct.role,
          },
        });
        if (error) throw error;
        userId = data.user?.id || userId;
      }

      if (!userId) throw new Error('Failed to provision user ' + acct.email);

      const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
        id: userId,
        user_name: acct.user_name,
        user_email: acct.email,
        user_phoneno: acct.user_phoneno,
      }, { onConflict: 'id' });
      if (profileError) throw profileError;

      const { error: deleteRolesError } = await supabaseAdmin.from('user_roles').delete().eq('user_id', userId);
      if (deleteRolesError) throw deleteRolesError;

      const { error: roleError } = await supabaseAdmin.from('user_roles').insert({ user_id: userId, role: acct.role });
      if (roleError) throw roleError;

      results.push({ email: acct.email, role: acct.role, password: acct.password });
    }

    return res.status(200).json({ ok: true, results });
  } catch (err) {
    console.error('Seed error', err?.message || err);
    return res.status(500).json({ error: err?.message || String(err) });
  }
};
