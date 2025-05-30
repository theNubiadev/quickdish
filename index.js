require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const menu = require("./menu.json");
const { addToCart, getCart, clearCart } = require("./cartStore");

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
console.log("🤖 Bot is running...");

const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;

// Build menu map for quick lookup
const menuMap = {};
for (const [restaurant, items] of Object.entries(menu)) {
  items.forEach((item) => {
    menuMap[item.id] = item;
  });
}

// /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const restaurants = Object.keys(menu);

  bot.sendMessage(chatId, `👋 Welcome to *Campus Eats*\nSelect a restaurant:`, {
    parse_mode: "Markdown",
    reply_markup: {
      keyboard: restaurants.map((r) => [r]),
      resize_keyboard: true,
    },
  });
});

// /menu command (main menu options)
bot.onText(/\/menu/, (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId, "📋 Choose an option:", {
    reply_markup: {
      keyboard: [
        ["🔍 Search Restaurants", "🍽️ Search Meals"],
        ["🛒 View Cart", "📜 Order History"],
      ],
      resize_keyboard: true,
    },
  });
});

// Handle ALL message-based commands
bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (menu[text]) {
    // User selected a restaurant
    menu[text].forEach((item) => {
      bot.sendMessage(chatId, `${item.name} - ₦${item.price}`, {
        reply_markup: {
          inline_keyboard: [[{ text: "🛒 Add to Cart", callback_data: `add_${item.id}` }]],
        },
      });
    });

    bot.sendMessage(chatId, "🧺 When ready:", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🛍️ View Cart & Checkout", callback_data: "view_cart" }],
        ],
      },
    });
  } else if (text === "🔍 Search Restaurants") {
    const restaurants = Object.keys(menu);
    bot.sendMessage(chatId, "📍 Available Restaurants:\n" + restaurants.join("\n"));
  } else if (text === "🍽️ Search Meals") {
    const meals = [];
    for (const items of Object.values(menu)) {
      meals.push(...items.map(i => `${i.name} - ₦${i.price}`));
    }
    bot.sendMessage(chatId, "🍽️ Meals:\n" + meals.join("\n"));
  } else if (text === "🛒 View Cart") {
    const cart = getCart(msg.from.id);
    if (!cart.length) {
      return bot.sendMessage(chatId, "🧺 Your cart is empty.");
    }
    let message = "🧾 *Your Cart:*\n";
    let total = 0;
    cart.forEach((item, i) => {
      message += `${i + 1}. ${item.name} - ₦${item.price}\n`;
      total += item.price;
    });
    message += `\n*Total: ₦${total}*`;
    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } else if (text === "📜 Order History") {
    bot.sendMessage(chatId, "📜 No order history found.\n(Coming soon!)");
  }
});

// Handle all inline button callbacks
bot.on("callback_query", (query) => {
  const userId = query.from.id;
  const chatId = query.message.chat.id;
  const data = query.data;

  // Add to cart
  if (data.startsWith("add_")) {
    const itemId = data.slice(4);
    const item = menuMap[itemId];
    if (item) {
      addToCart(userId, item);
      bot.answerCallbackQuery(query.id, {
        text: `${item.name} added to cart.`,
      });
    } else {
      bot.answerCallbackQuery(query.id, { text: `❌ Item not found.` });
    }
    return;
  }

  // View cart
  if (data === "view_cart") {
    const cart = getCart(userId);
    if (!cart.length) {
      return bot.sendMessage(chatId, "🧺 Your cart is empty.");
    }

    let message = "🧾 *Your Cart:*\n";
    let total = 0;
    cart.forEach((item, i) => {
      message += `${i + 1}. ${item.name} - ₦${item.price}\n`;
      total += item.price;
    });
    message += `\n*Total: ₦${total}*`;

    bot.sendMessage(chatId, message, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "✅ Confirm Order", callback_data: "confirm_order" }],
        ],
      },
    });
    return;
  }

  // Confirm order
  if (data === "confirm_order") {
    const cart = getCart(userId);
    if (!cart.length) {
      return bot.sendMessage(chatId, "❌ Your cart is empty.");
    }

    let orderMsg = `🆕 *New Order* from @${
      query.from.username || query.from.first_name
    }\n\n`;
    let total = 0;
    cart.forEach((item, i) => {
      orderMsg += `${i + 1}. ${item.name} - ₦${item.price}\n`;
      total += item.price;
    });
    orderMsg += `\n*Total: ₦${total}*\nTelegram ID: ${userId}`;

    if (ADMIN_CHAT_ID) {
      bot.sendMessage(ADMIN_CHAT_ID, orderMsg, { parse_mode: "Markdown" });
    }

    bot.sendMessage(
      chatId,
      "✅ Your order has been placed!\nYou'll be notified when it's ready."
    );

    clearCart(userId);
    return;
  }

  // Handle unrecognized callback
  bot.answerCallbackQuery(query.id, { text: "❓ Unknown action" });
});
