// === Login only once ===
const STORAGE_USER_KEY = 'smartmall_username';
let currentUsername = '';

// On DOM ready, check if username saved
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

// === Shared State ===
const state = {
  walletBalance: 100000,
  registrations: [],      // [{date:'dd/MM',time:ts},…]
  products: [
    { id:'012345678901234567890123', name:'Tai nghe Bluetooth', price:50000 },
    { id:'123456789012345678901234', name:'Quạt mini USB',     price:30000 },
    { id:'234567890123456789012345', name:'Đèn học cảm ứng',    price:45000 }
  ],
  pendingSales: [         // ví dụ cài sẵn
    // { id, name, salePrice, saleFee, sellDate }
  ],
  depositRequests: [],
  withdrawRequests: [],
  userNFT: []
};

let selectedDate = '';

// === Helpers ===
function fmt(n){ return n.toLocaleString('vi-VN'); }
function showSection(id){
  document.querySelectorAll('section').forEach(s=>s.classList.remove('show'));
  document.getElementById(id).classList.add('show');
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('btn-'+id).classList.add('active');
}
function updateWallet(){
  document.getElementById('walletBalance').innerText = fmt(state.walletBalance);
}

// === Init App ===
function initApp(){
  generateTabs();
  updateWallet();
  renderProducts();
  renderPendingSales();
  renderRequestHistory();
  // referral
  const botUsername = 'SmartMallonebot';
  const startParam = new URLSearchParams(location.search).get('start')||'guest';
  const link = `https://t.me/${botUsername}?start=${startParam}`;
  document.getElementById('referralLink').href      = link;
  document.getElementById('referralLink').innerText = link;
  showSection('home');
}

