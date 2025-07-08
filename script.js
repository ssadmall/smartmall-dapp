// khởi tạo Telegram WebApp
const tg = window.Telegram.WebApp;
tg.ready();
const registerUrl = "https://t.me/SmartMallonebot?start=register";
tg.MainButton.setText("Đăng ký phiên (20 000 SML)");
tg.MainButton.show();
tg.MainButton.onClick(() => tg.openLink(registerUrl));

// translations (vi & en; others = en)
const translations = {
  vi: { /* …như trước… */ },
  en: { /* …như trước… */ }
};
["es","fr","de","zh","ja","ko","ru","pt","ar","it","nl","tr","sv","id","th","ms"]
  .forEach(l=>translations[l]=translations.en);

function applyLanguage(lang="vi"){
  const t = translations[lang];
  ["home","session","nft","wallet","profile"].forEach(id=>{
    document.getElementById(`btn-${id}`).innerText = t[`nav${id.charAt(0).toUpperCase()+id.slice(1)}`];
  });
  // … tiếp tục set innerText/placeholder cho các element …
}

// Utils
function fmt(n){ return n.toLocaleString('vi-VN'); }
let walletBalance=100000, registeredFee=false, selectedDate=null,
    registerFee=20000, totalSpent=0;
let products=[ /* …3 SP Admin…*/ ],
    userNFT=[], pendingSales=[], walletHistory=[];

