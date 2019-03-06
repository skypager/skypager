import runtime, { Feature } from '@skypager/node'
import redis from 'redis'
import { promisify } from 'util'

runtime.features.register('redis', () => RedisFeature)

/** 
@param {typeof runtime} runtime
@param {Object} options 
@param {String} [options.host='127.0.0.1']	IP address of the Redis server
@param {Number} [options.port=6379]	Port of the Redis server
@param {String} [options.path=null]	The UNIX socket string of the Redis server
@param {String} [options.url=null]	The URL of the Redis server. 
@param {String} [options.parser='javascript']	Deprecated Use either the built-in JS parser javascript or the native hiredis parser. Note node_redis < 2.6 uses hiredis as default if installed. This changed in v.2.6.0.
@param {Boolean} [options.string_numbers=null]	Set to true, node_redis will return Redis number values as Strings instead of javascript Numbers. Useful if you need to handle big numbers (above Number.MAX_SAFE_INTEGER === 2^53). Hiredis is incapable of this behavior, so setting this option to true will result in the built-in javascript parser being used no matter the value of the parser option.
@param {Boolean} [options.return_buffers=false]	If set to true, then all replies will be sent to callbacks as Buffers instead of Strings.
@param {Boolean} [options.detect_buffers=false]	If set to true, then replies will be sent to callbacks as Buffers. This option lets you switch between Buffers and Strings on a per-command basis, whereas return_buffers applies to every command on a client. Note: This doesn't work properly with the pubsub mode. A subscriber has to either always return Strings or Buffers.
@param {Boolean} [options.socket_keepalive=true]	If set to true, the keep-alive functionality is enabled on the underlying socket.
@param {Number} [options.socket_initialdelay=0]	Initial Delay in milliseconds, and this will also behave the interval keep alive message sending to Redis.
@param {Boolean} [options.no_ready_check=false]	When a connection is established to the Redis server, the server might still be loading the database from disk. While loading, the server will not respond to any commands. To work around this, node_redis has a "ready check" which sends the INFO command to the server. The response from the INFO command indicates whether the server is ready for more commands. When ready, node_redis emits a ready event. Setting no_ready_check to true will inhibit this check.
@param {Boolean} [options.enable_offline_queue=true]	By default, if there is no active connection to the Redis server, commands are added to a queue and are executed once the connection has been established. Setting enable_offline_queue to false will disable this feature and the callback will be executed immediately with an error, or an error will be emitted if no callback is specified.
@param {Boolean} [options.retry_unfulfilled_commands=false]	If set to true, all commands that were unfulfilled while the connection is lost will be retried after the connection has been reestablished. Use this with caution if you use state altering commands (e.g. incr). This is especially useful if you use blocking commands.
@param {String} [options.password=null]	If set, client will run Redis auth command on connect. Alias auth_pass Note node_redis < 2.5 must use auth_pass
@param {String} [options.db=null]	If set, client will run Redis select command on connect.
@param {String} [options.family='IPv4']	You can force using IPv6 if you set the family to 'IPv6'. See Node.js net or dns modules on how to use the family type.
@param {Boolean} [options.disable_resubscribing=false]	If set to true, a client won't resubscribe after disconnecting.
@param {Object<String,String>} [options.rename_commands=null]	Passing an object with renamed commands to use instead of the original functions. For example, if you renamed the command KEYS to "DO-NOT-USE" then the rename_commands object would be: { KEYS : "DO-NOT-USE" } . See the Redis security topics for more info.
@param {Object} [options.tls=null]	An object containing options to pass to tls.connect to set up a TLS connection to Redis (if, for example, it is set up to be accessible via a tunnel).
@param {String} [options.prefix=null]	A string used to prefix all used keys (e.g. namespace:test). Please be aware that the keys command will not be prefixed. The keys command has a "pattern" as argument and no key and it would be impossible to determine the existing keys in Redis if this would be prefixed.
@param {Function} [options.retry_strategy]	A function that receives an options object as parameter including the retry attempt, the total_retry_time indicating how much time passed since the last time connected, the error why the connection was lost and the number of times_connected in total. If you return a number from this function, the retry will happen exactly after that time in milliseconds. If you return a non-number, no further retry will happen and all offline commands are flushed with errors. Return an error to return that specific error to all offline commands. Example below.
*/
export function attach(runtime, options = {}) {
  if (process.env.REDIS_HOST) {
    options.host = options.host || process.env.REDIS_HOST
  }

  if (process.env.REDIS_URL) {
    options.url = options.url || process.env.REDIS_URL
  }

  if (process.env.REDIS_PASSWORD) {
    options.password = options.password || process.env.REDIS_PASSWORD
  }

  if (process.env.REDIS_DB) {
    options.db = options.db || process.env.REDIS_DB
  }

  runtime.feature('redis').enable(options)
}

/**
 * The Browser VM Feature provides a JSDOM sandbox that lets you use the runtime.vm as if it was really inside a browser.
 *
 * This lets you run browser scripts in node, for testing, server rendering, whatever.
 *
 * @export
 * @class BrowserVmFeature
 * @extends {Feature}
 */
export default class RedisFeature extends Feature {
  static shortcut = 'redis'

  subscribers = new Map()

  commands = REDIS_COMMANDS

  featureWasEnabled(options) {
    this.hide('client', (this.client = redis.createClient(options)))
  }

  stopSubscribtion(channel) {
    const client = this.subscribers.get(channel)
    if (client) {
      this.subscribers.delete(channel)
      client.unsubscribe()
      client.quit()
    }
    return channel
  }

