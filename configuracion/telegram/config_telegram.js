const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config()
const publico = true;
const servidor = false;

if(servidor){
  //var token = process.env.TOKEN_PRO;
  var token = '5451878201:AAFN2h86pYF_QYFGZZVT5n3EEWreoH-JApU';
}else{
  //var token = process.env.TOKEN_CALI;
  var token = '5451878201:AAFN2h86pYF_QYFGZZVT5n3EEWreoH-JApU';
}

const bot = new TelegramBot(token, {polling: true});


module.exports = {
    bot
}