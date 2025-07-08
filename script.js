// ==== LOGIN LẦN ĐẦU DUY NHẤT ====
const STORAGE_USER_KEY = 'smartmall_username';
let currentUsername = '';

document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem(STORAGE_USER_KEY);
  if (saved) {
    currentUsername = saved;
    document.getElementById('login').style.display = 'none';
    document.getElementById('app').style.display   = 'block';
    initApp();
  }
  document.getElementById('loginBtn').addEventListener('click', handleLogin);
});

function handleLogin() {
  const uname = document.getElementById('usernameInput').value.trim();
  if (!uname) return alert('Vui lòng nhập username!');
  currentUsername = uname;
  localStorage.setItem(STORAGE_USER_KEY, currentUsername);
  document.getElementById('login').style.display = 'none';
  document.getElementById('app').style.display   = 'block';
  initApp();
}

// ==== SHARED STATE & HELPERS ====
const state = {
  walletBalance: 100000,
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

function fmt(n) { return n.toLocaleString('vi-VN'); }
function showSection(id) {
  document.querySelectorAll('section').forEach(s => s.classList.remove('show'));
  document.getElementById(id).classList.add('show');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('btn-' + id).classList.add('active');
}

// ==== INIT APP ====
function initApp() {
  generateTabs();
  updateWallet();
  renderProducts();
  renderPendingSales();
  renderRequestHistory();
  // referral link
  const botUsername = 'SmartMallonebot';
  const startParam = new URLSearchParams(location.search).get('start') || 'guest';
  const link = `https://t.me/${botUsername}?start=${startParam}`;
  document.getElementById('referralLink').href      = link;
  document.getElementById('referralLink').innerText = link;
  // show home by default
  showSection('home');
}

// ==== SESSION ====
function generateTabs() {
  const container = document.getElementById('sessionDateTabs');
  const selectedText = document.getElementById('selectedDateText');
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const lbl = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
    const btn = document.createElement('button');
    btn.textContent = lbl;
    btn.onclick = () => {
      container.querySelectorAll('button').forEach(x => x.classList.remove('active'));
      btn.classList.add('active');
      selectedText.textContent = lbl;
    };
    if (i === 0) {
      btn.classList.add('active');
      selectedText.textContent = lbl;
    }
    container.appendChild(btn);
  }
}

// Đăng ký phiên
function showRegisterModal() {
  if (state.walletBalance < 20000) return alert('Không đủ SML để đăng ký!');
  document.getElementById('registerModal').style.display = 'flex';
}
function closeRegisterModal() {
  document.getElementById('registerModal').style.display = 'none';
}
function confirmRegister() {
  const amt = parseFloat(document.getElementById('registerAmount').value);
  if (isNaN(amt) || amt <= 0) return alert('Nhập số tiền hợp lệ!');
  state.walletBalance -= 20000;
  updateWallet();
  document.getElementById('registrationBox').innerHTML = `<p>Đã đăng ký: ${fmt(amt)}</p>`;
  document.getElementById('joinContainer').style.display = 'block';
  closeRegisterModal();
}

// Tham gia phiên
function joinSession() {
  // hoàn lại phí
  state.walletBalance += 20000;
  updateWallet();
  document.getElementById('products').style.display = 'block';
}

// Hiển thị sản phẩm
function renderProducts() {
  const c = document.getElementById('productList');
  c.innerHTML = '';
  state.products.forEach(p => {
    c.innerHTML += `
      <div class="product">
        <b>${p.name}</b><br>ID: ${p.id}<br>Giá: ${fmt(p.price)}<br>
        <button class="small" onclick="buyProduct('${p.id}')">Mua</button>
      </div>`;
  });
}
function buyProduct(id) {
  const p = state.products.find(x => x.id === id);
  if (!p) return;
  state.userNFT.push({...p, status:'bought'});
  state.products = state.products.filter(x => x.id !== id);
  state.walletBalance -= p.price;
  updateWallet();
  renderProducts();
  renderNFTs();
}

