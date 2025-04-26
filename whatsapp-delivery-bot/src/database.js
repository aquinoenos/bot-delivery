const clients = {};

function registerClient(phone, data) {
  clients[phone] = data;
}

function getClient(phone) {
  return clients[phone];
}

function updateOrder(phone, data) {
  clients[phone] = data;
}

module.exports = {
  registerClient,
  getClient,
  updateOrder,
};
