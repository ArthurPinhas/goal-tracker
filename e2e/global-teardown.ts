import { APIHelpers } from './helpers/api-helpers';

async function authenticateAPI() {
  const res = await fetch('http://127.0.0.1:8090/api/collections/users/auth-with-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: 'e2e_user@goaltracker.local', password: 'testing123' })
  });
  if (!res.ok) throw new Error('Failed to authenticate test user in teardown');
  return res.json();
}

export default async function globalTeardown() {
  try {
    const authData = await authenticateAPI();
    const api = new APIHelpers(authData.token, authData.record.id);
    await api.deleteAllGoals();
    try { await api.deleteAllCategories(); } catch(e) {}
  } catch (error) {
    console.error('Teardown failed:', error);
  }
}
