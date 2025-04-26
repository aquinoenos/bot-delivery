require('dotenv').config();
const express = require('express');
const basicAuth = require('basic-auth');
const path = require('path');
const { startBot, qrCodeBase64 } = require('./src/bot');

const app = express();
const PORT = process.env.PORT || 3000;

startBot();

// Proteção básica por senha
app.use('/admin', (req, res, next) => {
  const user = basicAuth(req);
  if (!user || user.pass !== process.env.ADMIN_PASSWORD) {
    res.set('WWW-Authenticate', 'Basic realm="Admin Area"');
    return res.status(401).send('Authentication required.');
  }
  next();
});

// Página Admin
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '/web/admin.html'));
});

// Endpoint para pegar o QR Code
app.get('/qr', (req, res) => {
  if (qrCodeBase64) {
    res.send(`<img src="${qrCodeBase64}" />`);
  } else {
    res.send('QR Code ainda não gerado ou já escaneado!');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
