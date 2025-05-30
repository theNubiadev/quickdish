// // Simple Telegram Bot for Campus Eats
// require("dotenv").config();
// const TelegramBot = require("node-telegram-bot-api");
// const menu = require("./menu.json");
// const { addToCart, getCart, clearCart } = require("./cartStore");

// const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
// console.log("Bot is running...");

// // Admin Telegram user ID (update this)
// const ADMIN_CHAT_ID = " 6042400633";

// bot.onText(/\/start/, (msg) => {
//   const restaurants = Object.keys(menu);
//   bot.sendMessage(
//     msg.chat.id,
//     `Welcome to Campus Eats 🍔\nChoose a restaurant:`,
//     {
//       reply_markup: {
//         keyboard: restaurants.map((r) => [r]),
//         resize_keyboard: true,
//       },
//     }
//   );
// });

// const menuMap = {};

// for (const [restaurant, items] of Object.entries(menu)) {
//   items.forEach((item) => {
//     menuMap[item.id] = item;
//   });
// }

// // Restaurant selection
// bot.on("message", (msg) => {
//   const chatId = msg.chat.id;
//   const selectedRestaurant = menu[msg.text];

//   if (selectedRestaurant) {
//     let response = `📋 *Menu for ${msg.text}*:\n\n`;
//     selectedRestaurant.forEach((item, index) => {
//       response += `${index + 1}. ${item.name} - ₦${item.price}\n`;
//     });

//     bot.sendMessage(chatId, response, { parse_mode: "Markdown" });
//   }
// });

// // Restaurant selection → Show menu with buttons
// bot.on("message", (msg) => {
//   const chatId = msg.chat.id;
//   const restaurant = msg.text;

//   if (menu[restaurant]) {
//     menu[restaurant].forEach((item) => {
//       const text = `${item.name} - ₦${item.price}`;
//       const button = {
//         reply_markup: {
//           inline_keyboard: [
//             [
//               {
//                 text: "🛒 Add to Cart",
//                 callback_data: `add_${item.id}`,
//               },
//             ],
//           ],
//         },
//       };
//       bot.sendMessage(chatId, text, button);
//     });

//     // Show "View Cart" button
//     bot.sendMessage(chatId, "🧺 When you're ready:", {
//       reply_markup: {
//         inline_keyboard: [
//           [{ text: "🛍️ View Cart & Checkout", callback_data: "view_cart" }],
//         ],
//       },
//     });
//   }
// });

// // Handle button callbacks
// bot.on("callback_query", (query) => {
//   const userId = query.from.id;
//   const chatId = query.message.chat.id;
//   const data = query.data;

//   // Add to cart
//   if (data.startsWith("add_")) {
//     const itemId = data.slice(4);
//     const item = menuMap[itemId];
//     if (item) {
//       addToCart(userId, item);
//       bot.answerCallbackQuery(query.id, {
//         text: `${item.name} added to cart.`,
//       });
//     } else {
//       bot.answerCallbackQuery(query.id, { text: `Item not found.` });
//     }
//   }

//   // View Cart
//   if (query.data === "view_cart") {
//     const cart = getCart(userId);
//     if (cart.length === 0) {
//       return bot.sendMessage(chatId, "🧺 Your cart is empty.");
//     }

//     let summary = "🧾 *Your Order:*\n\n";
//     let total = 0;
//     cart.forEach((item, i) => {
//       summary += `${i + 1}. ${item.name} - ₦${item.price}\n`;
//       total += item.price;
//     });
//     summary += `\n*Total: ₦${total}*`;

//     bot.sendMessage(chatId, summary, {
//       parse_mode: "Markdown",
//       reply_markup: {
//         inline_keyboard: [
//           [{ text: "✅ Confirm Order", callback_data: "confirm_order" }],
//         ],
//       },
//     });
//   }

//   // Confirm Order
//   if (query.data === "confirm_order") {
//     const cart = getCart(userId);
//     if (cart.length === 0) {
//       return bot.sendMessage(chatId, "❌ Your cart is empty.");
//     }

