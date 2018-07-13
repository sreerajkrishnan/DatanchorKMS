'use strict';
const encryptLib = require('../../helpers/encryptionLib');
const uuidv4 = require('uuid/v4');
const crypto = require('crypto')

module.exports = function (Datakey) {
  Datakey.observe('before save', function updateTimestamp(ctx, next) {
    if (!ctx.instance) {
      ctx.data.created = new Date();
    }
    next();
  });

  Datakey.beforeRemote('**', function (ctx, user, next) {
    const access_token = ctx.req && ctx.req.accessToken;
    const userId = access_token && access_token.userId;
    Datakey.app.models.AccessLogs.create({
      timestamp: new Date(),
      message: 'User called ' + ctx.method.name + ' method of Datakey for file: '+(ctx.req.body.id || ctx.req.body.params.id),
      propertyName: 'Datakey',
      userId: userId
    }).then(next());
  });

  Datakey.afterRemoteError('**', function (ctx, next) {
    const access_token = ctx.req && ctx.req.accessToken;
    const userId = access_token && access_token.userId;
    Datakey.app.models.AccessLogs.create({
      timestamp: new Date(),
      message: 'User called ' + ctx.method.name + 'of Datakey model',
      propertyName: 'Datakey ',
      errorMessage: ctx.error,
      userId: userId
    }).then(next());
  });

  Datakey.beforeRemote('create', (ctx, _modelInstance_, next) => {
    let access_token = ctx.req && ctx.req.accessToken;
    let userId = access_token && access_token.userId;
    let masterKey = ctx.req.query.masterKey
    var sharedSecret = crypto.randomBytes(16); // 128-bits === 16-bytes
    var textSecret = sharedSecret.toString('base64');
    ctx.req.body.access_token = encryptLib.encrypt(textSecret, encryptLib.decrypt(masterKey, userId));
    ctx.req.body.created = new Date();
    ctx.req.body.userId = userId;
    next();
  });

  Datakey.afterRemote('create', (ctx, _modelInstance_, next) => {
    const access_token = ctx.req && ctx.req.accessToken;
    const userId = access_token && access_token.userId;
    let masterKey = ctx.req.query.masterKey
    return ctx.res.send({
      access_token: encryptLib.decrypt(ctx.result.access_token, encryptLib.decrypt(masterKey, userId))
    })
  });

  Datakey.afterRemote('findById', (ctx, _modelInstance_, next) => {
    const access_token = ctx.req && ctx.req.accessToken;
    const userId = access_token && access_token.userId;
    let masterKey = ctx.req.query.masterKey
    return ctx.res.send({
      access_token: encryptLib.decrypt(ctx.result.access_token, encryptLib.decrypt(masterKey, userId))
    })
  });
};
