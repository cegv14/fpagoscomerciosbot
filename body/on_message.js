
const fmensaje = require("../funciones/fmensajes");
var moment = require('moment');
var tz = require('moment-timezone');
var { validate_msg, ruta, mainopts,cancelar,msg_save1,msg_save2,msg_save3,reintentar,reintentar2,intentos, suspencion, intentos_consulta,compref,compmonto } = require('../configuracion/variables');
var sql = require('../configuracion/conexion');
const Tesseract = require('tesseract.js')
const fetch = require('node-fetch');
const https = require('https')
var Jimp = require('jimp');
const { ocrSpace } = require('ocr-space-api-wrapper');
var keys = ['ddd', 'ccc', 'ttt', 'ppp'];
var ckey = 0;
var pvkey;

String.prototype.replaceAt = function(index, replacement) {
    if(replacement == ''){
        var tmpt = this.split('')
        tmpt.splice(index, 1)
        tmpt = tmpt.join('')
        return tmpt;
    }else if(replacement == ':'){
        var tmpt = this.split('')
        tmpt.splice(index, 1, ':')
        tmpt = tmpt.join('')
        return tmpt;
    }else if(replacement == ' '){
        var tmpt = this.split('')
        tmpt.splice(index, 1, ' ')
        tmpt = tmpt.join('')
        return tmpt;
    }else{
        return this.substring(0, index) + replacement + this.substring(index + replacement.length);
    }
    
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fecha_hora_actual(){
    var fecha = moment().tz('America/Caracas').format('YYYY-MM-DD HH:mm:ss');
    return fecha;
}

function fecha_only(){
    var fecha = moment().tz('America/Caracas').format('YYYY-MM-DD');
    return fecha;
}

function fecha_hora_suma_minuto(min){
    var fecha = moment().tz('America/Caracas').add(min, 'minutes').format('YYYY-MM-DD HH:mm:ss');
    return fecha;
}

function fecha_hora_resta_minuto(min){
    var fecha = moment().tz('America/Caracas').subtract(min, 'minutes').format('YYYY-MM-DD HH:mm:ss');
    return fecha;
}

function fecha_esp_hora_suma_minuto(min, fecha){
    //YYYY-MM-DD HH24:MI:SS
    var fecha = moment(fecha).tz('America/Caracas').add(min, 'minutes').format('YYYY-MM-DD HH:mm:ss');
    return fecha;
}

function limpiar(telegram){
    msg_save1[telegram] = "";
    msg_save2[telegram] = "";
    ruta[telegram] = "";
}

function check_is_number(num) {
    var valoresAceptados = /^[0-9]*(\.?)[0-9]+$/;
       if (num.match(valoresAceptados)){
           return true;
       }else{
            return false;
       }
}
async function buscar_texto_de_imagen(source) {
    return new Promise(async resolve => {
        pvkey = ckey;

        try {
        // Using the OCR.space default free API key (max 10reqs in 10mins) + remote file
        const res1 = await ocrSpace(source, { apiKey: keys[ckey], scale:true, isTable:true, OCREngine:2});
        console.log(res1)
        resolve(res1);
      } catch (error) {
        resolve(false)
      }
      if(ckey==3){
        ckey=0;
      }else{
        ckey++;
      }
  });
}

const removeAccents = (str) => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
} 

const getBuffer = (source) => new Promise((resolve, reject) => {
  https.get(source, (response) => {
    const data = []

    response
      .on('data', (chunk) => {
        data.push(chunk)
      })
      .on('end', () => {
        resolve(Buffer.concat(data))
      })
      .on('error', (err) => {
        reject(err)
      })
  })
})

const encode = (data) => {
    let buf = Buffer.from(data);
    let base64 = buf.toString('base64');
    return base64
  }

timevar = [];

async function get_image_modi(source){
    return new Promise(resolve => {
    Jimp.read(source, async (err, image) => {
    if (err) throw err;
    var tt = await image.getBase64Async(Jimp.AUTO)
    resolve(tt);
});
});
}


function checkSpam(message) {
    var isOk = true;
    var diff = 0;
    if (timevar[message.from.id] != undefined) {
        diff = new Date() / 1000 - timevar[message.from.id];
        if (diff < 0.9) {
            isOk = false;
        }
    }
    timevar[message.from.id] = new Date() / 1000;
    return isOk;
}