//     let orderMsg = `🆕 *New Order* from @${
//       query.from.username || query.from.first_name
//     }\n\n`;
//     let total = 0;
//     cart.forEach((item, i) => {
//       orderMsg += `${i + 1}. ${item.name} - ₦${item.price}\n`;
//       total += item.price;
//     });
//     orderMsg += `\n*Total: ₦${total}*\nTelegram ID: ${userId}`;

//     // Send order to admin
//     bot.sendMessage(ADMIN_CHAT_ID, orderMsg, { parse_mode: "Markdown" });

//     // Confirm to user
//     bot.sendMessage(
//       chatId,
//       "✅ Your order has been placed!\nYou'll be notified when it's ready."
//     );

//     clearCart(userId);
//   }
// });

// // bot.on('message', (msg) => {
// //   console.log("Your Telegram ID:", msg.chat.id);
// // });

require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const menu = require("./menu.json");
const { addToCart, getCart, clearCart } = require("./cartStore");

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
console.log("Bot is running...");

// ✅ Set your admin Telegram user ID

const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID || ADMIN_CHAT_ID; // Use env variable if set
// 🔍 Build menu map (id → item)
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

bot.onText(/\/menu/, (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId, "📋 What would you like to do?", {
    reply_markup: {
      keyboard: [
        ["🔍 Search Restaurants", "🍽️ Search Meals"],
        ["🛒 View Cart", "📜 Order History"]
      ],
      resize_keyboard: true,
      one_time_keyboard: false
    }
  });
});
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (text === "🔍 Search Restaurants") {
    // List restaurant names
    const restaurants = Object.keys(menu);
    bot.sendMessage(chatId, "📍 Available Restaurants:\n" + restaurants.join("\n"));
  }

  if (text === "🍽️ Search Meals") {
    const meals = [];
    for (const items of Object.values(menu)) {
      meals.push(...items.map(i => `${i.name} - ₦${i.price}`));
    }
    bot.sendMessage(chatId, "🍽️ Meals:\n" + meals.join("\n"));
  }

  if (text === "🛒 View Cart") {
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
  }

  if (text === "📜 Order History") {
    // 🔧 Placeholder until database is added
    bot.sendMessage(chatId, "📜 No order history found.\n(Coming soon!)");
  }
});


// Handle restaurant selection
bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const restaurant = msg.text;

  if (menu[restaurant]) {
    menu[restaurant].forEach((item) => {
      const text = `${item.name} - ₦${item.price}`;
      const button = {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🛒 Add to Cart",
                callback_data: `add_${item.id}`,
              },
            ],
          ],
        },
      };
      bot.sendMessage(chatId, text, button);
    });

    bot.sendMessage(chatId, "🧺 When ready:", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🛍️ View Cart & Checkout", callback_data: "view_cart" }],
        ],
      },
    });
  }
});

// Handle inline button actions
bot.on("callback_query", (query) => {
  const userId = query.from.id;
  const chatId = query.message.chat.id;
  const data = query.data;

  // 🛒 Add to Cart
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
  }

  // 🛍️ View Cart
  if (data === "view_cart") {
    const cart = getCart(userId);
    if (cart.length === 0) {
      return bot.sendMessage(chatId, "🧺 Your cart is empty.");
    }

    let summary = "🧾 *Your Order:*\n\n";
    let total = 0;

    cart.forEach((item, i) => {
      summary += `${i + 1}. ${item.name} - ₦${item.price}\n`;
      total += item.price;
    });

    summary += `\n*Total: ₦${total}*`;

    bot.sendMessage(chatId, summary, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "✅ Confirm Order", callback_data: "confirm_order" }],
        ],
      },
    });
  }

  // ✅ Confirm Order
  if (data === "confirm_order") {
    const cart = getCart(userId);
    if (cart.length === 0) {
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

    // ✅ Notify admin
    bot.sendMessage(ADMIN_CHAT_ID, orderMsg, { parse_mode: "Markdown" });

    // ✅ Confirm to user
    bot.sendMessage(
      chatId,
      "✅ Your order has been placed!\nYou'll be notified when it's ready."
    );

    clearCart(userId);
  }
});
