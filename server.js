/**
 * GhorerBazar backend
 * Plain Express + in-memory / JSON-file storage so the whole thing
 * runs with zero external services. Swap the storage layer for
 * MongoDB later — every function below is written so that only the
 * body of each store.* helper needs to change.
 */

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const products = require("./data/products");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "frontend")));

// ---------------------------------------------------------------
// In-memory stores (swap for MongoDB collections when ready)
// ---------------------------------------------------------------
const carts = new Map(); // cartId -> [{ productId, qty }]
const otpStore = new Map(); // phone -> { code, expiresAt }
const users = new Map(); // phone -> { phone, name, verified }
const chatSessions = new Map(); // sessionId -> { messages: [], status: "open"|"offline" }
const offlineMessages = []; // messages left when support is unavailable

function newId(prefix) {
  return `${prefix}_${crypto.randomBytes(6).toString("hex")}`;
}

function getCart(cartId) {
  if (!carts.has(cartId)) carts.set(cartId, []);
  return carts.get(cartId);
}

function cartTotal(cartId) {
  const items = getCart(cartId);
  return items.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.productId);
    return product ? sum + product.price * item.qty : sum;
  }, 0);
}

function serializeCart(cartId) {
  const items = getCart(cartId).map((item) => {
    const product = products.find((p) => p.id === item.productId);
    return { ...item, product };
  });
  return { items, total: cartTotal(cartId) };
}

// ---------------------------------------------------------------
// Products
// ---------------------------------------------------------------
app.get("/api/products", (req, res) => {
  const { category, q } = req.query;
  let list = products;
  if (category) list = list.filter((p) => p.category.toLowerCase() === String(category).toLowerCase());
  if (q) list = list.filter((p) => p.title.toLowerCase().includes(String(q).toLowerCase()));
  res.json(list);
});

app.get("/api/products/:id", (req, res) => {
  const product = products.find((p) => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(product);
});

// ---------------------------------------------------------------
// Cart — identified by a cartId the frontend keeps in localStorage
// ---------------------------------------------------------------
app.get("/api/cart/:cartId", (req, res) => {
  res.json(serializeCart(req.params.cartId));
});

app.post("/api/cart/:cartId/add", (req, res) => {
  const { productId, qty = 1 } = req.body;
  const product = products.find((p) => p.id === productId);
  if (!product) return res.status(404).json({ error: "Product not found" });

  const items = getCart(req.params.cartId);
  const existing = items.find((i) => i.productId === productId);
  if (existing) existing.qty += qty;
  else items.push({ productId, qty });

  res.json(serializeCart(req.params.cartId));
});

app.post("/api/cart/:cartId/remove", (req, res) => {
  const { productId } = req.body;
  const items = getCart(req.params.cartId);
  const idx = items.findIndex((i) => i.productId === productId);
  if (idx !== -1) items.splice(idx, 1);
  res.json(serializeCart(req.params.cartId));
});

app.post("/api/cart/:cartId/checkout", (req, res) => {
  const cart = serializeCart(req.params.cartId);
  if (cart.items.length === 0) return res.status(400).json({ error: "Cart is empty" });
  carts.set(req.params.cartId, []);
  res.json({ orderId: newId("order"), total: cart.total, status: "confirmed" });
});

// ---------------------------------------------------------------
// Auth — phone + OTP verification (mocked: code is always logged,
// and returned in the response in dev mode so you can test without
// an SMS provider wired up)
// ---------------------------------------------------------------
app.post("/api/auth/send-code", (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: "Phone number required" });

  const code = String(Math.floor(100000 + Math.random() * 900000));
  otpStore.set(phone, { code, expiresAt: Date.now() + 5 * 60 * 1000 });

  console.log(`[OTP] ${phone} -> ${code}`);
  // In production, call your SMS provider here instead of returning the code.
  res.json({ sent: true, devCode: code });
});

app.post("/api/auth/verify-code", (req, res) => {
  const { phone, code } = req.body;
  const record = otpStore.get(phone);

  if (!record) return res.status(400).json({ error: "No code was requested for this number" });
  if (Date.now() > record.expiresAt) return res.status(400).json({ error: "Code expired, request a new one" });
  if (record.code !== code) return res.status(400).json({ error: "Incorrect code" });

  otpStore.delete(phone);
  const user = users.get(phone) || { phone, name: null, verified: true };
  user.verified = true;
  users.set(phone, user);

  res.json({ verified: true, token: newId("token"), user });
});

// ---------------------------------------------------------------
// Live chat — start / message / offline handoff
// Support is treated as "available" during 9am-9pm server time;
// swap isSupportOnline() for a real agent-presence check later.
// ---------------------------------------------------------------
function isSupportOnline() {
  const hour = new Date().getHours();
  return hour >= 9 && hour < 21;
}

app.post("/api/chat/start", (req, res) => {
  const sessionId = newId("chat");
  chatSessions.set(sessionId, { messages: [], status: isSupportOnline() ? "online" : "offline" });
  res.json({ sessionId, online: isSupportOnline() });
});

app.post("/api/chat/:sessionId/message", (req, res) => {
  const session = chatSessions.get(req.params.sessionId);
  if (!session) return res.status(404).json({ error: "Chat session not found" });

  const { text, from = "user" } = req.body;
  const message = { id: newId("msg"), from, text, at: new Date().toISOString() };
  session.messages.push(message);

  // Simple canned auto-reply when support is online, so the widget feels alive in a demo.
  if (from === "user" && isSupportOnline()) {
    const reply = {
      id: newId("msg"),
      from: "agent",
      text: "Thanks for reaching out! An agent will be with you shortly.",
      at: new Date().toISOString()
    };
    session.messages.push(reply);
  }

  res.json({ online: isSupportOnline(), messages: session.messages });
});

app.get("/api/chat/:sessionId/messages", (req, res) => {
  const session = chatSessions.get(req.params.sessionId);
  if (!session) return res.status(404).json({ error: "Chat session not found" });
  res.json({ online: isSupportOnline(), messages: session.messages });
});

app.post("/api/chat/offline-message", (req, res) => {
  const { name, phone, message } = req.body;
  if (!message) return res.status(400).json({ error: "Message is required" });

  const entry = { id: newId("offmsg"), name, phone, message, at: new Date().toISOString() };
  offlineMessages.push(entry);
  res.json({ received: true });
});

// ---------------------------------------------------------------
app.get("/api/health", (req, res) => res.json({ ok: true, supportOnline: isSupportOnline() }));

app.listen(PORT, () => {
  console.log(`GhorerBazar backend running on http://localhost:${PORT}`);
});
