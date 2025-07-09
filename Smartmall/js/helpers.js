// helpers.js

// Định dạng số SMP
function fmt(n) {
  return new Intl.NumberFormat('vi-VN').format(n) + ' SMP';
}

// Cập nhật ví & hoa hồng
function updateWallet() {
  document.getElementById('walletBalance').innerText = fmt(state.walletBalance);
}
function updateCommissionUI() {
  document.getElementById('directCommission').innerText = fmt(state.directCommission);
  document.getElementById('rankCommission').innerText  = fmt(state.rankCommission);
}

// Tạo các tab phiên
function generateTabs() {
  const tabs = document.getElementById('tabs');
  tabs.innerHTML = '';
  state.registrations.forEach(r => {
    const btn = document.createElement('button');
    btn.innerText = r.date;
    if (r.registered) btn.classList.add('active');
    btn.onclick = () => selectDate(r.date);
    tabs.appendChild(btn);
  });
}

// Render products
function renderProducts() {
  const list = document.getElementById('productList');
  list.innerHTML = '';
  state.products.forEach(p => {
    const div = document.createElement('div');
    div.className = 'product';
    div.innerHTML = `
      <h3>${p.name}</h3>
      <p>Giá: ${fmt(p.price)}</p>
      <button onclick="confirmBuy('${p.id}')">Mua</button>
    `;
    list.appendChild(div);
  });
}

// Render user NFTs
function renderNFTs() {
  const list = document.getElementById('nftList');
  list.innerHTML = '';
  state.userNFT.forEach(n => {
    const div = document.createElement('div');
    div.className = 'nft-item';
    div.innerHTML = `<p>${n.name} — Giá mua: ${fmt(n.buyPrice)}</p>`;
    list.appendChild(div);
  });
}

// Render pending sales
function renderPendingSales() {
  const list = document.getElementById('pendingList');
  list.innerHTML = '';
  state.pendingSales.forEach(n => {
    const div = document.createElement('div');
    div.className = 'pending-item';
    div.innerHTML = `<p>${n.name} — Chờ bán</p>`;
    list.appendChild(div);
  });
}

// Render ví history
function renderWalletHistory() {
  const ul = document.getElementById('historyList');
  ul.innerHTML = '';
  state.walletHistory.forEach(t => {
    const li = document.createElement('li');
    const date = t.createdAt?.toDate ? t.createdAt.toDate() : new Date();
    li.textContent = `[${date.toLocaleString()}] ${t.type}: ${fmt(t.amount)}`;
    ul.appendChild(li);
  });
}

// Render nạp/rút requests
function renderRequestHistory() {
  const ul = document.getElementById('requestList');
  ul.innerHTML = '';
  state.requests.forEach(t => {
    const li = document.createElement('li');
    const date = t.createdAt?.toDate ? t.createdAt.toDate() : new Date();
    li.textContent = `[${date.toLocaleString()}] ${t.type}: ${fmt(t.amount)}`;
    ul.appendChild(li);
  });
}

// Đóng modal đăng ký
function closeRegisterModal() {
  document.getElementById('modal-register').classList.remove('show');
}
