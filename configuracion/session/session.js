const NodeCache = require( "node-cache" );
const timesession = 180;
const myCache = new NodeCache( { stdTTL: 120, deleteOnExpire:true } )
const session = new NodeCache( { stdTTL: timesession, deleteOnExpire:true } )


module.exports = {
    myCache,
    session,
    timesession
}