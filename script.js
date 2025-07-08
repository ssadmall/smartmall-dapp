// --- state mở rộng ---
let state = {
  walletBalance: 100000,
  members: [],
  usageLogs: [],
  walletHistory: [],
  depositRequests: [],    // {id, userId, amount, time, status}
  withdrawRequests: [],   // tương tự
  // ... products, userNFT, v.v.
};

// --- Helpers ---
function saveState() {
  localStorage.setItem('smartmall_state', JSON.stringify(state));
  saveUserData(userId);  // lên GitHub nếu cấu hình
}
function loadState() {
  const s = localStorage.getItem('smartmall_state');
  if (s) Object.assign(state, JSON.parse(s));
}

// --- Lời gọi chung render lịch sử request user ---
function renderRequestHistory() {
  const tb = document.getElementById('requestHistory');
  tb.innerHTML = state.depositRequests.concat(state.withdrawRequests)
    .sort((a,b)=>new Date(b.time)-new Date(a.time))
    .map(r=>`
      <tr>
        <td>${r.type}</td>
        <td>${r.amount}</td>
        <td>${r.time}</td>
        <td>${r.status}</td>
      </tr>
    `).join('');
}

// --- User: Nạp ---
function showDeposit() {
  document.getElementById('walletAction').innerHTML = `
    <h3>Nạp SML</h3>
    <input type="number" id="depositAmt" placeholder="SML"/>
    <button onclick="requestDeposit()">Gửi yêu cầu</button>`;
}
function requestDeposit() {
  const amt = parseFloat(document.getElementById('depositAmt').value);
  if (isNaN(amt)||amt<=0) return alert('Nhập số hợp lệ');
  const req = {
    id: Date.now().toString(),
    userId,
    amount: amt,
    time: new Date().toLocaleString('vi-VN'),
    status: 'pending',
    type: 'deposit'
  };
  state.depositRequests.push(req);
  addUsageLog(`Request deposit ${amt}`); // ghi vào usageLogs
  renderRequestHistory();
  saveState();
  document.getElementById('walletAction').innerHTML = '';
}

// --- User: Rút ---
function showWithdraw() {
  document.getElementById('walletAction').innerHTML = `
    <h3>Rút SML</h3>
    <input type="number" id="withdrawAmt" placeholder="SML"/>
    <button onclick="requestWithdraw()">Gửi yêu cầu</button>`;
}
function requestWithdraw() {
  const amt = parseFloat(document.getElementById('withdrawAmt').value);
  if (isNaN(amt)||amt<=0) return alert('Nhập số hợp lệ');
  const fee = Math.ceil(amt * 0.015);
  if (amt+fee > state.walletBalance) return alert('Không đủ SML');
  const req = {
    id: Date.now().toString(),
    userId,
    amount: amt,
    fee,
    time: new Date().toLocaleString('vi-VN'),
    status: 'pending',
    type: 'withdraw'
  };
  state.withdrawRequests.push(req);
  addUsageLog(`Request withdraw ${amt}`); 
  renderRequestHistory();
  saveState();
  document.getElementById('walletAction').innerHTML = '';
}

// --- Admin: render requests ---
function renderDepositRequests() {
  const tb = document.getElementById('depositRequestsList');
  tb.innerHTML = state.depositRequests.map(r=>`
    <tr>
      <td>${r.userId}</td>
      <td>${r.amount}</td>
      <td>${r.time}</td>
      <td>
        ${r.status==='pending'
          ? `<button onclick="approveDeposit('${r.id}')">Approve</button>
             <button onclick="rejectDeposit('${r.id}')">Reject</button>`
          : r.status
        }
      </td>
    </tr>
  `).join('');
}
function renderWithdrawRequests() {
  const tb = document.getElementById('withdrawRequestsList');
  tb.innerHTML = state.withdrawRequests.map(r=>`
    <tr>
      <td>${r.userId}</td>
      <td>${r.amount}</td>
      <td>${r.time}</td>
      <td>
        ${r.status==='pending'
          ? `<button onclick="approveWithdraw('${r.id}')">Approve</button>
             <button onclick="rejectWithdraw('${r.id}')">Reject</button>`
          : r.status
        }
      </td>
    </tr>
  `).join('');
}

// --- Admin: xử lý ---
function approveDeposit(reqId) {
  const req = state.depositRequests.find(r=>r.id===reqId);
  if (!req||req.status!=='pending') return;
  // cập nhật balance
  state.walletBalance += req.amount;
  updateWallet();
  req.status = 'approved';
  addUsageLog(`Admin approved deposit ${req.amount}`, req.userId);
  renderDepositRequests();
  renderRequestHistory();
  saveState();
}
function rejectDeposit(reqId) {
  const req = state.depositRequests.find(r=>r.id===reqId);
  if (!req||req.status!=='pending') return;
  req.status = 'rejected';
  renderDepositRequests();
  saveState();
}

function approveWithdraw(reqId) {
  const req = state.withdrawRequests.find(r=>r.id===reqId);
  if (!req||req.status!=='pending') return;
  // trừ ngoài balance
  state.walletBalance -= (req.amount + req.fee);
  updateWallet();
  req.status = 'approved';
  addUsageLog(`Admin approved withdraw ${req.amount}`, req.userId);
  renderWithdrawRequests();
  renderRequestHistory();
  saveState();
}
function rejectWithdraw(reqId) {
  const req = state.withdrawRequests.find(r=>r.id===reqId);
  if (!req||req.status!=='pending') return;
  req.status = 'rejected';
  renderWithdrawRequests();
  saveState();
}

// --- Thêm hồ sơ hành động ---
function addUsageLog(action, targetUserId=userId) {
  state.usageLogs.unshift({
    id: targetUserId,
    username: state.members.find(m=>m.id===targetUserId)?.username||targetUserId,
    action,
    time: new Date().toLocaleString('vi-VN')
  });
}

// --- Trong window.onload --- 
window.onload = async () => {
  loadState();
  // init UI...
  renderRequestHistory();
  renderDepositRequests();
  renderWithdrawRequests();
  // role-based như trước...
};
