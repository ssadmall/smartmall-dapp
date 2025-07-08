// === Persistence: localStorage & GitHub API ===
const STORAGE_STATE_KEY = 'smartmall_state';
const STORAGE_USER_KEY  = 'smartmall_username';

async function loadUserData(userId) {
  loadFromLocal();
  const path = `data/${userId}.json`;
  const res = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`, {
    headers: { Authorization: `token ${GITHUB_TOKEN}` }
  });
  if (res.status === 200) {
    const { content, sha } = await res.json();
    const data = JSON.parse(atob(content.replace(/\n/g, '')));
    Object.assign(state, data);
    window._userDataSha = sha;
  }
}

async function saveUserData(userId) {
  const path = `data/${userId}.json`;
  const body = {
    message: `Update data for ${userId} @ ${new Date().toISOString()}`,
    content: btoa(JSON.stringify(state, null, 2)),
    branch: GITHUB_BRANCH,
    sha: window._userDataSha
  };
  const res = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  const json = await res.json();
  window._userDataSha = json.content.sha;
}

function saveToLocal() {
  localStorage.setItem(STORAGE_STATE_KEY, JSON.stringify(state));
}
function loadFromLocal() {
  const s = localStorage.getItem(STORAGE_STATE_KEY);
  if (s) Object.assign(state, JSON.parse(s));
}

// === Shared state ===
const state = {
  walletBalance: 100000,
  members: [],
  usageLogs: [],
  walletHistory: [],
  depositRequests: [],
  withdrawRequests: [],
  products: [
    { id: '012345678901234567890123', name: 'Tai nghe Bluetooth', price: 50000 },
    { id: '123456789012345678901234', name: 'Quạt mini USB', price: 30000 },
    { id: '234567890123456789012345', name: 'Đèn học cảm ứng', price: 45000 }
  ],
  pendingSales: [],
  userNFT: [],
  totalSpent: 0
};

// === Telegram & Referral ===
let tg, userId = 'guest';
if (window.Telegram?.WebApp) {
  tg = Telegram.WebApp; tg.ready();
  userId = tg.initDataUnsafe?.user?.id ?? 'guest';
}
const adminID = '7980638669';
const botUsername = 'SmartMallonebot';
const startParam = new URLSearchParams(location.search).get('start') || 'guest';
const referralLink = `https://t.me/${botUsername}?start=${startParam}`;

// === Helpers ===
function fmt(n) { return n.toLocaleString('vi-VN'); }
function updateWallet() { document.getElementById('walletBalance').innerText = fmt(state.walletBalance); }

async function addHistory(desc, delta, targetUserId = userId) {
  state.walletHistory.unshift({ desc, delta, time: new Date().toLocaleString('vi-VN') });
  state.usageLogs.unshift({
    id: targetUserId,
    username: state.members.find(m => m.id === targetUserId)?.username || targetUserId,
    action: desc,
    time: new Date().toLocaleString('vi-VN')
  });
  renderHistory();
  renderUsageLogs();
  renderRequestHistory();
  saveToLocal();
  await saveUserData(userId);
}

function renderHistory() {
  const h = document.getElementById('walletHistory');
  if (!state.walletHistory.length) return h.innerText = 'Chưa có giao dịch';
  h.innerHTML = state.walletHistory.map(x => `
    <div>[${x.time}] 
      <span class="${x.delta < 0 ? 'neg' : 'pos'}">
        ${x.delta > 0 ? '+' : ''}${fmt(Math.abs(x.delta))}
      </span> SML – ${x.desc}
    </div>
  `).join('');
}
function renderUsageLogs() {
  const tb = document.getElementById('adminUsageLogs');
  tb.innerHTML = state.usageLogs.map(u => `
    <tr><td>${u.id}</td><td>${u.username}</td><td>${u.action}</td><td>${u.time}</td></tr>
  `).join('');
}

function showSection(id) {
  document.querySelectorAll('section').forEach(s => s.classList.remove('show'));
  document.getElementById(id).classList.add('show');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('btn-' + id).classList.add('active');
}

// === Tabs ===
function generateTabs() {
  const c = document.getElementById('sessionDateTabs'), txt = document.getElementById('selectedDateText'), today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today); d.setDate(d.getDate() + i);
    const lbl = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    const btn = document.createElement('button'); btn.textContent = lbl;
    btn.onclick = () => {
      document.querySelectorAll('.date-tab-bar button').forEach(x => x.classList.remove('active'));
      btn.classList.add('active');
      txt.innerText = lbl;
      addHistory('Chọn ngày phiên', 0);
    };
    if (i === 0) { btn.classList.add('active'); txt.innerText = lbl; }
    c.appendChild(btn);
  }
}

// === Profile ===
function saveProfile() {
  alert('Thông tin cá nhân đã lưu.');
  addHistory('Cập nhật thông tin cá nhân', 0);
}