function reconocer_imagen_f(text, array){
    for(var i = 0; i < array.length; i++){
        if(text.indexOf(array[i]) > -1){
            console.log("encontro")
            return [true, i];
        }else{
            // L y I
            if(array[i].search('L') > -1){
                for(var x = 0; x < array[i].length; x++){
                    console.log("antes", array[i])
                    if(array[i][x] == "L"){
                        array[i] = array[i].replaceAt(x,"I");
                        console.log("despues", array[i])
                        if(text.indexOf(array[i]) > -1){
                            console.log("encontro tras corregir")
                            return [true, i];
                        }else{
                            array[i] = array[i].replaceAt(x,"L");
                        }
                    }
                }
            }

            if(array[i].search('I') > -1){
                for(var x = 0; x < array[i].length; x++){
                    if(array[i][x] == "I"){
                        array[i] = array[i].replaceAt(x,"L");
                        if(text.indexOf(array[i]) > -1){
                            console.log("encontro tras corregir")
                            return [true, i];
                        }else{
                            array[i] = array[i].replaceAt(x,"I");
                        }
                    }
                }
            }

            // [ESPACIO] y [SIN ESPACIO]
            if(array[i].search(' ') > -1){
                for(var x = 0; x < array[i].length; x++){
                    console.log("antes", array[i])
                    if(array[i][x] == " "){
                        array[i] = array[i].replaceAt(x,"");
                        console.log("despues", array[i])
                        if(text.indexOf(array[i]) > -1){
                            console.log("encontro tras corregir")
                            return [true, i];
                        }else{
                            array[i] = array[i].replaceAt(x," ");
                        }
                    }
                }
            }

            if(array[i].search('') > -1){
                for(var x = 0; x < array[i].length; x++){
                    if(array[i][x] == ""){
                        array[i] = array[i].replaceAt(x," ");
                        if(text.indexOf(array[i]) > -1){
                            console.log("encontro tras corregir")
                            return [true, i];
                        }else{
                            array[i] = array[i].replaceAt(x," ");
                        }
                    }
                }
            }

        }
    }
    return [false, null];
}

