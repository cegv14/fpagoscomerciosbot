
const fmensaje = require("../funciones/fmensajes");
function text(bot){
    
bot.onText(/\/start/, async (msg, match) => {
    await fmensaje.crear(msg.chat.id, "Bienvenido");
});

}
exports.text = text;