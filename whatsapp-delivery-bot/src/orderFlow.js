const { getMenu } = require('./menu');
const { updateOrder } = require('./database');

async function orderFlow(client, message, clientData) {
  const phone = message.from;
  const text = message.body.trim().toLowerCase();

  switch (clientData.stage) {
    case 'menu':
      if (text === '1') {
        let menuText = '*Nosso Cardápio:*
';
        getMenu().forEach(item => {
          menuText += `*${item.id}* - ${item.name} - R$${item.price}\n`;
        });
        menuText += '\nDigite o número do item que deseja pedir:';
        clientData.stage = 'awaiting_item';
        updateOrder(phone, clientData);
        await client.sendText(phone, menuText);
      }
      break;

    case 'awaiting_item':
      const menu = getMenu();
      const selected = menu.find(item => item.id == text);
      if (selected) {
        clientData.currentItem = selected;
        clientData.stage = 'awaiting_quantity';
        updateOrder(phone, clientData);
        await client.sendText(phone, `Quantas unidades de *${selected.name}* você deseja?`);
      } else {
        await client.sendText(phone, 'Item inválido. Digite o número correto do item.');
      }
      break;

    case 'awaiting_quantity':
      const quantity = parseInt(text);
      if (!isNaN(quantity) && quantity > 0) {
        clientData.currentItem.quantity = quantity;
        clientData.stage = 'awaiting_observation';
        updateOrder(phone, clientData);
        await client.sendText(phone, 'Deseja adicionar alguma observação para este item? (Digite a observação ou "não")');
      } else {
        await client.sendText(phone, 'Quantidade inválida. Digite um número válido.');
      }
      break;

    case 'awaiting_observation':
      clientData.currentItem.observation = text !== 'não' ? text : '';
      if (!clientData.order) clientData.order = [];
      clientData.order.push(clientData.currentItem);
      clientData.currentItem = null;
      clientData.stage = 'add_more';
      updateOrder(phone, clientData);
      await client.sendText(phone, 'Deseja adicionar mais algum item? (Sim ou Não)');
      break;

    case 'add_more':
      if (text === 'sim') {
        clientData.stage = 'menu';
        updateOrder(phone, clientData);
        await client.sendText(phone, 'Digite *1* para ver o cardápio novamente.');
      } else {
        clientData.stage = 'awaiting_payment';
        updateOrder(phone, clientData);
        await client.sendText(phone, 'Escolha a forma de pagamento:\n1 - Pix\n2 - Cartão\n3 - Dinheiro');
      }
      break;

    case 'awaiting_payment':
      let paymentMethod = '';
      if (text === '1') paymentMethod = 'Pix';
      else if (text === '2') paymentMethod = 'Cartão';
      else if (text === '3') paymentMethod = 'Dinheiro';

      if (paymentMethod) {
        clientData.paymentMethod = paymentMethod;
        if (paymentMethod === 'Dinheiro') {
          clientData.stage = 'awaiting_change';
          updateOrder(phone, clientData);
          await client.sendText(phone, 'Precisa de troco? (Digite o valor para o troco ou "não")');
        } else {
          await finalizeOrder(client, phone, clientData);
        }
      } else {
        await client.sendText(phone, 'Opção inválida. Escolha:\n1 - Pix\n2 - Cartão\n3 - Dinheiro');
      }
      break;

    case 'awaiting_change':
      if (text !== 'não') {
        clientData.changeFor = parseFloat(text.replace(',', '.'));
      }
      await finalizeOrder(client, phone, clientData);
      break;
  }
}

async function finalizeOrder(client, phone, clientData) {
  clientData.stage = 'done';
  updateOrder(phone, clientData);

  let summary = '*Resumo do Pedido:*\n';
  clientData.order.forEach(item => {
    summary += `- ${item.quantity}x ${item.name} (${item.observation || 'Sem observações'})\n`;
  });
  summary += `\n*Forma de Pagamento:* ${clientData.paymentMethod}`;
  if (clientData.paymentMethod === 'Dinheiro' && clientData.changeFor) {
    summary += `\n*Troco para:* R$${clientData.changeFor.toFixed(2)}`;
  }

  await client.sendText(phone, summary);
  await client.sendText(phone, 'Seu pedido foi recebido! Acompanhe o status por aqui.');
}

module.exports = { orderFlow };