function check_exist_camp_esp(text, element){
        if(text.indexOf(element)>-1){
            console.log("encontro 2")
            return [true, text.indexOf(element), element];
        }else{
            // L y I
            if(element.search('L') > -1){
                for(var x = 0; x < element.length; x++){
                    if(element[x] == "L"){
                        element = element.replaceAt(x,"I");
                        if(text.indexOf(element) > -1){
                            console.log("encontro tras corregir")
                            return [true, text.indexOf(element), element];
                        }else{
                        element =element.replaceAt(x,"L");
                        }
                    }
                }
            }

            if(element.search('I') > -1){
                for(var x = 0; x < element.length; x++){
                    if(element[x] == "I"){
                        element = element.replaceAt(x,"L");
                        if(text.indexOf(element) > -1){
                            console.log("encontro tras corregir")
                            return [true, text.indexOf(element), element];
                        }else{
                        element =element.replaceAt(x,"I");
                        }
                    }
                }
            }

            // [ESPACIO] y [SIN ESPACIO]
            if(element.search(' ') > -1){
                console.log("encontro blanco")
                for(var x = 0; x < element.length; x++){
                    if(element[x] == " "){
                         console.log("encontro blanco 2")
                        element = element.replaceAt(x,"");
                        console.log("luego", element)
                        if(text.indexOf(element) > -1){
                            console.log("encontro tras corregir")
                            return [true, text.indexOf(element), element];
                        }else{
                        element =element.replaceAt(x," ");
                        }
                    }
                }
            }

            if(element.search('') > -1){
                for(var x = 0; x <= element.length; x++){
                    if(element[x] == ""){
                        element = element.replaceAt(x," ");
                        if(text.indexOf(element) > -1){
                            console.log("encontro tras corregir")
                            return [true, text.indexOf(element), element];
                        }else{
                        element =element.replaceAt(x,"");
                        }
                    }
                }
            }
            // : a espacio
            if(element.search(':') > -1){
                for(var x = 0; x <= element.length; x++){
                    if(element[x] == ":"){
                        element = element.replaceAt(x," ");
                        if(text.indexOf(element) > -1){
                            console.log("encontro tras corregir")
                            return [true, text.indexOf(element), element];
                        }else{
                        element =element.replaceAt(x,":");
                        }
                    }
                }
            }
            // : a blank
            if(element.search(':') > -1){
                for(var x = 0; x <= element.length; x++){
                    if(element[x] == ":"){
                        element = element.replaceAt(x,"");
                        if(text.indexOf(element) > -1){
                            console.log("encontro tras corregir")
                            return [true, text.indexOf(element), element];
                        }else{
                        element =element.replaceAt(x,":");
                        }
                    }
                }
            }
            // espacio a :
            if(element.search(' ') > -1){
                for(var x = 0; x <= element.length; x++){
                    if(element[x] == " "){
                        element = element.replaceAt(x,":");
                        if(text.indexOf(element) > -1){
                            console.log("encontro tras corregir")
                            return [true, text.indexOf(element), element];
                        }else{
                        element =element.replaceAt(x," ");
                        }
                    }
                }
            }
            // . a espacio
            if(element.search('.') > -1){
                for(var x = 0; x <= element.length; x++){
                    if(element[x] == "."){
                        element = element.replaceAt(x," ");
                        if(text.indexOf(element) > -1){
                            console.log("encontro tras corregir")
                            return [true, text.indexOf(element), element];
                        }else{
                        element =element.replaceAt(x,".");
                        }
                    }
                }
            }
            // espacio a .
            if(element.search(' ') > -1){
                for(var x = 0; x <= element.length; x++){
                    if(element[x] == " "){
                        element = element.replaceAt(x,".");
                        if(text.indexOf(element) > -1){
                            console.log("encontro tras corregir")
                            return [true, text.indexOf(element), element];
                        }else{
                        element =element.replaceAt(x," ");
                        }
                    }
                }
            }
            // espacio M a N
            if(element.search('M') > -1){
                for(var x = 0; x <= element.length; x++){
                    if(element[x] == "M"){
                        element = element.replaceAt(x,"N");
                        if(text.indexOf(element) > -1){
                            console.log("encontro tras corregir")
                            return [true, text.indexOf(element), element];
                        }else{
                        element =element.replaceAt(x,"M");
                        }
                    }
                }
            }
            // espacio N a M
            if(element.search('N') > -1){
                for(var x = 0; x <= element.length; x++){
                    if(element[x] == "N"){
                        element = element.replaceAt(x,"M");
                        if(text.indexOf(element) > -1){
                            console.log("encontro tras corregir")
                            return [true, text.indexOf(element), element];
                        }else{
                        element =element.replaceAt(x,"N");
                        }
                    }
                }
            }

            // espacio 0 a O
            if(element.search('0') > -1){
                for(var x = 0; x <= element.length; x++){
                    if(element[x] == "0"){
                        element = element.replaceAt(x,"O");
                        if(text.indexOf(element) > -1){
                            console.log("encontro tras corregir")
                            return [true, text.indexOf(element), element];
                        }else{
                        element =element.replaceAt(x,"0");
                        }
                    }
                }
            }

        }
    return [false, null, null];
}


function replaceAll(text, search, change){

const replacer = new RegExp(search, 'g')

const string = text

return string.replace(replacer, change)
}


async function  consultar_insertar_validacion(monto, referencia, telegram){
    return new Promise(async resolve => {
        var sqlm = `SELECT nu_referencia, monto
                    FROM public.revision_pagos_pendientes
                    WHERE nu_referencia = '`+referencia+`' and monto = '`+monto+`' and fecha >= '`+fecha_only()+` 00:00:00' and fecha <= '`+fecha_only()+` 23:59:59';`;
        console.log(sqlm)
        await sql.query(sqlm).then(async result => {
          if(result.rowCount == 0){
                var sqlm = `INSERT INTO public.revision_pagos_pendientes(
                            ip, nu_referencia, fecha, token, empresa_id, monto, local)
                            VALUES ('`+telegram+`', '`+referencia+`', '`+fecha_hora_actual()+`', 'VALIDACION LOCAL', 33, '`+monto+`', 'true')`;
                console.log(sqlm)
                await sql.query(sqlm).then(async result => {
                  if(result.rowCount > 0){
                        consultar_pago_verificado(monto, referencia, telegram);
                  }
                });
          }else{
                consultar_pago_verificado(monto, referencia, telegram);
          }
        });
    });
}

