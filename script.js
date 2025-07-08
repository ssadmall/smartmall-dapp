// ===== Đăng nhập 1 lần =====
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
function handleLogin(){
  const u = document.getElementById('usernameInput').value.trim();
  if (!u) return alert('Nhập username!');
  currentUsername = u;
  localStorage.setItem(STORAGE_USER_KEY, u);
  document.getElementById('login').style.display = 'none';
  document.getElementById('app').style.display   = 'block';
  initApp();
}

// ===== State chung =====
const state = {
  usdtPrice: 26400,
  walletBalance: 100000,
  registrations: [],
  products: [],
  pendingSales: [],
  userNFT: [],
  walletHistory: [],   // {desc,delta,time}
  requests: []         // {id,type,sml,usdt,address,time,status}
};
let selectedDate = '';

// ===== Helpers =====
function fmt(n){ return n.toLocaleString('vi-VN'); }
function randomId(){
  const chars='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let s=''; for(let i=0;i<18;i++) s+=chars[Math.floor(Math.random()*chars.length)];
  return s;
}
function randomColor(){
  return `hsl(${Math.random()*360|0},40%,30%)`;
}
function addWalletHistory(desc, delta){
  state.walletHistory.unshift({desc,delta,time:new Date().toLocaleString('vi-VN')});
  renderWalletHistory();
}
function showSection(id){
  document.querySelectorAll('section').forEach(s=>s.classList.remove('show'));
  document.getElementById(id).classList.add('show');
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('btn-'+id).classList.add('active');
}
function updateWallet(){
  document.getElementById('walletBalance').innerText = fmt(state.walletBalance);
}

// ===== Init App =====
function initApp(){
  // generate sample products
  state.products = ['Tai nghe Bluetooth','Quạt mini USB','Đèn cảm ứng']
    .map((n,i)=>({
      id: randomId(),
      name: n,
      price: [50000,30000,45000][i],
      seller: 'Admin'
    }));
  document.getElementById('profileUsername').innerText = currentUsername;
  generateTabs();
  updateWallet();
  renderProducts();
  renderPendingSales();
  renderNFTs();
  renderWalletHistory();
  renderRequestHistory();
  renderNFTHistory();
  // referral link
  const bot='SmartMallonebot';
  const start=new URLSearchParams(location.search).get('start')||'guest';
  const link=`https://t.me/${bot}?start=${start}`;
  document.getElementById('referralLink').href = link;
  document.getElementById('referralLink').innerText = link;
  showSection('home');
}

