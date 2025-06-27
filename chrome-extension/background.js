const API_URL = 'https://rflnk.com/api';

function getStored(key) {
  return new Promise(resolve => {
    chrome.storage.local.get(key, result => resolve(result[key]));
  });
}

function setStored(obj) {
  return new Promise(resolve => {
    chrome.storage.local.set(obj, resolve);
  });
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

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'create-link',
    title: 'Create rflnk from selection',
    contexts: ['selection']
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'create-link' && info.selectionText) {
    try {
      const link = await apiRequest('/links', 'POST', {
        name: info.selectionText,
        baseUrl: info.selectionText,
        shortCode: ''
      });
      const url = `https://rflnk.com/l/${link.shortCode}`;
      await navigator.clipboard.writeText(url);
      chrome.notifications.create({
        type: 'basic',
        iconUrl: '',
        title: 'rflnk',
        message: 'Link created and copied!'
      });
    } catch (e) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: '',
        title: 'rflnk',
        message: 'Failed to create link'
      });
    }
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SET_TOKEN') {
    setStored({ token: message.token });
  }
});
