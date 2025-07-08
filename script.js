// Mảng lưu registrations theo ngày
// Mỗi phần tử: { date: 'dd/MM', time: timestamp }
state.registrations = state.registrations || [];

/** Cập nhật giao diện SESSION sau mỗi thay đổi */
function updateSessionUI() {
  const date = selectedDate;
  // kiểm xem đã đăng ký ngày này chưa
  const reg = state.registrations.find(r => r.date === date);
  document.getElementById('registrationBox').style.display = reg ? 'none' : 'block';
  document.getElementById('joinContainer').style.display     = reg ? 'block' : 'none';
  // ẩn products nếu chưa join
  document.getElementById('products').style.display = 'none';
}

/** Gọi khi người dùng bấm Đăng ký phiên */
function showRegisterModal() {
  if (state.walletBalance < 20000) {
    return alert('Không đủ 20 000 SML để đăng ký phiên!');
  }
  document.getElementById('registerModal').style.display = 'flex';
}

function closeRegisterModal() {
  document.getElementById('registerModal').style.display = 'none';
}

/** Xác nhận đăng ký: trừ SML, lưu đăng ký cho ngày đó */
function confirmRegister() {
  // trừ SML
  state.walletBalance -= 20000;
  updateWallet();

  // thêm registration cho ngày đang chọn
  state.registrations.push({ date: selectedDate, time: Date.now() });
  saveToLocal();  // lưu local ngay
  // (nếu dùng GitHub API, gọi saveUserData ở đây)

  // cập nhật UI
  closeRegisterModal();
  updateSessionUI();
  alert(`Đã đăng ký phiên ngày ${selectedDate}!`);
}

/** Khi bấm Tham gia phiên */
function joinSession() {
  // chỉ hiển thị sản phẩm nếu đã đăng ký ngày đó
  const reg = state.registrations.find(r => r.date === selectedDate);
  if (!reg) {
    return alert('Bạn chưa đăng ký phiên ngày này.');
  }
  // show products
  document.getElementById('products').style.display = 'block';
  renderProducts();         // sản phẩm phiên admin đăng bán
  renderPendingSales();     // sản phẩm treo bán cho phiên này
}

/** Vẽ các sản phẩm admin bán trong phiên */
function renderProducts() {
  const c = document.getElementById('productList');
  c.innerHTML = '';
  // state.products chứa các sản phẩm gốc của admin
  state.products.forEach(p => {
    c.innerHTML += `
      <div class="product">
        <b>${p.name}</b><br>
        ID: ${p.id}<br>
        Giá: ${fmt(p.price)} SML<br>
        <button class="small" onclick="buyProduct('${p.id}')">Mua</button>
      </div>`;
  });
}

/** Vẽ các sản phẩm treo bán cho đúng phiên (ngày) đang chọn */
function renderPendingSales() {
  const c = document.getElementById('pendingSaleList');
  c.innerHTML = '';
  const today = selectedDate;
  state.pendingSales
    .filter(s => s.sellDate === today)
    .forEach(s => {
      c.innerHTML += `
        <div class="sale-item">
          <b>${s.name}</b><br>
          ID: ${s.id}<br>
          Giá gửi bán: ${fmt(s.salePrice)} SML<br>
          Ngày gửi: ${s.sellDate}<br>
          Phiên bán: ${s.sellDate}<br>
          <button class="small" onclick="buyPendingSale('${s.id}')">Mua</button>
        </div>`;
    });
}

// Khi khởi tạo tabs hoặc chọn ngày:
function generateTabs() {
  const c = document.getElementById('sessionDateTabs'),
        txt = document.getElementById('selectedDateText'),
        today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const lbl = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
    const btn = document.createElement('button');
    btn.textContent = lbl;
    btn.onclick = () => {
      // chuyển active tab
      c.querySelectorAll('button').forEach(x => x.classList.remove('active'));
      btn.classList.add('active');
      selectedDate = lbl;
      txt.textContent = lbl;
      updateSessionUI();
    };
    if (i === 0) {
      btn.classList.add('active');
      selectedDate = lbl;
      txt.textContent = lbl;
    }
    c.appendChild(btn);
  }
  updateSessionUI();
}

// Cuối cùng, gọi generateTabs() trong initApp()