async function consultar_pago_verificado(monto, referencia, telegram){
    return new Promise(async resolve => {
        await sleep(5000)
        console.log("consultando pago")
        var sqlm = `SELECT hora_validado,id, validado_usuario FROM public.pagos WHERE monto = `+monto+` and referencia LIKE '%`+referencia+`%' and verificado=true and empresa_id = 33`;
        console.log(sqlm)
        await sql.query(sqlm).then(async result => {
          if(result.rows.length == 0){
            if(intentos_consulta[telegram] == undefined){
                intentos_consulta[telegram] = 1;
            }else{
                intentos_consulta[telegram]++;
            }
            if(intentos_consulta[telegram] < 6){
                consultar_pago_verificado(monto, referencia, telegram);
            }else{
                await fmensaje.eliminar_mensaje2(telegram, msg_save3[telegram]);
                await fmensaje.crear(telegram, "❌ <b>No se encontro ninguna pago</b>\n<b>Monto:</b>"+monto+"\n<b>Referencia: </b>"+referencia, mainopts);
                
                resolve([false, undefined]);
            }
            
          }else{
            if(result.rows[0].validado_usuario){
                await fmensaje.crear(telegram, "⚠️ <b>Este pago ya fue validado antes, Fecha: "+result.rows[0].hora_validado+".</b>\n<b>Monto:</b> "+monto+"\n<b>Referencia: </b>"+referencia, mainopts);
            }else{
                var stmt6 = `UPDATE public.pagos
                SET validado_usuario=true
                WHERE id = `+result.rows[0].id;
                await sql.query(stmt6).then(async result => {
                    await fmensaje.eliminar_mensaje2(telegram, msg_save3[telegram]);
                    await fmensaje.crear(telegram, "✅ <b>Se ha validado satisfactoriamente.</b>\n<b>Monto:</b> "+monto+"\n<b>Referencia: </b>"+referencia, mainopts);
                    resolve([true, result.rows[0]]);
                });
                
            }
            
          }
      });
    });
}

