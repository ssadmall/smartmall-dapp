body {
  background: #0a1a2f;
  color: #fff;
  font-family: Arial, sans-serif;
  margin: 0;
  padding-bottom: 80px;
}
section {
  display: none;
  padding: 20px;
  margin: 10px;
  background: #162447;
  border: 2px solid #21e6c1;
  border-radius: 8px;
}
section.show { display: block; }
h2 { color: #21e6c1; margin-top: 0; }
button, input { border: none; border-radius: 4px; }
button {
  background: #21e6c1;
  color: #0a1a2f;
  font-weight: bold;
  cursor: pointer;
  margin: 6px 0;
  padding: 8px;
  width: 100%;
}
button.small {
  display: inline-block;
  width: auto;
  margin: 4px 2px;
  padding: 6px 12px;
}
input {
  width: 100%;
  padding: 8px;
  margin: 6px 0;
  background: #1f4068;
  color: #fff;
}
.date-tab-bar {
  display: flex;
  justify-content: space-between;
  background: #1b2c45;
  padding: 6px;
  border-radius: 8px;
  margin: 12px 0;
}
.date-tab-bar button {
  flex: 1;
  margin: 0 2px;
  padding: 6px 4px;
  background: #0f1c2e;
  color: #ccc;
  font-size: 13px;
  cursor: pointer;
}
.date-tab-bar button.active {
  background: #21e6c1;
  color: #162447;
  font-weight: bold;
}
.product, .sale-item {
  background: #1f4068;
  border: 1px solid #21e6c1;
  border-radius: 6px;
  padding: 10px;
  margin-bottom: 10px;
}
.modal {
  display: none;
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  justify-content: center;
  align-items: center;
}
.modal-content {
  background: #fff;
  color: #000;
  padding: 20px;
  border-radius: 8px;
  width: 280px;
}
nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  background: #162447;
  border-top: 2px solid #21e6c1;
}
nav .nav-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 0;
  font-size: 14px;
  color: #fff;
  background: #162447;
  cursor: pointer;
}
nav .nav-btn.active,
nav .nav-btn:hover {
  background: #21e6c1;
  color: #162447;
}
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}
th, td {
  border: 1px solid #21e6c1;
  padding: 6px;
  text-align: left;
  font-size: 14px;
}
th { background: #1b2c45; }
#referralSection a { word-break: break-all; color: #ffcc00; }