// ===== PHIÊN =====
function generateTabs(){
  const c=document.getElementById('sessionDateTabs'),
        txt=document.getElementById('selectedDateText'),
        t=new Date();
  for(let i=0;i<7;i++){
    const d=new Date(t); d.setDate(d.getDate()+i);
    const lbl=`${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
    const btn=document.createElement('button');
    btn.textContent = lbl;
    btn.onclick = () => {
      c.querySelectorAll('button').forEach(x=>x.classList.remove('active'));
      btn.classList.add('active');
      selectedDate = lbl; txt.textContent = lbl;
      updateSessionUI();
    };
    if(i===0){
      btn.classList.add('active');
      selectedDate = lbl;
      txt.textContent = lbl;
    }
    c.appendChild(btn);
  }
  updateSessionUI();
}
function updateSessionUI(){
  const reg = state.registrations.find(r=>r.date===selectedDate);
  document.getElementById('registrationBox').style.display = reg?'none':'block';
  document.getElementById('joinContainer').style.display   = reg?'block':'none';
  document.getElementById('products').style.display        = 'none';
}
function showRegisterModal(){
  if(state.walletBalance < 20000) return alert('Không đủ 20 000 SML');
  document.getElementById('registerModal').classList.add('show');
}
function closeRegisterModal(){
  document.getElementById('registerModal').classList.remove('show');
}
function confirmRegister(){
  state.walletBalance -= 20000; updateWallet();
  addWalletHistory('Phí đăng ký phiên', -20000);
  state.registrations.push({date:selectedDate,time:Date.now()});
  closeRegisterModal(); updateSessionUI();
  alert(`Đăng ký phiên ${selectedDate} thành công`);
}
function joinSession(){
  if(!state.registrations.find(r=>r.date===selectedDate)) return alert('Chưa đăng ký ngày này');
  document.getElementById('products').style.display='block';
  renderProducts(); renderPendingSales();
}

// ===== SẢN PHẨM =====
function renderProducts(){
  const c=document.getElementById('productList'); c.innerHTML='';
  state.products.forEach(p=>{
    const d=document.createElement('div');
    d.className='product';
    d.style.background=randomColor();
    d.innerHTML=`
      <b>${p.name}</b><br>ID:${p.id}<br>
      Giá:${fmt(p.price)} SML<br>
      <button class="small" onclick="buyProduct('${p.id}')">Mua</button>`;
    c.appendChild(d);
  });
}
function buyProduct(id){
  const p = state.products.find(x=>x.id===id);
  state.userNFT.push({...p,status:'bought'});
  state.requests.unshift({
    id:randomId(), type:'buy', sml:0, usdt:0,
    address:'', time:new Date().toLocaleString('vi-VN'), status:'done'
  });
  state.products = state.products.filter(x=>x.id!==id);
  state.nftHistory.unshift({
    id:p.id, name:p.name, price:p.price,
    time:new Date().toLocaleString('vi-VN'),
    action:'Mua'
  });
  renderProducts(); renderNFTs(); renderNFTHistory();
}
function renderPendingSales(){
  const c=document.getElementById('pendingSaleList'); c.innerHTML='';
  state.pendingSales.filter(s=>s.sellDate===selectedDate).forEach(s=>{
    const d=document.createElement('div');
    d.className='sale-item';
    d.style.background=randomColor();
    d.innerHTML=`
      <b>${s.name}</b><br>ID:${s.id}<br>
      Giá gửi bán:${fmt(s.salePrice)} SML<br>
      <button class="small" onclick="buyPendingSale('${s.id}')">Mua</button>`;
    c.appendChild(d);
  });
}
function buyPendingSale(id){
  const idx = state.pendingSales.findIndex(x=>x.id===id);
  const s = state.pendingSales[idx];
  state.userNFT.push({...s,status:'bought'});
  state.nftHistory.unshift({
    id:s.id,name:s.name,price:s.salePrice,
    time:new Date().toLocaleString('vi-VN'),
    action:'Mua lại'
  });
  state.pendingSales.splice(idx,1);
  renderPendingSales(); renderNFTs(); renderNFTHistory();
}

// ===== NFT =====
function renderNFTs(){
  const c=document.getElementById('nftList'); c.innerHTML=''; let tot=0;
  if(!state.userNFT.length){
    c.textContent='Chưa có sản phẩm.'; document.getElementById('totalSpent').innerText='0'; return;
  }
  state.userNFT.forEach(it=>{
    tot += it.price;
    const d=document.createElement('div');
    d.className='nft-item';
    d.style.background=randomColor();
    let btns='';
    if(it.status==='bought'){
      btns=`<button class="small" onclick="confirmPayment('${it.id}')">Thanh toán — ${fmt(it.price)} SML</button>`;
    } else if(it.status==='paid'){
      btns=`
        <button class="small" onclick="openNFT('${it.id}')">Mở (90%)</button>
        <button class="small" onclick="sellNFT('${it.id}')">Bán</button>`;
    } else if(it.status==='opened'){
      btns=`<p>Hoàn ${fmt(it.refund)} SML</p>`;
    } else if(it.status==='pendingSale'){
      btns=`<p>Đang treo bán: ${fmt(it.salePrice)} SML</p>`;
    }
    d.innerHTML = `<b>${it.name}</b><br>ID:${it.id}<br>${btns}`;
    c.appendChild(d);
  });
  document.getElementById('totalSpent').innerText = fmt(tot);
}
function confirmPayment(id){
  const it = state.userNFT.find(x=>x.id===id && x.status==='bought');
  if(state.walletBalance < it.price) return alert('Không đủ SML');
  state.walletBalance -= it.price; updateWallet();
  addWalletHistory(`Thanh toán ${it.name}`, -it.price);
  it.status = 'paid';
  state.nftHistory.unshift({
    id:it.id,name:it.name,price:it.price,
    time:new Date().toLocaleString('vi-VN'),
    action:'Thanh toán'
  });
  renderNFTs(); renderNFTHistory();
}
function openNFT(id){
  const it = state.userNFT.find(x=>x.id===id && x.status==='paid');
  const refund = Math.floor(it.price * 0.9);
  state.walletBalance += refund; updateWallet();
  addWalletHistory(`Hoàn NFT ${it.name}`, +refund);
  it.status = 'opened'; it.refund = refund;
  state.nftHistory.unshift({
    id:it.id,name:it.name,price:refund,
    time:new Date().toLocaleString('vi-VN'),
    action:'Mở NFT'
  });
  renderNFTs(); renderNFTHistory();
}
function sellNFT(id){
  const it = state.userNFT.find(x=>x.id===id && x.status==='paid');
  const profit = Math.floor(it.price * 0.015),
        fee    = Math.ceil(it.price * 0.034),
        salePrice = it.price + profit + fee;
  if(state.walletBalance < fee) return alert('Không đủ phí');
  if(!confirm(`Bán ${it.name}\nGiá bán: ${fmt(salePrice)} SML?`)) return;
  state.walletBalance -= fee; updateWallet();
  addWalletHistory(`Phí bán ${it.name}`, -fee);
  it.status = 'pendingSale';
  it.salePrice = salePrice;
  it.saleFee = fee;
  const d = new Date(); d.setDate(d.getDate()+1);
  it.sellDate = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
  state.pendingSales.push({
    id:it.id,name:it.name,
    salePrice, saleFee:fee, sellDate:it.sellDate
  });
  state.nftHistory.unshift({
    id:it.id,name:it.name,price:salePrice,
    time:new Date().toLocaleString('vi-VN'),
    action:'Gửi bán'
  });
  renderNFTs(); renderPendingSales(); renderNFTHistory();
}

// ===== NẠP / RÚT =====
function showDeposit(){
  document.getElementById('depositModal').classList.add('show');
}
function closeDepositModal(){
  document.getElementById('depositModal').classList.remove('show');
}
document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('depositSML').addEventListener('input', e=>{
    const v = parseFloat(e.target.value)||0;
    const usdt = (v/state.usdtPrice).toFixed(4);
    document.getElementById('requiredUSDT').innerText = `Cần chuyển: ${usdt} USDT`;
  });
});
function submitDeposit(){
  const v = parseFloat(document.getElementById('depositSML').value);
  if(isNaN(v)||v<=0) return alert('Nhập số SML hợp lệ');
  const usdt = +(v/state.usdtPrice).toFixed(4);
  state.requests.unshift({
    id: randomId(),
    type:'deposit',
    sml: v,
    usdt,
    address: document.getElementById('depositAddress').innerText,
    time: new Date().toLocaleString('vi-VN'),
    status: 'pending'
  });
  renderRequestHistory();
  closeDepositModal();
  alert('Yêu cầu nạp đã được ghi nhận, chờ admin duyệt.');
}
// Admin duyệt nạp:
function approveDeposit(id){
  const req = state.requests.find(r=>r.id===id && r.type==='deposit');
  if(!req) return alert('Không tìm thấy yêu cầu');
  if(req.status!=='pending') return alert('Yêu cầu đã xử lý');
  state.walletBalance += req.sml; updateWallet();
  addWalletHistory('Nạp SML', +req.sml);
  req.status = 'approved';
  renderRequestHistory();
  alert(`Đã duyệt nạp ${fmt(req.sml)} SML`);
}

function showWithdraw(){
  document.getElementById('withdrawModal').classList.add('show');
}
function closeWithdrawModal(){
  document.getElementById('withdrawModal').classList.remove('show');
}
function submitWithdraw(){
  const amt = parseFloat(document.getElementById('withdrawAmt').value);
  if(isNaN(amt) || amt < 1000000)     return alert('Min rút là 1 000 000 SML');
  if(amt > state.walletBalance)       return alert('Số dư không đủ');
  state.requests.unshift({
    id: randomId(),
    type:'withdraw',
    sml: amt,
    usdt:0,
    address:'',
    time: new Date().toLocaleString('vi-VN'),
    status:'pending'
  });
  renderRequestHistory();
  closeWithdrawModal();
  alert('Yêu cầu rút đã được gửi, chờ admin duyệt.');
}
// Admin duyệt rút:
function approveWithdraw(id){
  const req = state.requests.find(r=>r.id===id && r.type==='withdraw');
  if(!req) return alert('Không tìm thấy yêu cầu');
  if(req.status!=='pending') return alert('Yêu cầu đã xử lý');
  state.walletBalance -= req.sml; updateWallet();
  addWalletHistory('Rút SML', -req.sml);
  req.status = 'approved';
  renderRequestHistory();
  alert(`Đã duyệt rút ${fmt(req.sml)} SML`);
}

// ===== RENDER LỊCH SỬ =====
function renderWalletHistory(){
  const c = document.getElementById('walletHistory');
  if(!state.walletHistory.length){
    c.textContent = 'Chưa có giao dịch.'; return;
  }
  c.innerHTML = state.walletHistory.map(h=>{
    const cls = h.delta<0?'neg':'pos';
    return `<div><span>${h.time}:</span>
      <span class="${cls}">${h.delta>0?'+':''}${fmt(h.delta)} SML</span> – ${h.desc}
    </div>`;
  }).join('');
}
function renderRequestHistory(){
  document.getElementById('requestHistory').innerHTML =
    state.requests.map(r=>`
      <tr>
        <td>${r.type}</td>
        <td>${fmt(r.sml)}</td>
        <td>${r.usdt||''}</td>
        <td>${r.address||''}</td>
        <td>${r.time}</td>
        <td>${r.status}</td>
      </tr>
    `).join('');
}
function renderNFTHistory(){
  const ul = document.getElementById('nftHistory');
  if(!state.nftHistory.length){
    ul.textContent='Chưa có lịch sử.'; return;
  }
  ul.innerHTML = state.nftHistory.map(x=>
    `<li>${x.time}: [${x.action}] ${x.name} — ${fmt(x.price)} SML</li>`
  ).join('');
}

// ===== PROFILE =====
function saveProfile(){ alert('Thông tin đã lưu.'); }
