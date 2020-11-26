const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
require('dotenv').config()

const routes = require('./src/routes/routes')

const app = express()

async function main() {   
    
    //Server Start
    await app.listen(process.env.PORT || 8000);
    console.log(`Server Start at port ${process.env.PORT || 8000}`);
   
    //middlewares
    app.use(express.json());
    app.use(morgan('dev'))  
    app.use(cors());
    
    //Routes
    app.use("/api", routes);
  
    return app;
}

module.exports = main();