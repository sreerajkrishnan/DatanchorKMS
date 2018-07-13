'use strict';
const encrypt = require('../../helpers/encryptionLib').encrypt;
const loopback = require('loopback');
const uuidv4 = require('uuid/v4');
const loopbackUtils = require('loopback/lib/utils');
module.exports = (Masterkey) => {

  Masterkey.observe('before save', function updateTimestamp(ctx, next) {
    if (ctx.instance) {
      ctx.instance.created = new Date();
    }
    next();
  });

  Masterkey.beforeRemote('**', function (ctx, user, next) {
    const access_token = ctx.req && ctx.req.accessToken;
    const userId = access_token && access_token.userId;
    Masterkey.app.models.AccessLogs.create({
      timestamp: new Date(),
      message: 'User called ' + ctx.method.name + 'of Masterkey model',
      propertyName: 'Masterkey',
      userId: userId
    }).then(next());
  });

  Masterkey.afterRemoteError('**', function (ctx, next) {
    const access_token = ctx.req && ctx.req.accessToken;
    const userId = access_token && access_token.userId;
    Masterkey.app.models.AccessLogs.create({
      timestamp: new Date(),
      message: 'User called ' + ctx.method.name + 'of Masterkey model',
      propertyName: 'Masterkey',
      errorMessage: ctx.error,
      userId: userId
    }).then(next());
  });

  Masterkey.afterRemote('create', function updateTimestamp(ctx, next) {
    if (ctx.instance) {
      const token = ctx.options && ctx.options.accessToken;
      const userId = token && token.userId;
      ctx.instance.id = userId? encrypt(uuidv4(), userId): ctx.insance.id;
      ctx.instance.userId = userId;
      Masterkey.updateAll({
        userId: ctx.instance.userId,
        encrypt: true,
      }, {
          encrypt: false
        });
    }
    next();
  });

  /**
 * Creates new masterkey for new login and returns the latest masterkey
 * @param {Function(Error)} callback
 */

  Masterkey.checkNewLogin = function (req,cb) {
    cb = cb || loopbackUtils.createPromiseCallback();
    let userId = req.accessToken.userId
    Masterkey.findOrCreate({
      where: {
        userId: userId,
        encrypt: true,
        decrypt: true,
        active: true
      }
    },{
      userId: userId,
      id: encrypt(uuidv4(),userId),
      created: new Date()
    }).then((masterKey) => cb(null,masterKey), err => cb(err))
    return cb.promise;
  };


  /**
   * Fetch Latest Masterkey of given user
   * @param {Function(Error, object)} callback
   */

  Masterkey.latest = function (req, cb) {
    cb = cb || loopbackUtils.createPromiseCallback();
    var userId = req.accessToken.userId;
    Masterkey.findOne({
      where: {
        userId: userId,
        encrypt: true,
        decrypt: true,
        active: true
      }
    }).then(masterKey => masterKey ? cb(null, masterKey) : cb(new Error('empty master key')), err => cb(err))
    return cb.promse;
  };
};
