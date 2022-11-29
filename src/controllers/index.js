import express from "express";
import productRouter from './products'
import ordersRouter from './orders'
import storeRouter from './store'
import initRouter from './init'

function createRouter (app) {
  app.all('*',function(req,res,next){
    res.header('Access-Control-Allow-Origin',"*");
    res.header('Access-Control-Allow-Headers', "X-Requested-With")
    next();
  });
  const router = express.Router();
  app.use('/process/v1', router);
  router.use('/init', initRouter);
  router.use('/products', productRouter);
  router.use('/orders', ordersRouter);
  router.use('/store', storeRouter);
}


module.exports = createRouter;