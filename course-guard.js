document.documentElement.style.visibility = 'hidden';

(async () => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      const target = encodeURIComponent(window.location.pathname.split('/').pop() || 'dashboard.html');
      window.location.replace('login.html?next=' + target);
      return;
    }
    document.documentElement.style.visibility = 'visible';
  } catch (err) {
    window.location.replace('login.html');
  }
})();
