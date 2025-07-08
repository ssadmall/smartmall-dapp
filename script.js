// Telegram WebApp init
const tg = window.Telegram.WebApp;
tg.ready();

// Deep-link registration
const botUsername = 'SmartMallonebot';
const initData = tg.initDataUnsafe || {};
const userId = initData.user?.id || 'guest';
const referralUrl = `https://t.me/${botUsername}?start=${userId}`;

// … TRANSLATIONS, STATE, FUNCTIONS … (giữ nguyên) …

// Thêm sau window.onload khởi tạo
window.onload = () => {
  // Khởi tạo session tabs, ngôn ngữ, UI, wallet, history…
  generateSessionTabs();
  applyLanguage('vi');
  showSection('home');
  updateWalletDisplay();
  renderHistory();

  // ------ Referral setup ------
  const linkEl = document.getElementById('referralLink');
  linkEl.href = referralUrl;
  linkEl.innerText = referralUrl;

  // TODO: Thay real counts từ API nếu có; hiện tạm:
  document.getElementById('directRefCount').innerText = 0;
  document.getElementById('teamRefCount').innerText   = 0;
};
