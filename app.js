const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors')
const app = express();
const {redis} = require('./redis/redis')
 async function mongo(){
    try {
    
        await mongoose.connect('mongodb+srv://penzyl:penzyl123@cluster0-j7uuv.mongodb.net/penzyl?retryWrites=true&w=majority',{useUnifiedTopology:true,useNewUrlParser:true})
         console.log(`mongodb is connected`)
         
     } catch (error) {
         console.log(error)
     }
}
mongo()
async function redisConnect(){
    try {
        await redis.initializeRedis()
    } catch (error) {
        throw error
    }
}
redisConnect()

app.get('/', (req, res) => res.send('<h1>Hello World!<h1>'))
app.use(express.json())
app.use(cors())
app.use('/apis/v1/user',require('./router/user'))
const port = process.env.port || 3000

app.listen(port,()=>{
    console.log(`port is connected on ${port}`)
})