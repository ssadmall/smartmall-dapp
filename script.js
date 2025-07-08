// ==== Login only once ====
const STORAGE_USER_KEY = 'smartmall_username';
let currentUsername = '';

document.addEventListener('DOMContentLoaded', () => {
  // nếu đã lưu username thì show app ngay
  const saved = localStorage.getItem(STORAGE_USER_KEY);
  if (saved) {
    currentUsername = saved;
    document.getElementById('login').style.display = 'none';
    document.getElementById('app').style.display   = 'block';
    initApp();
  }
  // gán event cho nút login
  document.getElementById('loginBtn').addEventListener('click', handleLogin);
});

function handleLogin() {
  const uname = document.getElementById('usernameInput').value.trim();
  if (!uname) return alert('Vui lòng nhập username!');
  currentUsername = uname;
  localStorage.setItem(STORAGE_USER_KEY, currentUsername);
  // ẩn form login, show app
  document.getElementById('login').style.display = 'none';
  document.getElementById('app').style.display   = 'block';
  initApp();
}

// ==== Phần còn lại ====
async function initApp() {
  // load và sync state (local + GitHub)
  await loadUserData(userId);

  // thêm member mới nếu chưa có
  if (!state.members.find(m => m.id === userId)) {
    state.members.push({
      id: userId,
      username: currentUsername,
      balance: state.walletBalance,
      registerDate: new Date().toLocaleString('vi-VN'),
      purchasedCount: 0,
      directRefCount: 0,
      teamRefCount: 0
    });
    saveToLocal();
    await saveUserData(userId);
  }

  // init UI
  generateTabs();
  updateWallet();
  renderHistory();
  renderRequestHistory();
  renderDepositRequests();
  renderWithdrawRequests();
  renderProducts();
  renderPendingSales();
  renderNFTs();
  document.getElementById('referralLink').href      = referralLink;
  document.getElementById('referralLink').innerText = referralLink;

  // role–based
  if (userId === adminID) {
    ['home','session','nft','wallet','profile'].forEach(id=>{
      document.getElementById(id).style.display       = 'none';
      document.getElementById('btn-'+id).style.display = 'none';
    });
    document.getElementById('admin').classList.add('show');
    const btn = document.getElementById('btn-admin');
    btn.style.display = 'flex';
    btn.classList.add('active');
    renderAdminPanel();
  } else {
    showSection('home');
    document.getElementById('btn-admin').style.display = 'none';
  }
}

// … Phần còn lại giữ nguyên (state, GitHub API, các hàm render, handlers…) …