// === Register / Join ===
function showRegisterModal() {
  if (state.walletBalance < 20000) return alert('Không đủ SML!');
  document.getElementById('registerModal').style.display = 'flex';
}
function closeRegisterModal() {
  document.getElementById('registerModal').style.display = 'none';
}
async function confirmRegister() {
  const amt = parseFloat(document.getElementById('registerAmount').value);
  if (isNaN(amt) || amt <= 0) return alert('Nhập số tiền hợp lệ!');
  state.walletBalance -= 20000; updateWallet();
  await addHistory('Phí đăng ký phiên', -20000);
  document.getElementById('registrationBox').innerHTML = `<p>Đã đăng ký: ${fmt(amt)}</p>`;
  document.getElementById('joinContainer').style.display = 'block';
  closeRegisterModal();

  const regDate = new Date().toLocaleString('vi-VN');
  state.members.find(m => m.id === userId).registerDate = regDate;
  saveToLocal(); await saveUserData(userId);
}

async function joinSession() {
  state.walletBalance += 20000; updateWallet();
  await addHistory('Hoàn phí đăng ký', +20000);
  document.getElementById('products').style.display = 'block';
  renderProducts(); renderPendingSales();
}

// === Products & NFT ===
function renderProducts() {
  const c = document.getElementById('productList'); c.innerHTML = '';
  state.products.forEach(p => {
    c.innerHTML += `<div class="product">
      <b>${p.name}</b><br>ID: ${p.id}<br>Giá: ${fmt(p.price)}<br>
      <button class="small" onclick="buyProduct('${p.id}')">Mua</button>
    </div>`;
  });
}
async function buyProduct(id) {
  const p = state.products.find(x => x.id === id); if (!p) return;
  state.userNFT.push({ ...p, status: 'bought' });
  state.products = state.products.filter(x => x.id !== id);
  state.members.find(m => m.id === userId).purchasedCount++;
  await addHistory(`Mua ${p.name}`, -p.price);
  renderProducts(); renderNFTs(); renderUsageLogs();
}

function renderPendingSales() {
  const c = document.getElementById('pendingSaleList'); c.innerHTML = '';
  const today = document.getElementById('selectedDateText').innerText;
  state.pendingSales.filter(s => s.sellDate === today).forEach(s => {
    c.innerHTML += `<div class="sale-item">
      <b>${s.name}</b><br>ID:${s.id}<br>Giá bán:${fmt(s.salePrice)}<br>Phí:${fmt(s.saleFee)}<br>
      <button class="small" onclick="buyPendingSale('${s.id}')">Mua</button>
    </div>`;
  });
}
async function buyPendingSale(id) {
  const idx = state.pendingSales.findIndex(x => x.id === id); if (idx < 0) return;
  const s = state.pendingSales[idx];
  if (state.walletBalance < s.salePrice) return alert('Không đủ SML!');
  state.walletBalance -= s.salePrice; updateWallet();
  await addHistory(`Mua ${s.name}`, -s.salePrice);
  state.userNFT.push({ ...s, status: 'bought' });
  state.pendingSales.splice(idx, 1);
  renderPendingSales(); renderNFTs(); renderUsageLogs();
}

function renderNFTs() {
  const c = document.getElementById('nftList'); c.innerHTML = ''; let tot = 0;
  if (!state.userNFT.length) return c.innerText = 'Chưa có sản phẩm.';
  state.userNFT.forEach(it => {
    tot += it.price;
    let html = `<div class="nft-item"><b>${it.name}</b><br>ID:${it.id}<br>`;
    if (it.status === 'bought') html += `<button class="small" onclick="markPaid('${it.id}')">Đã thanh toán</button>`;
    else if (it.status === 'owned') html += `<button class="small" onclick="openNFT('${it.id}')">Mở</button>
      <button class="small" onclick="sellNFT('${it.id}')">Bán</button>`;
    html += `</div>`;
    c.innerHTML += html;
  });
  document.getElementById('totalSpent').innerText = fmt(tot);
}
async function markPaid(id) {
  const it = state.userNFT.find(x => x.id === id); if (!it || state.walletBalance < it.price) return alert('Không đủ SML!');
  state.walletBalance -= it.price; updateWallet();
  await addHistory('Thanh toán', -it.price);
  it.status = 'owned'; renderNFTs(); renderUsageLogs();
}
async function openNFT(id) {
  const it = state.userNFT.find(x => x.id === id); if (!it) return;
  const rf = it.price * 0.9;
  state.walletBalance += rf; updateWallet();
  await addHistory('Hoàn NFT', rf);
  it.status = 'opened'; renderNFTs(); alert(`Bạn nhận ${fmt(rf)} SML`);
}
async function sellNFT(id) {
  const it = state.userNFT.find(x => x.id === id); if (!it) return;
  const profit = it.price * 0.015, fee = it.price * 0.034, salePrice = it.price + profit + fee;
  if (state.walletBalance < fee) return alert('Không đủ SML trả phí!');
  state.walletBalance -= fee; updateWallet();
  await addHistory('Phí gửi bán', -fee);
  it.status = 'pendingSale'; it.salePrice = salePrice;
  const tm = new Date(); tm.setDate(tm.getDate() + 1);
  it.sellDate = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(tm);
  state.pendingSales.push({ ...it });
  renderNFTs(); renderPendingSales(); renderUsageLogs();
}

