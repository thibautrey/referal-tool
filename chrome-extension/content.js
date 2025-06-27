(function(){
  try {
    const token = localStorage.getItem('auth_token');
    if (token) {
      chrome.runtime.sendMessage({type: 'SET_TOKEN', token});
    }
  } catch (e) {
    console.error('rflnk extension token error', e);
  }
})();