function showSection(id){
  document.querySelectorAll("section").forEach(s=>s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  document.querySelectorAll("nav button").forEach(b=>b.classList.remove("active"));
  document.getElementById("btn-"+id).classList.add("active");
}

function generateSessionTabs(){
  const c=document.getElementById("sessionDateTabs"),
        t=document.getElementById("selectedDateText"),
        today=new Date();
  for(let i=0;i<7;i++){
    const d=new Date(today);
    d.setDate(today.getDate()+i);
    const lbl=`${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
    const btn=document.createElement("button");
    btn.textContent=lbl;
    btn.onclick=()=>{
      document.querySelectorAll(".date-tab-bar button")
              .forEach(x=>x.classList.remove("active"));
      btn.classList.add("active");
      selectedDate=lbl;
      t.textContent=lbl;
    };
    if(i===0){ btn.classList.add("active"); selectedDate=lbl; t.textContent=lbl; }
    c.appendChild(btn);
  }
}

function updateWalletDisplay(){
  document.getElementById("walletBalance").innerText = fmt(walletBalance);
}

function addHistory(desc, delta){
  walletHistory.unshift({desc, delta, time: new Date().toLocaleString("vi-VN")});
  renderHistory();
}
function renderHistory(){
  const h = document.getElementById("walletHistory");
  if(!walletHistory.length){
    return h.innerText = "Chưa có giao dịch";
  }
  h.innerHTML = walletHistory.map(x=>`
    <div>[${x.time}] 
      <span class="${x.delta<0?"neg":"pos"}">
        ${x.delta>0?"+":""}${fmt(Math.abs(x.delta))}
      </span> SML – ${x.desc}
    </div>
  `).join("");
}

// Đăng ký phiên
function showRegisterModal(){
  if(walletBalance < registerFee) return alert("Không đủ SML!");
  document.getElementById("registerModal").style.display="flex";
}
function closeRegisterModal(){
  document.getElementById("registerModal").style.display="none";
}
function confirmRegister(){
  const amt = parseFloat(document.getElementById("registerAmount").value);
  if(isNaN(amt)||amt<=0) return alert("Nhập số tiền hợp lệ!");
  walletBalance -= registerFee;
  updateWalletDisplay();
  addHistory("Phí đăng ký phiên", -registerFee);
  registeredFee = true;
  closeRegisterModal();
  document.getElementById("registrationBox").innerHTML = `<p>Đã đăng ký: ${fmt(amt)}</p>`;
  document.getElementById("joinContainer").style.display = "block";
}

// Tham gia phiên
function joinSession(){
  if(registeredFee){
    walletBalance += registerFee;
    updateWalletDisplay();
    addHistory("Hoàn phí đăng ký", +registerFee);
    registeredFee = false;
  }
  document.getElementById("products").style.display = "block";
  renderProducts();
  renderPendingSales();
}

// Sản phẩm phiên hiện tại
function renderProducts(){
  const list = document.getElementById("productList");
  list.innerHTML = "";
  products.forEach(p=>{
    list.innerHTML += `
      <div class="product">
        <b>${p.name}</b><br>
        ID: ${p.id}<br>
        Giá: ${fmt(p.price)}<br>
        Người bán: ${p.seller}
        <button class="small" onclick="buyProduct('${p.id}')">Mua</button>
      </div>`;
  });
}
function buyProduct(id){
  const p = products.find(x=>x.id===id);
  if(!p) return;
  userNFT.push({...p, status:"bought"});
  products = products.filter(x=>x.id!==id);
  renderProducts();
  renderNFTs();
}

// PendingSales chỉ hiện khi selectedDate = sellDate
function renderPendingSales(){
  const list = document.getElementById("pendingSaleList");
  list.innerHTML = "";
  if(!selectedDate) return;
  pendingSales
    .filter(s=>s.sellDate===selectedDate)
    .forEach(s=>{
      list.innerHTML += `
        <div class="sale-item">
          <b>${s.name}</b><br>
          ID: ${s.id}<br>
          Giá bán: ${fmt(s.salePrice)}<br>
          Phí: ${fmt(s.saleFee)}<br>
          Ngày gửi: ${s.sellDateTime}<br>
          Phiên: ${s.sellDate}<br>
          <button class="small" onclick="buyPendingSale('${s.id}')">Mua</button>
        </div>`;
    });
}
function buyPendingSale(id){
  const idx = pendingSales.findIndex(s=>s.id===id);
  if(idx===-1) return;
  const s = pendingSales[idx];
  if(walletBalance < s.salePrice) return alert("Không đủ SML!");
  walletBalance -= s.salePrice;
  updateWalletDisplay();
  addHistory(`Mua ${s.name}`, -s.salePrice);
  userNFT.push({...s, status:"bought"});
  pendingSales.splice(idx,1);
  renderPendingSales();
  renderNFTs();
  alert(`Bạn đã mua "${s.name}" thành công!`);
}

// NFT logic
function renderNFTs(){
  const c = document.getElementById("nftList");
  c.innerHTML = "";
  let tot = 0;
  if(!userNFT.length){
    c.innerText = "Chưa có sản phẩm nào.";
  } else {
    userNFT.forEach(it=>{
      tot += it.price;
      let html = `
        <div class="nft-item">
          <b>${it.name}</b><br>
          ID: ${it.id}<br>
          Giá mua: ${fmt(it.price)}<br>
          Người bán: ${it.seller}<br>`;
      if(it.status==="bought"){
        html += `<button class="small" onclick="markPaid('${it.id}')">Đã thanh toán</button>`;
      } else if(it.status==="owned"){
        html += `<button class="small" onclick="openNFT('${it.id}')">Mở</button>
                 <button class="small" onclick="sellNFT('${it.id}')">Bán</button>`;
      } else if(it.status==="pendingSale"){
        html += `Trạng thái: <i>Chờ bán</i><br>
                 Giá bán: ${fmt(it.salePrice)}<br>
                 Phí: ${fmt(it.saleFee)}<br>
                 Ngày gửi: ${it.sellDateTime}<br>
                 Phiên: ${it.sellDate}`;
      }
      html += "</div>";
      c.innerHTML += html;
    });
  }
  document.getElementById("totalSpent").innerText = fmt(tot);
}

function markPaid(id){
  const it = userNFT.find(x=>x.id===id);
  if(!it || walletBalance < it.price) return alert("Không đủ SML!");
  walletBalance -= it.price;
  updateWalletDisplay();
  addHistory("Thanh toán", -it.price);
  it.status = "owned";
  renderNFTs();
}

function openNFT(id){
  const it = userNFT.find(x=>x.id===id);
  if(!it) return;
  const refund = it.price * 0.9;
  walletBalance += refund;
  updateWalletDisplay();
  addHistory("Hoàn NFT", refund);
  it.status = "opened";
  renderNFTs();
  alert(`Bạn nhận ${fmt(refund)} SML`);
}

function sellNFT(id){
  const it = userNFT.find(x=>x.id===id);
  if(!it) return;
  const profit = it.price * 0.015;
  const fee    = it.price * 0.034;
  const salePrice = it.price + profit + fee;
  if(walletBalance < fee) return alert("Không đủ SML trả phí!");
  walletBalance -= fee;
  updateWalletDisplay();
  addHistory("Phí gửi bán", -fee);
  const now = new Date();
  const dt  = now.toLocaleString("vi-VN");
  const tm  = new Date(now); tm.setDate(now.getDate()+1);
  const sd  = `${String(tm.getDate()).padStart(2,"0")}/${String(tm.getMonth()+1).padStart(2,"0")}`;
  it.status       = "pendingSale";
  it.salePrice    = salePrice;
  it.saleFee      = fee;
  it.sellDateTime = dt;
  it.sellDate     = sd;
  pendingSales.push({...it});
  renderNFTs();
  renderPendingSales();
  alert(`Chờ bán phiên ${sd}`);
}

// WALLET: deposit, transfer, withdraw
function showDeposit(){
  document.getElementById("walletAction").innerHTML = `
    <h3>Nạp SML</h3>
    <p>Chuyển USDT (BEP20) đến:<br><code>0xYourWalletAddress</code></p>
    <input type="number" id="depositAmt" placeholder="Số SML cần nạp"/>
    <button onclick="confirmDeposit()">Xác nhận nạp</button>`;
}
function confirmDeposit(){
  const amt = parseFloat(document.getElementById("depositAmt").value);
  if(isNaN(amt)||amt <= 0) return alert("Nhập số hợp lệ!");
  walletBalance += amt;
  updateWalletDisplay();
  addHistory("Nạp SML", amt);
  document.getElementById("walletAction").innerHTML = "";
}

function showTransfer(){
  document.getElementById("walletAction").innerHTML = `
    <h3>Chuyển SML</h3>
    <input type="text" id="transferTo" placeholder="Người nhận"/>
    <input type="number" id="transferAmt" placeholder="Số SML cần chuyển"/>
    <button onclick="confirmTransfer()">Xác nhận chuyển</button>`;
}
function confirmTransfer(){
  const to  = document.getElementById("transferTo").value.trim();
  const amt = parseFloat(document.getElementById("transferAmt").value);
  if(!to) return alert("Nhập người nhận!");
  if(isNaN(amt)||amt<=0) return alert("Nhập số hợp lệ!");
  if(walletBalance < amt) return alert("Không đủ SML!");
  walletBalance -= amt;
  updateWalletDisplay();
  addHistory(`Chuyển cho ${to}`, -amt);
  document.getElementById("walletAction").innerHTML = "";
}

function showWithdraw(){
  document.getElementById("walletAction").innerHTML = `
    <h3>Rút SML</h3>
    <input type="text" id="withdrawAddr" placeholder="Địa chỉ BEP20"/>
    <input type="number" id="withdrawAmt" placeholder="Số SML"/>
    <p>Phí: 1.5%</p>
    <button onclick="confirmWithdraw()">Xác nhận rút</button>`;
}
function confirmWithdraw(){
  const addr = document.getElementById("withdrawAddr").value.trim();
  const amt  = parseFloat(document.getElementById("withdrawAmt").value);
  if(!addr) return alert("Nhập địa chỉ rút!");
  if(isNaN(amt)||amt<=0) return alert("Nhập số hợp lệ!");
  const fee   = amt * 0.015;
  const total = amt + fee;
  if(walletBalance < total) return alert("Không đủ SML!");
  walletBalance -= total;
  updateWalletDisplay();
  addHistory(`Rút ${fmt(amt)} (+ phí ${fmt(fee)})`, -total);
  document.getElementById("walletAction").innerHTML = "";
}

function saveProfile(){
  alert("Thông tin cá nhân đã lưu.");
}

// INIT
window.onload = ()=>{
  generateSessionTabs();
  applyLanguage("vi");
  showSection("home");
  updateWalletDisplay();
  renderHistory();
};
document.getElementById("langSelect")
        .addEventListener("change", e=>applyLanguage(e.target.value));
