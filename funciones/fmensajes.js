const { bot } = require('../configuracion/telegram/config_telegram');
var { validate_msg } = require('../configuracion/variables');
const NodeCache = require( "node-cache" );
const myCache = new NodeCache( { stdTTL: 120, deleteOnExpire:true } )
async function crear(telegram, text, btn){
    return new Promise(async resolve => {
    if(btn){
        var id_mensaje = await bot.sendMessage(telegram, text, btn);
        if(id_mensaje.reply_markup){
            id_mensaje = id_mensaje.message_id;
            if(!myCache.has( id_mensaje.toString() )){
                myCache.set( id_mensaje.toString(), "t" )
                }
        }else{
            id_mensaje = id_mensaje.message_id;
        }
        resolve(id_mensaje)
    }else{
        var id_mensaje = await bot.sendMessage(telegram, text);
        id_mensaje = id_mensaje.message_id;
        resolve(id_mensaje)
    }
});
}




async function crear_imagen(telegram, text, btn) {

    if (btn) {
        var id_mensaje = await bot.sendPhoto(telegram, text, btn);
        if (id_mensaje.reply_markup) {
            id_mensaje = id_mensaje.message_id;
            if (!myCache.has(id_mensaje.toString())) {
                myCache.set(id_mensaje.toString(), "t")
            }
        } else {
            id_mensaje = id_mensaje.message_id;
        }
        return id_mensaje;
    } else {
        var id_mensaje = await bot.sendPhoto(telegram, text);
        id_mensaje = id_mensaje.message_id;
        return id_mensaje;
    }
}



async function validar_msg(msg){
    return new Promise(resolve => {
    if(myCache.has(msg.message.message_id.toString())){
        myCache.take( msg.message.message_id.toString() )
        bot.deleteMessage(msg.from.id, msg.message.message_id);
        resolve(false);
    }else{
        bot.answerCallbackQuery({
            callback_query_id:msg.id,
            text: 'Este menú ha expirado',
            show_alert: false
          })
          bot.deleteMessage(msg.from.id, msg.message.message_id);
          resolve(true);
    }
    })
}

async function en_proceso(msg){
    bot.answerCallbackQuery({
        callback_query_id:msg.id,
        text: 'Procesando la operación.',
        show_alert: false
      })
}

async function eliminar_mensaje(msg) {
    bot.deleteMessage(msg.from.id, msg.message_id);
}

async function eliminar_mensaje2(telegram, msg) {
    bot.deleteMessage(telegram, msg);
}

async function validar_msg_i(telegram) {
    validate_msg[telegram] = false;
    console.log("inicio mensaje")
}

async function validar_msg_f(telegram) {
    validate_msg[telegram] = true;
    console.log("Encontro respuesta")
}

exports.crear = crear;
exports.validar_msg = validar_msg;
exports.en_proceso = en_proceso;
exports.eliminar_mensaje = eliminar_mensaje;
exports.eliminar_mensaje2 = eliminar_mensaje2;
exports.crear_imagen = crear_imagen;
exports.validar_msg_i = validar_msg_i;
exports.validar_msg_f = validar_msg_f;