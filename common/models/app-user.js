'use strict';
const request = require('request-promise')
module.exports = function (Appuser) {
    Appuser.afterRemote('login', function (context, user, next) {
        request('http://datanchor-lib.ap-south-1.elasticbeanstalk.com/api/Masterkeys/check-new-login?access_token=' + context.result.id)
            .then(masterKey => {
                masterKey = JSON.parse(masterKey).masterkey[0]
                return context.res.send({
                    access_token: context.result.id,
                    ttl: context.result.ttl,
                    userId: context.result.userId,
                    timestamp: context.result.timestamp,
                    masterKey: {
                        id: masterKey.id,
                        created: masterKey.created
                    }
                })
            });
    });

    Appuser.beforeRemote('**', function (ctx, user, next) {
        const access_token = ctx.req && ctx.req.accessToken;
        const userId = access_token && access_token.userId;
        Appuser.app.models.AccessLogs.create({
            timestamp: new Date(),
            message: 'User called '+ctx.method.name + 'of AppUser model',
            propertyName: 'AppUser',
            userId: userId
        }).then(next());
    });

    Appuser.afterRemoteError('**', function (ctx, next) {
        const access_token = ctx.req && ctx.req.accessToken;
        const userId = access_token && access_token.userId;
        Appuser.app.models.AccessLogs.create({
            timestamp: new Date(),
            message: 'User called '+ctx.method.name+ 'of AppUser model',
            propertyName: 'AppUser',
            errorMessage: ctx.error,
            userId: userId
        }).then(next());
    });

};