// ==== PENDING SALES & NFT ====
function renderPendingSales() {
  const c = document.getElementById('pendingSaleList');
  c.innerHTML = '';
  const today = document.getElementById('selectedDateText').textContent;
  state.pendingSales
    .filter(s => s.sellDate === today)
    .forEach(s => {
      c.innerHTML += `
        <div class="sale-item">
          <b>${s.name}</b><br>ID: ${s.id}<br>
          Giá bán: ${fmt(s.salePrice)}<br>
          <button class="small" onclick="buyPendingSale('${s.id}')">Mua</button>
        </div>`;
    });
}
function buyPendingSale(id) {
  const idx = state.pendingSales.findIndex(x => x.id === id);
  if (idx < 0) return;
  const s = state.pendingSales[idx];
  if (state.walletBalance < s.salePrice) return alert('Không đủ SML!');
  state.walletBalance -= s.salePrice;
  updateWallet();
  state.userNFT.push({...s, status:'bought'});
  state.pendingSales.splice(idx,1);
  renderPendingSales();
  renderNFTs();
}

// NFT
function renderNFTs() {
  const c = document.getElementById('nftList');
  c.innerHTML = '';
  let total = 0;
  if (!state.userNFT.length) {
    c.textContent = 'Chưa có sản phẩm.';
  } else {
    state.userNFT.forEach(it => {
      total += it.price;
      let html = `<div class="nft-item"><b>${it.name}</b><br>ID: ${it.id}<br>`;
      if (it.status === 'bought') {
        html += `<button class="small" onclick="markPaid('${it.id}')">Đã thanh toán</button>`;
      } else if (it.status === 'owned') {
        html += `
          <button class="small" onclick="openNFT('${it.id}')">Mở</button>
          <button class="small" onclick="sellNFT('${it.id}')">Bán</button>`;
      }
      html += `</div>`;
      c.innerHTML += html;
    });
  }
  document.getElementById('totalSpent').textContent = fmt(total);
}
// markPaid, openNFT, sellNFT bạn vẫn giữ logic như trước…

// ==== WALLET REQUESTS ====
function showDeposit() {
  document.getElementById('walletAction').innerHTML = `
    <h3>Nạp SML</h3>
    <input type="number" id="depositAmt" placeholder="Số SML"/>
    <button onclick="requestDeposit()">Gửi yêu cầu</button>`;
}
function requestDeposit() {
  const amt = parseFloat(document.getElementById('depositAmt').value);
  if (isNaN(amt)||amt<=0) return alert('Nhập số hợp lệ');
  state.depositRequests.push({
    id:Date.now()+'', userId:currentUsername, amount:amt,
    time:new Date().toLocaleString('vi-VN'), status:'pending', type:'deposit'
  });
  renderRequestHistory();
  document.getElementById('walletAction').innerHTML = '';
}
function showWithdraw() {
  document.getElementById('walletAction').innerHTML = `
    <h3>Rút SML</h3>
    <input type="number" id="withdrawAmt" placeholder="Số SML"/>
    <button onclick="requestWithdraw()">Gửi yêu cầu</button>`;
}
function requestWithdraw() {
  const amt = parseFloat(document.getElementById('withdrawAmt').value);
  if (isNaN(amt)||amt<=0) return alert('Nhập số hợp lệ');
  const fee = Math.ceil(amt*0.015);
  if (amt+fee>state.walletBalance) return alert('Không đủ SML');
  state.withdrawRequests.push({
    id:Date.now()+'', userId:currentUsername, amount:amt, fee,
    time:new Date().toLocaleString('vi-VN'), status:'pending', type:'withdraw'
  });
  renderRequestHistory();
  document.getElementById('walletAction').innerHTML = '';
}
function renderRequestHistory() {
  const tb = document.getElementById('requestHistory');
  const all = state.depositRequests.concat(state.withdrawRequests)
    .sort((a,b)=>new Date(b.time)-new Date(a.time));
  tb.innerHTML = all.map(r=>`
    <tr>
      <td>${r.type}</td><td>${r.amount}</td><td>${r.time}</td><td>${r.status}</td>
    </tr>`).join('');
}

// ==== PROFILE ====
function saveProfile() {
  alert('Thông tin cá nhân đã lưu.');
}
