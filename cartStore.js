const cart = {};

function addToCart(userId, item) {
  if (!cart[userId]) cart[userId] = [];
  cart[userId].push(item);
}

function getCart(userId) {
  return cart[userId] || [];
}

function clearCart(userId) {
  cart[userId] = [];
}

module.exports = { addToCart, getCart, clearCart };
