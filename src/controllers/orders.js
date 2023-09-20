import express from "express"
import { constructBestSellingProductsPerWeek } from "../services/order";
import { registerLogError, registerLogInfo } from "../middlewares/registerLog";

let router = express.Router();

router.get('/constructProductsBestSelling', async (req, res) => {
  try {
    registerLogInfo('construyendo los productos mas vendidos');
    const orders = await constructBestSellingProductsPerWeek().catch(e => {
      console.error(e);
      if (e.response.status && e.response.data.message) {
        throw { code: e.response.status, message: e.response.data.message };
      } else {
        throw { code: 400, message: "Error en la insercion a la base de datos, por favor revisa los parametros e intenta nuevamente" }
      }
    });
    res.status(200).json(orders);
    
  } catch (error) {
    console.error(error);
    if (error.code && error.message) {
      registerLogError(error.message);
      res.status(error.code).json(error.message);
    } else {
      registerLogError('error inesperado ' + JSON.stringify(error));
      res.status(500).json(error);
    }
  }
})

module.exports = router;