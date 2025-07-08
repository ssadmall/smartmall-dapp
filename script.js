// --- Persistence: localStorage & GitHub API ---
const STORAGE_KEY = 'smartmall_state';
async function loadUserData(userId) {
  loadFromLocal();
  const path = `data/${userId}.json`;
  const res = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`, {
    headers: { Authorization: `token ${GITHUB_TOKEN}` }
  });
  if (res.status === 200) {
    const { content, sha } = await res.json();
    const data = JSON.parse(atob(content.replace(/\n/g,'')));
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
    headers: { Authorization: `token ${GITHUB_TOKEN}`, 'Content-Type':'application/json' },
    body: JSON.stringify(body)
  });
  const json = await res.json();
  window._userDataSha = json.content.sha;
}
function saveToLocal() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function loadFromLocal() {
  const s = localStorage.getItem(STORAGE_KEY);
  if (s) Object.assign(state, JSON.parse(s));
}

// --- Shared state ---
const state = {
  walletBalance:100000,
  members:[],
  usageLogs:[],
  walletHistory:[],
  depositRequests:[],
  withdrawRequests:[],
  products:[
    {id:'012345678901234567890123',name:'Tai nghe Bluetooth',price:50000},
    {id:'123456789012345678901234',name:'Quạt mini USB',price:30000},
    {id:'234567890123456789012345',name:'Đèn học cảm ứng',price:45000},
  ],
  pendingSales:[],
  userNFT:[],
  totalSpent:0
};

// --- Telegram & Referral ---
let tg, userId='guest';
if(window.Telegram?.WebApp){ tg=Telegram.WebApp; tg.ready(); userId = tg.initDataUnsafe?.user?.id||'guest'; }
const adminID='7980638669', startParam=new URLSearchParams(location.search).get('start')||'guest';
const botUsername='SmartMallonebot', referralLink=`https://t.me/${botUsername}?start=${startParam}`;

// --- Helpers/UI---
// (Hàm fmt, updateWallet, addHistory, renderHistory, renderUsageLogs,
//  showSection, generateTabs, renderRequestHistory, renderDepositRequests,
//  renderWithdrawRequests, renderProducts, renderPendingSales, renderNFTs,
//  và tất cả các handler như showDeposit, requestDeposit, approveDeposit,
//  showWithdraw, requestWithdraw, approveWithdraw, etc. — đều dùng `state`
//  và cuối mỗi action gọi saveToLocal() & await saveUserData(userId).)

// Ví dụ addHistory và requestDeposit:
async function addHistory(desc,delta){
  state.walletHistory.unshift({desc,delta,time:new Date().toLocaleString('vi-VN')});
  state.usageLogs.unshift({id:userId,username:state.members.find(m=>m.id===userId)?.username||userId,action:desc,time:new Date().toLocaleString('vi-VN')});
  renderHistory(); renderUsageLogs(); renderRequestHistory();
  saveToLocal(); await saveUserData(userId);
}

function showDeposit(){
  document.getElementById('walletAction').innerHTML=`
    <h3>Nạp SML</h3>
    <input type="number" id="depositAmt" placeholder="Số SML"/>
    <button onclick="requestDeposit()">Gửi yêu cầu</button>`;
}
function requestDeposit(){
  const amt=parseFloat(document.getElementById('depositAmt').value);
  if(isNaN(amt)||amt<=0) return alert('Nhập số hợp lệ');
  const req={id:Date.now()+'',userId,amount:amt,time:new Date().toLocaleString('vi-VN'),status:'pending',type:'deposit'};
  state.depositRequests.push(req);
  addHistory(`Request deposit ${amt}`,0);
  renderRequestHistory(); renderDepositRequests();
  document.getElementById('walletAction').innerHTML='';
}

// … tương tự cho requestWithdraw, approveDeposit, approveWithdraw, etc. …

// --- Login & Init ---
function handleLogin(){
  const name=document.getElementById('loginUsername').value.trim();
  if(!name) return alert('Nhập tên đăng nhập');
  // thêm member nếu mới
  if(!state.members.find(m=>m.id===userId)){
    state.members.push({
      id:userId,username:name,balance:state.walletBalance,
      registerDate:new Date().toLocaleString('vi-VN'),
      purchasedCount:0,directRefCount:0,teamRefCount:0
    });
    saveToLocal();
  }
  document.getElementById('login').style.display='none';
  document.getElementById('app').style.display='block';
  initApp();
}

async function initApp(){
  await loadUserData(userId);
  generateTabs(); updateWallet(); renderHistory();
  renderRequestHistory(); renderDepositRequests(); renderWithdrawRequests();
  renderProducts(); renderPendingSales(); renderNFTs();
  document.getElementById('referralLink').href=referralLink;
  document.getElementById('referralLink').innerText=referralLink;
  if(userId===adminID){
    ['home','session','nft','wallet','profile'].forEach(id=>{
      document.getElementById(id).style.display='none';
      document.getElementById('btn-'+id).style.display='none';
    });
    document.getElementById('admin').classList.add('show');
    document.getElementById('btn-admin').style.display='flex';
    renderAdminPanel();
  } else {
    showSection('home');
    document.getElementById('btn-admin').style.display='none';
  }
}