  publish(channel, message) {
    this.client.publish(channel, message)
  }

  subscribe(channel, handler) {
    let subscriber = this.subscribers.get(channel)

    if (!subscriber) {
      subscriber = this.client.duplicate()
      this.subscribers.set(channel, subscriber)
    }

    subscriber.on('message', (channel, message) => {
      console.log({ message, channel })
    })

    subscriber.subscribe(channel)

    return subscriber
  }

  get async() {
    if (this._async) {
      return this._async
    }

    this.hide('_async', this.createAsyncInterface(this.featureSettings))

    return this._async
  }

  createAsyncInterface(options = {}) {
    const { isFunction } = this.lodash
    const { commands = REDIS_COMMANDS } = options
    const { client } = this
    return commands
      .filter(cmd => isFunction(client[cmd]))
      .reduce(
        (memo, method) => ({
          ...memo,
          [method]: promisify(client[method]).bind(client),
        }),
        {}
      )
  }
}

export const REDIS_COMMANDS = [
  'append',
  'auth',
  'batch',
  'bgrewriteaof',
  'bgsave',
  'bitcount',
  'bitfield',
  'bitop',
  'bitpos',
  'blpop',
  'brpop',
  'brpoplpush',
  'bzpopmax',
  'bzpopmin',
  'client',
  'cluster',
  'command',
  'commandQueueLength',
  'command_queue_length',
  'config',
  'connectionId',
  'connection_gone',
  'constructor',
  'create_stream',
  'dbsize',
  'debug',
  'decr',
  'decrby',
  'del',
  'discard',
  'drain',
  'dump',
  'duplicate',
  'echo',
  'emit_idle',
  'end',
  'eval',
  'evalsha',
  'exec',
  'exists',
  'expire',
  'expireat',
  'flush_and_error',
  'flushall',
  'flushdb',
  'geoadd',
  'geodist',
  'geohash',
  'geopos',
  'georadius',
  'georadius_ro',
  'georadiusbymember',
  'georadiusbymember_ro',
  'get',
  'getbit',
  'getrange',
  'getset',
  'hdel',
  'hexists',
  'hget',
  'hgetall',
  'hincrby',
  'hincrbyfloat',
  'hkeys',
  'hlen',
  'hmget',
  'hmset',
  'hscan',
  'hset',
  'hsetnx',
  'hstrlen',
  'hvals',
  'incr',
  'incrby',
  'incrbyfloat',
  'info',
  'initialize_retry_vars',
  'internal_send_command',
  'keys',
  'lastsave',
  'latency',
  'lindex',
  'linsert',
  'llen',
  'lpop',
  'lpush',
  'lpushx',
  'lrange',
  'lrem',
  'lset',
  'ltrim',
  'memory',
  'mget',
  'migrate',
  'module',
  'monitor',
  'move',
  'mset',
  'msetnx',
  'multi',
  'object',
  'offlineQueueLength',
  'offline_queue_length',
  'on_connect',
  'on_error',
  'on_info_cmd',
  'on_ready',
  'persist',
  'pexpire',
  'pexpireat',
  'pfadd',
  'pfcount',
  'pfdebug',
  'pfmerge',
  'pfselftest',
  'ping',
  'post',
  'psetex',
  'psubscribe',
  'psync',
  'pttl',
  'publish',
  'pubsub',
  'punsubscribe',
  'quit',
  'randomkey',
  'readonly',
  'readwrite',
  'ready_check',
  'rename',
  'renamenx',
  'replconf',
  'restore',
  'restore_asking',
  'retryBackoff',
  'retryDelay',
  'return_error',
  'return_reply',
  'role',
  'rpop',
  'rpoplpush',
  'rpush',
  'rpushx',
  'sadd',
  'save',
  'scan',
  'scard',
  'script',
  'sdiff',
  'sdiffstore',
  'select',
  'sendCommand',
  'send_command',
  'send_offline_queue',
  'serverInfo',
  'set',
  'setbit',
  'setex',
  'setnx',
  'setrange',
  'shouldBuffer',
  'shutdown',
  'sinter',
  'sinterstore',
  'sismember',
  'slaveof',
  'slowlog',
  'smembers',
  'smove',
  'sort',
  'spop',
  'srandmember',
  'srem',
  'sscan',
  'strlen',
  'subscribe',
  'substr',
  'sunion',
  'sunionstore',
  'swapdb',
  'sync',
  'time',
  'touch',
  'ttl',
  'type',
  'unlink',
  'unref',
  'unsubscribe',
  'unwatch',
  'wait',
  'warn',
  'watch',
  'write',
  'write_buffers',
  'write_strings',
  'xack',
  'xadd',
  'xclaim',
  'xdel',
  'xgroup',
  'xinfo',
  'xlen',
  'xpending',
  'xrange',
  'xread',
  'xreadgroup',
  'xrevrange',
  'xtrim',
  'zadd',
  'zcard',
  'zcount',
  'zincrby',
  'zinterstore',
  'zlexcount',
  'zpopmax',
  'zpopmin',
  'zrange',
  'zrangebylex',
  'zrangebyscore',
  'zrank',
  'zrem',
  'zremrangebylex',
  'zremrangebyrank',
  'zremrangebyscore',
  'zrevrange',
  'zrevrangebylex',
  'zrevrangebyscore',
  'zrevrank',
  'zscan',
  'zscore',
  'zunionstore',
]
