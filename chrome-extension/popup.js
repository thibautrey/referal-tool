const API_URL = 'https://rflnk.com/api';

function getStored(key) {
  return new Promise(resolve => chrome.storage.local.get(key, r => resolve(r[key])));
}
function setStored(obj) {
  return new Promise(resolve => chrome.storage.local.set(obj, resolve));
}

async function apiRequest(endpoint, method, data) {
  const token = await getStored('token');
  const projectId = await getStored('projectId');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (projectId) headers['X-Project-ID'] = String(projectId);
  const res = await fetch(API_URL + endpoint, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined
  });
  if (!res.ok) throw new Error('API error');
  const json = await res.json();
  return json.data;
}

function showCreate() {
  document.getElementById('login').style.display = 'none';
  document.getElementById('create').style.display = 'block';
}

async function init() {
  const token = await getStored('token');
  if (token) showCreate();

  document.getElementById('loginBtn').onclick = async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    try {
      const res = await fetch(API_URL + '/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const json = await res.json();
      if (!res.ok) throw new Error();
      await setStored({ token: json.data.token });
      const projects = await apiRequest('/projects', 'GET');
      if (projects.length) await setStored({ projectId: projects[0].id });
      showCreate();
    } catch (e) {
      alert('Login failed');
    }
  };

  document.getElementById('createBtn').onclick = async () => {
    const name = document.getElementById('name').value;
    const url = document.getElementById('url').value;
    try {
      const link = await apiRequest('/links', 'POST', { name, baseUrl: url, shortCode: '' });
      const shortUrl = `https://rflnk.com/l/${link.shortCode}`;
      document.getElementById('result').textContent = shortUrl;
      document.getElementById('result').style.display = 'block';
      await navigator.clipboard.writeText(shortUrl);
    } catch (e) {
      alert('Failed to create link');
    }
  };
}

init();
