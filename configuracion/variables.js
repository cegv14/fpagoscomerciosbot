var msg_save1 = [];
var msg_save2 = [];
var msg_save3 = [];
var msg_save4 = [];
var msg_save5 = [];
var store_message_id = [];
var prev_message = [];
var id_message = [];
var validate_msg = [];
var ruta = [];
var intentos = [];
var suspencion = [];
var intentos_consulta = [];
var compmonto = [];
var compref = [];
const mainopts = {
"reply_markup": {
"keyboard": [["✅ Validar Pago", "🔍 Consultar Pago"]],
  resize_keyboard   : true
  },
parse_mode : "HTML"
};
const cancelar = {
"reply_markup": {
    "keyboard": [["❌ Cancelar"]],
resize_keyboard : true
    },
parse_mode : "HTML"
};

const reintentar = {
  reply_markup: {
      inline_keyboard: [
      [
          {
              "callback_data":"reintentar", 
              "text":"🔄 Reintentar"
          }
      ]
      ]
  },
  parse_mode : "HTML"
  };
  const reintentar2 = {
  reply_markup: {
      inline_keyboard: [
      [
          {
              "callback_data":"reintentar2", 
              "text":"🔄 Reintentar"
          }
      ]
      ]
  },
  parse_mode : "HTML"
  };

module.exports = {
    msg_save1,
    msg_save2,
    msg_save3,
    msg_save4,
    msg_save5,
    store_message_id,
    prev_message,
    id_message,
    validate_msg,
    ruta,
    mainopts,
    cancelar,
    reintentar,
    reintentar2,
    intentos,
    suspencion,
    intentos_consulta,
    compmonto,
    compref
}