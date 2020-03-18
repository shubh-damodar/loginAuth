const ioredis = require('ioredis')
class Redis{
   
  constructor(){
    this.redis = ioredis.Redis
    this.options = ioredis.redisOptions ={
      host:"127.0.0.1",
      port:6379
  }
  }
   async initializeRedis(){
       try{
        this.redis = new ioredis(this.options)
        console.log(`redis connected`)
       }catch(error){
           throw error
       }
   }
   async get(id){
       try {
         let value = await this.redis.get(id)
         return value
       } catch (error) {
           throw error
       }
   }
   async hmset(id,body,expiryMinutes){
       try {
           if(expiryMinutes!==null){
               return await this.redis.hmset(id,body,expiryMinutes*60*1000)
           }else{
               return await this.redis.hmset(id,body)
           }
       } catch (error) {
           throw error
       }

   }
   async hset(id,body,expiryMinutes){
    try {
        if(expiryMinutes!==null){
            return await this.redis.hset(id,body,expiryMinutes*60*1000)
        }else{
            return await this.redis.hset(id,body)
        }
    } catch (error) {
        throw error
    }

   }
    async set(id, body, expiryInMinutes) {
    try {
        if (expiryInMinutes!==null) {
            let value = await this.redis.set(id, body, 'ex', expiryInMinutes * 60 * 1000);
            return value;
        } else {
            let value = await this.redis.set(id, body);
            return value;
        }

    } catch (error) {
        console.log(">>>>>>: Redis -> error", error);
        throw error;
    }

}
 async delete(id){
    try {
        let value = await this.redis.del(id);
        return value
    } catch (error) {
        throw error;
    }
}
async expire(id,expiryInMinutes){
    try {
        let value = await this.redis.expire(id,expiryInMinutes)
        return value
    } catch (error) {
        throw error
    }
}
async hgetall(id){
 try {
    let details = await this.redis.hgetall(id)
    console.log(JSON.parse(details))
    return details
 } catch (error) {
     throw error
 }
}
}

module.exports={
    redis:new Redis()
}