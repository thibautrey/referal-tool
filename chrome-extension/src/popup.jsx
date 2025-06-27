import React, { useState, useEffect } from 'react';

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

export default function Popup() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [result, setResult] = useState('');

  useEffect(() => {
    getStored('token').then(t => t && setLoggedIn(true));
  }, []);

  const handleLogin = async () => {
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
      setLoggedIn(true);
    } catch (e) {
      alert('Login failed');
    }
  };

  const handleCreate = async () => {
    try {
      const link = await apiRequest('/links', 'POST', { name, baseUrl: url, shortCode: '' });
      const shortUrl = `https://rflnk.com/l/${link.shortCode}`;
      await navigator.clipboard.writeText(shortUrl);
      setResult(shortUrl);
    } catch (e) {
      alert('Failed to create link');
    }
  };

  return (
    <div className="p-4 space-y-2">
      {!loggedIn ? (
        <div className="space-y-2">
          <input className="w-full border rounded-md p-2" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
          <input type="password" className="w-full border rounded-md p-2" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
          <button className="w-full bg-primary text-primary-foreground py-2 rounded-md" onClick={handleLogin}>Login</button>
        </div>
      ) : (
        <div className="space-y-2">
          <input className="w-full border rounded-md p-2" value={name} onChange={e => setName(e.target.value)} placeholder="Link name" />
          <input className="w-full border rounded-md p-2" value={url} onChange={e => setUrl(e.target.value)} placeholder="Destination URL" />
          <button className="w-full bg-primary text-primary-foreground py-2 rounded-md" onClick={handleCreate}>Create Link</button>
        </div>
      )}
      {result && <div className="mt-2 text-primary font-medium break-all"><a href={result} target="_blank" rel="noopener noreferrer">{result}</a> <span className="text-green-600">(copied!)</span></div>}
    </div>
  );
}
