# Redis Feature

Provides a wrapper around the node redis client that will self configure based on the runtime settings and process.env

## Usage

```javascript
const runtime = require('@skypager/node')
const redisFeature = require('@skypager/features-redis')

runtime.use(redisFeature, {
  url: process.env.REDIS_URL
})

runtime.redis.async.keys('*').then((keys) => console.log('Redis KEYS', keys))
```

## Async Wrapper

The `redis.async` property returns promisified versions of all of the core redis commands 

## Pubsub

The redis feature can maintain two clients, one that is in subscribe mode, and another that is free to publish and run any other command.

```javascript
runtime.redis.subscribe('channel', (message) => {
  console.log('got message')
})

runtime.redis.publish('channel', 'some message')
```