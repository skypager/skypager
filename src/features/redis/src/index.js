import runtime, { Feature } from '@skypager/node'
import redis from 'redis'
import { promisify } from 'util'

runtime.features.register('redis', () => RedisFeature)

export function attach(runtime, options = {}) {
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

export const REDIS_COMMANDS = `append asking auth batch bgrewriteaof bgsave bitcount bitfield bitop bitpos blpop brpop brpoplpush bzpopmax bzpopmin client cluster command commandQueueLength command_queue_length config connectionId connection_gone constructor create_stream dbsize debug decr decrby del discard drain dump duplicate echo emit_idle end eval evalsha exec exists expire expireat flush_and_error flushall flushdb geoadd geodist geohash geopos georadius georadius_ro georadiusbymember georadiusbymember_ro get getbit getrange getset handle_reply hdel hexists hget hgetall hincrby hincrbyfloat hkeys hlen hmget hmset host_ hscan hset hsetnx hstrlen hvals incr incrby incrbyfloat info initialize_retry_vars internal_send_command keys lastsave latency lindex linsert llen lpop lpush lpushx lrange lrem lset ltrim memory mget migrate module monitor move mset msetnx multi object offlineQueueLength offline_queue_length on_connect on_error on_info_cmd on_ready persist pexpire pexpireat pfadd pfcount pfdebug pfmerge pfselftest ping post psetex psubscribe psync pttl publish pubsub punsubscribe quit randomkey readonly readwrite ready_check rename renamenx replconf restore restore_asking retryBackoff retryDelay return_error return_reply role rpop rpoplpush rpush rpushx sadd save scan scard script sdiff sdiffstore select sendCommand send_command send_offline_queue serverInfo set setbit setex setnx setrange shouldBuffer shutdown sinter sinterstore sismember slaveof slowlog smembers smove sort spop srandmember srem sscan strlen subscribe substr sunion sunionstore swapdb sync time touch ttl type unlink unref unsubscribe unwatch wait warn watch write write_buffers write_strings xack xadd xclaim xdel xgroup xinfo xlen xpending xrange xread xreadgroup xrevrange xtrim zadd zcard zcount zincrby zinterstore zlexcount zpopmax zpopmin zrange zrangebylex zrangebyscore zrank zrem zremrangebylex zremrangebyrank zremrangebyscore zrevrange zrevrangebylex zrevrangebyscore zrevrank zscan zscore zunionstore`.split(
  ' '
)
