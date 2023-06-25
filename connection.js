const { mongoose } = require("mongoose");

function connectDb(url){
    return mongoose.connect(url).then(()=>{
        console.log("connecton stablish to mongodb");
    }).catch((err)=>{
        console.log(`connection failed err:${err}`);
        process.exit(1);
    })
}

module.exports={
    connectDb,
}