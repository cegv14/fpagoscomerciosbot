require('dotenv').config()
const { bot } = require("./configuracion/telegram/config_telegram");
const callback = require("./body/on_callback");
const text = require("./body/on_text");
const message = require("./body/on_message");

//consultas telegram
message.message(bot);
text.text(bot);
callback.callback_query(bot);