//BOT TELEGRAM
function message(bot){

bot.on('message', async (msg, match) => {
console.log(msg)
 //VALIDACIONES   
if (!checkSpam(msg)){
    return;
}
//Validar bot
    
if(msg.chat.is_bot){
return
}


//INICIO MENSAJE
fmensaje.validar_msg_f(msg.chat.id);

if(msg.text == "❌ Cancelar"){
        limpiar(msg.chat.id);
        fmensaje.crear(msg.chat.id, "<b>Se ha cancelado la operación</b>:", mainopts);
        return
    }
    
if(msg.photo){
    var banco = ['Banco de Venezuela', 'Bancamiga', 'Bicentenario', 'Provincial', 'BDVLINEA', 'BOD']
    var nombre_reco = ['SU PAGO CLAVE HA SIDO REALIZADO CON EXITO.', 'UNIVERSAL PAGO MOVIL ENVIADO', 'TUBANCAMO', 'DINERO RAPIDO', 'PAGO CLAVE PERSONAS', 'SMS CON EL RESULTADO DE LA OPERACION', 'COMPARTIR REALIZAR OTRO PAGO'];
    var nombres_de_montos = ['MONTO OPERACION: ', 'BS. ', 'PAGO MOVIL ENVIADO ', 'BS.', 'PAGO CLAVE PERSONAS ', 'BS. ', 'BS. '];
    var nombres_de_referencias = ['NUMERO DE OPERACION ES ', 'REF: ', 'REF: ', 'REFERENCIA:', 'COMPROBANTE: ', 'REFERENCIA ', 'REFERENCIA '];



    var imagen = msg.photo;
    var prev_size=0;
    var file_id;
    console.log(msg)
    for(var i = 0; i < imagen.length; i++){
        if(imagen[i].file_size > prev_size){
            prev_size = imagen[i].file_size;
            file_id = imagen[i].file_id;
        }
    }

    fetch('https://api.telegram.org/bot5451878201:AAFN2h86pYF_QYFGZZVT5n3EEWreoH-JApU/getFile?file_id='+file_id, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    }).then(res => res.json())
    .then(async json => {
       let fimg = await get_image_modi('https://api.telegram.org/file/bot5451878201:AAFN2h86pYF_QYFGZZVT5n3EEWreoH-JApU/'+json.result.file_path);
       //fmensaje.crear_imagen(msg.chat.id, fimg)
       var texto_imagen = await buscar_texto_de_imagen(fimg)
       texto_imagen = texto_imagen.ParsedResults[0].ParsedText;
       console.log(texto_imagen)
       var text = replaceAll(texto_imagen, '\t\r\n', ' ')
       text = replaceAll(text, '\t+', ' ')
       text = replaceAll(text, '\t', ' ')
        text = removeAccents(text);
        text = text.toUpperCase();
                text = 'RevisionFpG: '+text
                console.log(text)
                var reconocer_imagen = reconocer_imagen_f(text, nombre_reco)
                if(reconocer_imagen[0]){
                    var ch1 = check_exist_camp_esp(text, nombres_de_montos[reconocer_imagen[1]])
                    var ch2 = check_exist_camp_esp(text, nombres_de_referencias[reconocer_imagen[1]])
                }else{
                    fmensaje.crear(msg.chat.id, "<b>Imagen no valida, indroduzca los datos desde el boton Validar Pago</b>", mainopts);
                    return
                }
                compmonto[msg.chat.id] = false;
                compref[msg.chat.id] = false
                if(ch1[0] && ch2[0]){
                    //Extraer datos
                    //Se separa en 2 el texto buscando el monto
                    var monto = text.split(ch1[2])
                    //Se separa en 2 nuevamente el resultado buscando el monto
                    if(monto[1]){
                        monto = monto[1].split(' ')[0]
                        monto = monto.replace(',','.')
                        monto = monto.replaceAll('O','0')
                        monto = monto.replaceAll(' ','')
                        var chk_mont = check_is_number(monto);
                        if(chk_mont){
                            compmonto[msg.chat.id]=true;
                            msg_save1[msg.chat.id] = monto;
                            console.log(monto)
                        }else{
                            console.log(monto)
                            monto = "0";
                            fmensaje.crear(msg.chat.id, "<b>No se encontro el monto, por favor ingresa el monto manualmente.</b>", cancelar);
                            ruta[msg.chat.id] = "imagen_monto";

                            //Se separa en 2 el texto buscando la referencia
                        var referencia = text.split(ch2[2])
                        if(referencia[1]){
                            //Se separa en 2 nuevamente el resultado buscando la referencia
                            referencia = referencia[1].split(' ')[0]
                            var chk_ref = check_is_number(referencia);
                            if(chk_ref){
                                compref[msg.chat.id] = true;
                                msg_save2[msg.chat.id] = referencia;
                                console.log(referencia)
                            }
                        }
                            return
                        }
                        
                        //Se separa en 2 el texto buscando la referencia
                        var referencia = text.split(ch2[2])
                        if(referencia[1]){
                            //Se separa en 2 nuevamente el resultado buscando la referencia
                            referencia = referencia[1].split(' ')[0]
                            var chk_ref = check_is_number(referencia);
                            if(chk_ref){
                                compref[msg.chat.id] = true;
                                msg_save2[msg.chat.id] = referencia;
                                console.log(referencia)
                            }else{
                                referencia = "0";
                                fmensaje.crear(msg.chat.id, "<b>No se encontro el numero de referencia, por favor ingresa el numero de referencia manualmente.</b>", cancelar);
                                ruta[msg.chat.id] = "imagen_ref";
                                return
                            }
                            msg_save3[msg.chat.id] = await fmensaje.crear(msg.chat.id, "🕐 <b>Validando Pago</b>\n<b>Monto:</b> "+msg_save1[msg.chat.id]+"\n<b>Referencia: </b>"+msg_save2[msg.chat.id], mainopts);
                            consultar_insertar_validacion(msg_save1[msg.chat.id], msg_save2[msg.chat.id], msg.chat.id)
                            
                        }else{
                            fmensaje.crear(msg.chat.id, "<b>No se encontro el numero de referencia, por favor ingresa el numero de referencia manualmente.</b>", cancelar);
                            ruta[msg.chat.id] = "imagen_ref";
                            return
                        }
                        
                    }else{
                        fmensaje.crear(msg.chat.id, "<b>No se encontro el monto, por favor ingresa el monto manualmente.</b>", cancelar);
                        ruta[msg.chat.id] = "imagen_monto";
                        return
                    }
                    
                }else{
                    if(!ch1[0]){
                        fmensaje.crear(msg.chat.id, "<b>No se encontro el monto, por favor ingresa monto manualmente.</b>", cancelar);
                        ruta[msg.chat.id] = "imagen_monto";
                        var referencia = text.split(ch2[2])
                        if(referencia[1]){
                            //Se separa en 2 nuevamente el resultado buscando la referencia
                            referencia = referencia[1].split(' ')[0]
                            var chk_ref = check_is_number(referencia);
                            if(chk_ref){
                                compref[msg.chat.id] = true;
                                msg_save2[msg.chat.id] = referencia;
                                console.log(referencia)
                            }
                        }
                        return
                    }
                    if(!ch2[0]){
                        fmensaje.crear(msg.chat.id, "<b>No se encontro el numero de referencia, por favor ingresa el numero de referencia manualmente.</b>", cancelar);
                        ruta[msg.chat.id] = "imagen_ref";
                        var monto = text.split(ch1[2])
                        monto = monto[1].split(' ')[0]
                        monto = monto.replace(',','.')
                        monto = monto.replaceAll('O','0')
                        monto = monto.replaceAll(' ','')
                        var chk_mont = check_is_number(monto);
                        if(chk_mont){
                            compmonto[msg.chat.id]=true;
                            msg_save1[msg.chat.id] = monto;
                            console.log(monto)
                        }
                        return
                    }
                    
                }
            });
}else{
    console.log(msg)
    if(ruta[msg.chat.id] == "imagen_ref"){
        msg_save2[msg.chat.id] = msg.text;
        compref[msg.chat.id] = true;
        if(compmonto[msg.chat.id] == false){
            fmensaje.crear(msg.chat.id, "<b>No se encontro el monto, por favor ingresa el monto manualmente.</b>", cancelar);
            ruta[msg.chat.id] = "imagen_monto";
            return
        }else{
            consultar_insertar_validacion(msg_save1[msg.chat.id], msg_save2[msg.chat.id], msg.chat.id)
        }
        return
    }
    if(ruta[msg.chat.id] == "imagen_monto"){
        msg_save1[msg.chat.id] = msg.text;
        compmonto[msg.chat.id] = true;
        if(compref[msg.chat.id] == false){
            fmensaje.crear(msg.chat.id, "<b>No se encontro el numero de referencia, por favor ingresa el numero de referencia manualmente.</b>", cancelar);
            ruta[msg.chat.id] = "imagen_ref";
            return
        }else{
            consultar_insertar_validacion(msg_save1[msg.chat.id], msg_save2[msg.chat.id], msg.chat.id)
        }
        return
    }
    if(msg.text == "✅ Validar Pago"){
        ruta[msg.chat.id] = "Validar_pago";
        fmensaje.crear(msg.chat.id, "<b>Validacion Manual</b>\nIngresa el Monto:", cancelar);
        return
    }
    if(ruta[msg.chat.id] == "Validar_pago"){
        ruta[msg.chat.id] = "Validar_pago2";
        msg_save1[msg.chat.id] = msg.text;
        fmensaje.crear(msg.chat.id, "Ingresa el Numero de referencia:", cancelar);
        return
    }
    if(ruta[msg.chat.id] == "Validar_pago2"){
        ruta[msg.chat.id] = "Validar_pago3";
        msg_save2[msg.chat.id] = msg.text;
        if(msg_save2[msg.chat.id].length >= 4 && msg_save2[msg.chat.id].length <= 20){
            var contador = msg_save2[msg.chat.id].length -4;
            msg_save2[msg.chat.id] =msg_save2[msg.chat.id].substr(contador, 99)
        }else{
            await fmensaje.crear(msg.chat.id, "Numero de referencia invalido, debe ser mayor a 4 digitos", mainopts);
            limpiar(msg.chat.id)
            return
        }
        msg_save3[msg.chat.id] = await fmensaje.crear(msg.chat.id, "🕐 <b>Validando Pago</b>\n<b>Monto:</b> "+msg_save1[msg.chat.id]+"\n<b>Referencia: </b>"+msg.text, mainopts);
        consultar_insertar_validacion(msg_save1[msg.chat.id], msg_save2[msg.chat.id], msg.chat.id)
        return
    }
    

    

    if(msg.text == "🔍 Consultar Pago"){
        console.log(intentos[msg.chat.id])
        if(intentos[msg.chat.id] == undefined ||intentos[msg.chat.id] < 5){
            ruta[msg.chat.id] = "Consultar_pago";
            fmensaje.crear(msg.chat.id, "<b>Consultar pago</b>\n(Los pagos realizados hace mas de 5 minutos no pueden ser consultados)\n\n<b>Ingresa el Monto:</b>", cancelar);
            return
        }else{
            if(suspencion[msg.chat.id] <= fecha_hora_actual()){
                intentos[msg.chat.id] = undefined;
                suspencion[msg.chat.id] = undefined;
                ruta[msg.chat.id] = "Consultar_pago";
                fmensaje.crear(msg.chat.id, "<b>Consultar pago (Los pagos realizados hace mas de 5 minutos no pueden ser consultados)</b>\n\n<b>Ingresa el Monto:</b>", cancelar);
                return
            }else{
                fmensaje.crear(msg.chat.id, "<b>Has superado el maximo de intentos, no podras consultar hasta: "+suspencion[msg.chat.id]+"</b>", cancelar);
                return
            }
            
        }
        
    }
    if(ruta[msg.chat.id] == "Consultar_pago"){

        ruta[msg.chat.id] = "Consultar_pago2";
        msg_save1[msg.chat.id] = msg.text;
        var msgg= await fmensaje.crear(msg.chat.id, "🕐 <b>Consultando Pago</b>\n<b>Monto:</b> "+msg_save1[msg.chat.id], mainopts);
        await sleep(5000);
        //Consultar Actividad
        var sqlm = `SELECT TO_CHAR(fecha_de_actualizacion,'YYYY-MM-DD HH24:MI:SS') AS fecha2
                      FROM public.config_estado_robot
                      WHERE id = 1`;
        console.log(sqlm)
        await sql.query(sqlm).then(async result => {
          if(result.rowCount > 0){
            var actividad = result.rows[0].fecha2;

            console.log(actividad)
            var fecham = fecha_hora_suma_minuto(2, actividad);
            var fechaa = fecha_hora_actual();
            if(fechaa > fecham){
              console.log("Error bot minutos superados")
              var actividad2 = "Offline";
            }else{
              console.log("Robot ONLINE activo "+result.rows[0].fecha)
              var actividad2 = "Online";
            }
            //Consultar pago
            var sqlm = `SELECT pagos.monto, pagos.referencia, (SELECT TO_CHAR(fecha_de_actualizacion,'YYYY-MM-DD HH24:MI:SS') AS fecha2
                      FROM public.config_estado_robot
                      WHERE id = 1) FROM public.pagos 
            WHERE fecha >= '`+fecha_hora_resta_minuto(30)+`'
            and monto = `+msg_save1[msg.chat.id]+` and verificado = false;`;
            console.log(sqlm)
            await sql.query(sqlm).then(async result => {
              if(result.rowCount > 0){
                intentos[msg.chat.id] = undefined;
                suspencion[msg.chat.id] = undefined;
                console.log(result.rows[0])
                fmensaje.eliminar_mensaje2(msg.chat.id, msgg);
                if(result.rowCount == 1){
                    fmensaje.crear(msg.chat.id, "✅ <b>"+actividad2+"</b> Se ha confirmado que existe el pago sin validar Monto: "+result.rows[0].monto+" REF: "+result.rows[0].referencia, mainopts);
                    limpiar(msg.chat.id)
                }else{
                    fmensaje.crear(msg.chat.id, "✅ <b>"+actividad2+"</b> Se ha confirmado que existe el pago sin validar", mainopts);
                    limpiar(msg.chat.id)
                }
                
              }else{
                if(intentos[msg.chat.id] > 0){
                    intentos[msg.chat.id]++;
                    if(intentos[msg.chat.id] == 5){
                        suspencion[msg.chat.id] = fecha_hora_suma_minuto(5);
                    }
                }else{
                    intentos[msg.chat.id] = 1;
                }
                await fmensaje.crear(msg.chat.id, "❌ <b>"+actividad2+"</b>  No se encontro ningun pago por el monto: "+msg_save1[msg.chat.id]+" dentro de los 30 minutos.", mainopts);
              }
          });
            
          }else{
            await fmensaje.crear(msg.chat.id, "Ha ocurrido un error vuelva a intentarlo", mainopts);
          }
      });

        
        return
    }

    
}


//iniciar validacion de mensaje esperado
fmensaje.validar_msg_i(msg.chat.id);


fmensaje.validar_msg_f(msg.chat.id);
if (validate_msg[msg.chat.id] == false){
    fmensaje.crear(msg.chat.id, "<b>Esta no es la accion esperada</b>", mainopts);
    fmensaje.eliminar_mensaje2(msg.chat.id, msg.message_id)
    return
}



});

}



exports.message = message;