// === SESSION ===
function generateTabs(){
  const c = document.getElementById('sessionDateTabs'),
        txt = document.getElementById('selectedDateText'),
        today = new Date();
  state.registrations = state.registrations||[];
  for(let i=0;i<7;i++){
    const d=new Date(today); d.setDate(d.getDate()+i);
    const lbl=`${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
    const btn=document.createElement('button'); btn.textContent=lbl;
    btn.onclick=()=>{
      c.querySelectorAll('button').forEach(x=>x.classList.remove('active'));
      btn.classList.add('active');
      selectedDate=lbl; txt.textContent=lbl;
      updateSessionUI();
    };
    if(i===0){
      btn.classList.add('active');
      selectedDate=lbl; txt.textContent=lbl;
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
  if(state.walletBalance<20000){
    return alert('Không đủ 20 000 SML để đăng ký!');
  }
  document.getElementById('registerModal').style.display='flex';
}
function closeRegisterModal(){
  document.getElementById('registerModal').style.display='none';
}
function confirmRegister(){
  state.walletBalance-=20000; updateWallet();
  state.registrations.push({date:selectedDate,time:Date.now()});
  closeRegisterModal();
  updateSessionUI();
  alert(`Đã đăng ký phiên ngày ${selectedDate}`);
}
function joinSession(){
  const reg = state.registrations.find(r=>r.date===selectedDate);
  if(!reg) return alert('Bạn chưa đăng ký phiên ngày này!');
  document.getElementById('products').style.display='block';
  renderProducts(); renderPendingSales();
}

// === PRODUCTS & SALES ===
function renderProducts(){
  const c=document.getElementById('productList'); c.innerHTML='';
  state.products.forEach(p=>{
    c.innerHTML+=`
      <div class="product">
        <b>${p.name}</b><br>ID: ${p.id}<br>
        Giá: ${fmt(p.price)}<br>
        <button class="small" onclick="buyProduct('${p.id}')">Mua</button>
      </div>`;
  });
}
function buyProduct(id){
  const p=state.products.find(x=>x.id===id);
  if(!p||state.walletBalance<p.price) return alert('Không đủ SML!');
  state.walletBalance-=p.price; updateWallet();
  state.userNFT.push({...p,status:'bought'});
  state.products=state.products.filter(x=>x.id!==id);
  renderProducts(); renderNFTs();
}

function renderPendingSales(){
  const c=document.getElementById('pendingSaleList'); c.innerHTML='';
  state.pendingSales.filter(s=>s.sellDate===selectedDate).forEach(s=>{
    c.innerHTML+=`
      <div class="sale-item">
        <b>${s.name}</b><br>
        ID: ${s.id}<br>
        Giá gửi bán: ${fmt(s.salePrice)}<br>
        Ngày gửi: ${s.sellDate}<br>
        Phiên bán: ${s.sellDate}<br>
        <button class="small" onclick="buyPendingSale('${s.id}')">Mua</button>
      </div>`;
  });
}
function buyPendingSale(id){
  const idx=state.pendingSales.findIndex(x=>x.id===id);
  if(idx<0) return;
  const s=state.pendingSales[idx];
  if(state.walletBalance<s.salePrice) return alert('Không đủ SML!');
  state.walletBalance-=s.salePrice; updateWallet();
  state.userNFT.push({...s,status:'bought'});
  state.pendingSales.splice(idx,1);
  renderPendingSales(); renderNFTs();
}

// === NFT ===
function renderNFTs(){
  const c=document.getElementById('nftList'); c.innerHTML=''; let tot=0;
  if(!state.userNFT.length){
    c.textContent='Chưa có sản phẩm.'; return;
  }
  state.userNFT.forEach(it=>{
    tot+=it.price;
    let html=`<div class="nft-item"><b>${it.name}</b><br>ID:${it.id}<br>`;
    if(it.status==='bought') html+=`<button class="small" onclick="markPaid('${it.id}')">Đã thanh toán</button>`;
    else if(it.status==='owned') html+=`
      <button class="small" onclick="openNFT('${it.id}')">Mở</button>
      <button class="small" onclick="sellNFT('${it.id}')">Bán</button>`;
    html+=`</div>`;
    c.innerHTML+=html;
  });
  document.getElementById('totalSpent').textContent=fmt(tot);
}
// implement markPaid, openNFT, sellNFT as needed…

// === WALLET REQUESTS ===
function showDeposit(){
  document.getElementById('walletAction').innerHTML=`
    <h3>Nạp SML</h3>
    <input type="number" id="depositAmt" placeholder="Số SML"/>
    <button onclick="requestDeposit()">Gửi yêu cầu</button>`;
}
function requestDeposit(){
  const amt=parseFloat(document.getElementById('depositAmt').value);
  if(isNaN(amt)||amt<=0) return alert('Nhập số hợp lệ');
  state.depositRequests.push({
    id:Date.now()+'', userId:currentUsername,
    amount:amt, time:new Date().toLocaleString('vi-VN'),
    status:'pending', type:'deposit'
  });
  renderRequestHistory();
  document.getElementById('walletAction').innerHTML='';
}
function showWithdraw(){
  document.getElementById('walletAction').innerHTML=`
    <h3>Rút SML</h3>
    <input type="number" id="withdrawAmt" placeholder="Số SML"/>
    <button onclick="requestWithdraw()">Gửi yêu cầu</button>`;
}
function requestWithdraw(){
  const amt=parseFloat(document.getElementById('withdrawAmt').value);
  if(isNaN(amt)||amt<=0) return alert('Nhập số hợp lệ');
  const fee=Math.ceil(amt*0.015);
  if(amt+fee>state.walletBalance) return alert('Không đủ SML');
  state.withdrawRequests.push({
    id:Date.now()+'', userId:currentUsername,
    amount:amt, fee, time:new Date().toLocaleString('vi-VN'),
    status:'pending', type:'withdraw'
  });
  renderRequestHistory();
  document.getElementById('walletAction').innerHTML='';
}
function renderRequestHistory(){
  const all=state.depositRequests.concat(state.withdrawRequests)
    .sort((a,b)=>new Date(b.time)-new Date(a.time));
  document.getElementById('requestHistory').innerHTML=all.map(r=>`
    <tr><td>${r.type}</td><td>${r.amount}</td><td>${r.time}</td><td>${r.status}</td></tr>
  `).join('');
}

// === PROFILE ===
function saveProfile(){
  alert('Thông tin cá nhân đã lưu.');
}
