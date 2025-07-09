// app.js
const state = {
  walletBalance:    0,
  directCommission: 0,
  rankCommission:   0,
  registrations:    [],    // [{ date: "DD/MM", registered: bool }]
  products:         [],    // [{ id, name, price, … }]
  userNFT:          [],    // [{ id, name, buyPrice, … }]
  pendingSales:     [],    // [{ id, name, … }]
  walletHistory:    [],    // [{ type, amount, createdAt, … }]
  requests:         []     // [{ type, amount, createdAt, … }]
};
let currentUid    = null;
let selectedDate  = null;

// Login
document.getElementById('loginBtn').onclick = () => {
  const u = document.getElementById('usernameInput').value.trim();
  if (!u) return alert('Nhập username!');
  localStorage.setItem('sm_tempName', u);
  auth.signInAnonymously().catch(e => alert(e.message));
};

// Theo dõi auth state
auth.onAuthStateChanged(user => {
  if (user) {
    currentUid = user.uid;
    initUserDoc(user.uid);
    document.getElementById('login').classList.remove('show');
    document.getElementById('app').style.display = 'block';
  } else {
    document.getElementById('login').classList.add('show');
    document.getElementById('app').style.display = 'none';
  }
});

function initUserDoc(uid) {
  const uRef = db.collection('users').doc(uid);
  uRef.get().then(doc => {
    if (!doc.exists) {
      return uRef.set({
        username: localStorage.getItem('sm_tempName'),
        phone:    "",
        fullname: "",
        bep20:    "",
        referrer: null,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
  }).then(() => {
    subscribeData(uid);
    // chọn ngày đầu để hiển thị
    if (state.registrations.length) selectDate(state.registrations[0].date);
  });
}

function subscribeData(uid) {
  // Ví & hoa hồng
  db.collection('wallets').doc(uid)
    .onSnapshot(d => {
      const w = d.data() || {};
      state.walletBalance    = w.balance || 0;
      state.directCommission = w.directCommission || 0;
      state.rankCommission   = w.rankCommission || 0;
      updateWallet();
      updateCommissionUI();
    });

  // Phiên (sessions)
  db.collection('sessions')
    .onSnapshot(sn => {
      state.registrations = sn.docs.map(d => ({
        date: d.id,
        registered: (d.data().registeredUsers || []).includes(uid)
      }));
      generateTabs();
    });

  // Sản phẩm
  db.collection('products')
    .onSnapshot(sn => {
      state.products = sn.docs.map(d => ({ id: d.id, ...d.data() }));
      renderProducts();
    });

  // NFT của user
  db.collection('nfts').where('ownerUid','==',uid)
    .onSnapshot(sn => {
      state.userNFT = sn.docs.map(d => ({ id: d.id, ...d.data() }));
      renderNFTs();
    });

  // Pending sales
  db.collection('nfts').where('status','==','pendingSale')
    .onSnapshot(sn => {
      state.pendingSales = sn.docs.map(d => ({ id: d.id, ...d.data() }));
      renderPendingSales();
    });

  // Lịch sử giao dịch ví & requests
  db.collection('transactions').where('uid','==',uid).orderBy('createdAt','desc')
    .onSnapshot(sn => {
      state.walletHistory = [];
      state.requests      = [];
      sn.forEach(d => {
        const t = d.data();
        if (t.type==='deposit' || t.type==='withdraw') state.requests.push(t);
        else state.walletHistory.push(t);
      });
      renderWalletHistory();
      renderRequestHistory();
    });

  // Notifications
  db.collection('notifications').orderBy('createdAt','desc')
    .onSnapshot(sn => {
      document.querySelector('.marquee').innerHTML =
        sn.docs.map(d => `<span>${d.data().message}</span>`).join('');
    });
}

function selectDate(date) {
  selectedDate = date;
  document.getElementById('reg-date').innerText = date;
  document.getElementById('modal-register').classList.add('show');
}

function confirmRegister() {
  const sessRef = db.collection('sessions').doc(selectedDate);
  sessRef.update({ registeredUsers: firebase.firestore.FieldValue.arrayUnion(currentUid) });
  db.collection('wallets').doc(currentUid)
    .update({ balance: firebase.firestore.FieldValue.increment(-20000) });
  db.collection('transactions').add({
    uid: currentUid, type: 'register', amount: -20000,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  alert(`Đã đăng ký phiên ${selectedDate}`);
  closeRegisterModal();
}

function confirmBuy(id) {
  const p = state.products.find(x=>x.id===id);
  if (!p) return alert('Không tìm thấy sản phẩm');
  db.collection('nfts').add({
    ownerUid:   currentUid,
    productRef: id,
    name:       p.name,
    buyPrice:   p.price,
    status:     'bought',
    postTime:   firebase.firestore.FieldValue.serverTimestamp()
  });
  db.collection('wallets').doc(currentUid)
    .update({ balance: firebase.firestore.FieldValue.increment(-p.price) });
  db.collection('transactions').add({
    uid:       currentUid,
    type:      'buy',
    productId: id,
    amount:    -p.price,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  alert(`Đã mua "${p.name}" giá ${fmt(p.price)}`);
}
