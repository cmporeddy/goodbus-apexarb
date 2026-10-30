# GoodBus UI (Frontend)

GoodBus Frontend is built with **React 19**, **TypeScript**, **Vite**, and **Tailwind CSS**.

For the complete project overview, end-to-end user journey, architecture, and full API documentation, see the main [README.md](../README.md).

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```

The frontend will run at: `http://localhost:3000` (or `http://localhost:5173`).

### 3. Backend Proxy
The Vite configuration proxies all `/busticket/*` requests to the Spring Boot backend running on `http://localhost:8081`. Ensure the backend is running to test live bus booking, tentative seat blocking, Razorpay payment orders, and WhatsApp notifications.