// === Wallet Requests ===
function showDeposit() {
  document.getElementById('walletAction').innerHTML = `
    <h3>Nạp SML</h3>
    <input type="number" id="depositAmt" placeholder="Số SML"/>
    <button onclick="requestDeposit()">Gửi yêu cầu</button>`;
}
async function requestDeposit() {
  const amt = parseFloat(document.getElementById('depositAmt').value);
  if (isNaN(amt) || amt <= 0) return alert('Nhập số hợp lệ');
  state.depositRequests.push({
    id: Date.now() + '', userId, amount: amt,
    time: new Date().toLocaleString('vi-VN'),
    status: 'pending', type: 'deposit'
  });
  await addHistory(`Yêu cầu nạp ${amt}`, 0);
  renderRequestHistory(); renderDepositRequests();
  document.getElementById('walletAction').innerHTML = '';
}

function showWithdraw() {
  document.getElementById('walletAction').innerHTML = `
    <h3>Rút SML</h3>
    <input type="number" id="withdrawAmt" placeholder="Số SML"/>
    <button onclick="requestWithdraw()">Gửi yêu cầu</button>`;
}
async function requestWithdraw() {
  const amt = parseFloat(document.getElementById('withdrawAmt').value);
  if (isNaN(amt) || amt <= 0) return alert('Nhập số hợp lệ');
  const fee = Math.ceil(amt * 0.015);
  if (amt + fee > state.walletBalance) return alert('Không đủ SML');
  state.withdrawRequests.push({
    id: Date.now() + '', userId, amount: amt, fee,
    time: new Date().toLocaleString('vi-VN'),
    status: 'pending', type: 'withdraw'
  });
  await addHistory(`Yêu cầu rút ${amt}`, 0);
  renderRequestHistory(); renderWithdrawRequests();
  document.getElementById('walletAction').innerHTML = '';
}

function renderRequestHistory() {
  const tb = document.getElementById('requestHistory');
  const all = state.depositRequests.concat(state.withdrawRequests)
    .sort((a, b) => new Date(b.time) - new Date(a.time));
  tb.innerHTML = all.map(r => `
    <tr><td>${r.type}</td><td>${r.amount}</td><td>${r.time}</td><td>${r.status}</td></tr>
  `).join('');
}

function renderDepositRequests() {
  const tb = document.getElementById('depositRequestsList');
  tb.innerHTML = state.depositRequests.map(r => `
    <tr>
      <td>${r.userId}</td><td>${r.amount}</td><td>${r.time}</td>
      <td>${r.status==='pending'
        ? `<button onclick="approveDeposit('${r.id}')">Approve</button>
           <button onclick="rejectDeposit('${r.id}')">Reject</button>`
        : r.status}</td>
    </tr>
  `).join('');
}
async function approveDeposit(id) {
  const r = state.depositRequests.find(x => x.id === id);
  if (!r || r.status !== 'pending') return;
  state.walletBalance += r.amount; updateWallet();
  r.status = 'approved';
  await addHistory(`Admin duyệt nạp ${r.amount}`, 0);
  renderDepositRequests(); renderRequestHistory();
}
function rejectDeposit(id) {
  const r = state.depositRequests.find(x => x.id === id);
  if (r && r.status === 'pending') { r.status = 'rejected'; renderDepositRequests(); }
}

function renderWithdrawRequests() {
  const tb = document.getElementById('withdrawRequestsList');
  tb.innerHTML = state.withdrawRequests.map(r => `
    <tr>
      <td>${r.userId}</td><td>${r.amount}</td><td>${r.time}</td>
      <td>${r.status==='pending'
        ? `<button onclick="approveWithdraw('${r.id}')">Approve</button>
           <button onclick="rejectWithdraw('${r.id}')">Reject</button>`
        : r.status}</td>
    </tr>
  `).join('');
}
async function approveWithdraw(id) {
  const r = state.withdrawRequests.find(x => x.id === id);
  if (!r || r.status !== 'pending') return;
  state.walletBalance -= (r.amount + r.fee); updateWallet();
  r.status = 'approved';
  await addHistory(`Admin duyệt rút ${r.amount}`, 0);
  renderWithdrawRequests(); renderRequestHistory();
}
function rejectWithdraw(id) {
  const r = state.withdrawRequests.find(x => x.id === id);
  if (r && r.status === 'pending') { r.status = 'rejected'; renderWithdrawRequests(); }
}

// === Admin Panel render ===
function renderAdminPanel() {
  const mb = document.getElementById('adminMemberList');
  mb.innerHTML = state.members.map(m => `
    <tr><td>${m.id}</td><td>${m.username}</td><td>${fmt(m.balance)}</td>
    <td>${m.registerDate}</td><td>${m.purchasedCount}</td>
    <td>${m.directRefCount}</td><td>${m.teamRefCount}</td></tr>`).join('');
  renderUsageLogs();
  renderDepositRequests();
  renderWithdrawRequests();
}

// === Login & Init ===
function handleLogin() { /* như trên */ }
async function initApp() { /* như trên */ }

// DOMContentLoaded đã tự động gọi handleLogin/initApp
