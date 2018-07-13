/**
 * Created by payyan1 on 10/07/18.
 */
const crypto = require('crypto');

module.exports.encrypt = (text,key)=>{
  let cipher = crypto.createCipher('aes-256-ctr',key.toString())
  let crypted = cipher.update(text.toString(),'utf8','hex')
  crypted += cipher.final('hex');
  return crypted;
}

module.exports.decrypt = (text,key) => {
  let decipher = crypto.createDecipher('aes-256-ctr',key.toString())
  let dec = decipher.update(text,'hex','utf8')
  dec += decipher.final('utf8');
  return dec;
}
