import express from "express"

import { constructCategories } from "../services/category";
import { constructProducts, getProductforCategory, synchronizeProducts } from "../services/products";
import { constructBestSellingProductsPerWeek } from "../services/order";
import { constructStore } from "../services/store";

import { registerLogError, registerLogInfo } from "../middlewares/registerLog";

let router = express.Router()

router.get("/create-all", async (req, res) => {
  try {
    await constructProducts().catch(e => {
      if (e.response.status && e.response.data.message) {
        throw { code: e.response.status, message: e.response.data.message };
      } else {
        throw { code: 400, message: "Error en la insercion a la base de datos, por favor revisa los parametros e intenta nuevamente" }
      }
    });
    console.log('sincronizando productos');
    registerLogInfo('sincronizando productos');
    await synchronizeProducts().catch(e => {
      if (e.response.status && e.response.data.message) {
        throw { code: e.response.status, message: e.response.data.message };
      } else {
        throw { code: 400, message: "Error en la insercion a la base de datos, por favor revisa los parametros e intenta nuevamente" }
      }
    });
    console.log('construyendo las tiendas');
    registerLogInfo('construyendo las tiendas');
    await constructStore().catch(e => {
      if (e.response.status && e.response.data.message) {
        throw { code: e.response.status, message: e.response.data.message };
      } else {
        throw { code: 400, message: "Error en la insercion a la base de datos, por favor revisa los parametros e intenta nuevamente" }
      }
    });
    console.log('construyendo las categorias');
    registerLogInfo('construyendo las categorias');
    await constructCategories().catch(e => {
      if (e.response.status && e.response.data.message) {
        throw { code: e.response.status, message: e.response.data.message };
      } else {
        throw { code: 400, message: "Error en la insercion a la base de datos, por favor revisa los parametros e intenta nuevamente" }
      }
    });
    console.log('construyendo los productos mas vendidos');
    registerLogInfo('construyendo los productos mas vendidos');
    await constructBestSellingProductsPerWeek().catch(e => {
      if (e.response.status && e.response.data.message) {
        throw { code: e.response.status, message: e.response.data.message };
      } else {
        throw { code: 400, message: "Error en la insercion a la base de datos, por favor revisa los parametros e intenta nuevamente" }
      }
    });
    res.status(200).json({ message: 'create all' });
  } catch (error) {
    if (error.code && error.message) {
      registerLogError(error.message);
      res.status(error.code).json(error.message);
    } else {
      registerLogError('error inesperado ' + JSON.stringify(error));
      res.status(500).json(error);
    }
  }
});

router.get('/sync-best-selling-products', async (req, res) => {
  try {
    console.log('construyendo los productos mas vendidos');
    registerLogInfo('construyendo los productos mas vendidos');
    const bestProductSeller = await constructBestSellingProductsPerWeek().catch(e => {
      if (e.response.status && e.response.data.message) {
        throw { code: e.response.status, message: e.response.data.message };
      } else {
        throw { code: 400, message: "Error en la insercion a la base de datos, por favor revisa los parametros e intenta nuevamente" }
      }
    });

    res.json(bestProductSeller);
  } catch (error) {
    registerLogError('error inesperado ' + JSON.stringify(error));
    res.status(500).json(error);
  }
});

router.post('/get-product-by-category-id', async (req, res) => {
  const products = await getProductforCategory(req.body.category_id);
  res.json(products);
});

module.exports = router