const venom = require('venom-bot');
const { getMenu } = require('./menu');
const { registerClient, getClient, updateOrder } = require('./database');
const { orderFlow } = require('./orderFlow');

let qrCodeBase64 = '';

function startBot() {
  venom
    .create({
      session: 'delivery-bot',
      multidevice: true,
      headless: true,
      catchQR: (base64Qrimg, asciiQR, attempts, urlCode) => {
        qrCodeBase64 = base64Qrimg;
      },
    })
    .then(client => handleMessages(client))
    .catch((error) => console.error(error));
}

function handleMessages(client) {
  client.onMessage(async (message) => {
    if (!message.isGroupMsg) {
      const phone = message.from;
      let clientData = getClient(phone);

      if (!clientData) {
        await client.sendText(phone, 'Olá! Bem-vindo ao Delivery. Qual seu nome?');
        registerClient(phone, { stage: 'awaiting_name' });
        return;
      }

      if (clientData.stage === 'awaiting_name') {
        clientData.name = message.body.trim();
        clientData.stage = 'menu';
        updateOrder(phone, clientData);
        await client.sendText(phone, `Olá, ${clientData.name}! Digite *1* para ver nosso cardápio.`);
        return;
      }

      await orderFlow(client, message, clientData);
    }
  });
}

module.exports = { startBot, qrCodeBase64 };
