# Smart Mall DApp

## Cấu trúc thư mục
- **index.html**: entry point của ứng dụng  
- **css/main.css**: styles  
- **js/firebase-init.js**: config & init Firebase  
- **js/helpers.js**: hàm tiện ích, render UI  
- **js/app.js**: logic chính, auth, realtime listeners, action handlers  
- **assets/**: chứa hình ảnh, icon, font

## Cấu hình Firebase
1. Tạo project trên [Firebase Console](https://console.firebase.google.com/)  
2. Trong **Project settings > Your apps > Config**, copy `firebaseConfig` vào `js/firebase-init.js`.  
3. Tạo các collection & document mẫu trong Firestore:
   - `wallets/{uid}` với `{ balance:0,directCommission:0,rankCommission:0 }`  
   - `sessions/{DD/MM}` với `{ registeredUsers: [] }`  
   - `products/{auto-id}` với `{ name, price, sellerUid, ... }`  
   - `notifications` (tùy chọn)  

## Triển khai
- **Netlify**: đăng ký → “Deploy manually” → kéo-thả cả thư mục `smart-mall/`  
- **Firebase Hosting**: trong console Hosting → “Deploy without CLI” → kéo-thả

Mỗi khi chỉnh sửa, chỉ cần upload lại là live version mới sẽ có hiệu lực.
