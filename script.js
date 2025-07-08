// --- Login persistence ---
function handleLogin() {
  const name = document.getElementById('loginUsername').value.trim();
  if (!name) return alert('Vui lòng nhập tên đăng nhập!');
  // lưu vào localStorage chỉ 1 lần
  localStorage.setItem('smartmall_username', name);
  currentUsername = name;
  // ẩn login, hiện app
  document.getElementById('login').style.display = 'none';
  document.getElementById('app').style.display   = 'block';
  initApp();
}

// --- Khi tải trang: nếu đã có username, skip login ---
let currentUsername = '';
window.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('smartmall_username');
  if (saved) {
    currentUsername = saved;
    document.getElementById('login').style.display = 'none';
    document.getElementById('app').style.display   = 'block';
    initApp();
  }
});

// --- Phần còn lại giữ nguyên, nhưng mọi chỗ dùng members.push sẽ dùng currentUsername ---
async function initApp() {
  // load state từ localStorage/GitHub
  await loadUserData(userId);

  // nếu userId chưa có trong members, thêm với currentUsername
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

  // referral link
  document.getElementById('referralLink').href      = referralLink;
  document.getElementById('referralLink').innerText = referralLink;

  // role-based rendering
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

// --- Phần còn lại giữ nguyên (saveState, loadState, các hàm render, handlers…) ---
