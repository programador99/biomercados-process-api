import express from "express"

import { constructCategories } from "../services/category";
import { constructProducts, updateProducts, synchronizeProducts, updateProductsForSku, constructProductsForSku } from "../services/products";
import { registerLogError, registerLogInfo } from "../middlewares/registerLog";

let router = express.Router()

router.get("/create", async (req, res) => {
  try {
    registerLogInfo('construyendo productos');
    const products = await constructProducts().catch(e => {
      if (e.response.status && e.response.data.message) {
        throw { code: e.response.status, message: e.response.data.message };
      } else {
        throw { code: 400, message: "Error en la insercion a la base de datos, por favor revisa los parametros e intenta nuevamente" }
      }
    });

    // Actualizando unidades
    synchronizeProducts().catch(e => {
      if (e.response.status && e.response.data.message) {
        throw { code: e.response.status, message: e.response.data.message };
      } else {
        throw { code: 400, message: "Error en la insercion a la base de datos, por favor revisa los parametros e intenta nuevamente" }
      }
    });
    res.status(200).json(products);
  } catch (error) {
    if (error.code && error.message) {
      registerLogError(error.message);
      res.status(error.code).json(error.message);
    } else {
      registerLogError('error inesperado ' + JSON.stringify(error));
      res.status(500).json(error);
    }
  }
})

router.get("/category", async (req, res) => {
  try {
    registerLogInfo('construyendo categorias');
    let categories = await constructCategories().catch(e => {
      throw { code: 400, message: "Error en la insercion a la base de datos, por favor revisa los parametros e intenta nuevamente" }
    });
    res.status(200).json(categories);
  } catch (error) {
    console.info(error)
    if (error.code && error.message) {
      registerLogError(error.message);
      res.status(error.code).json(error.message);
    } else {
      registerLogError('error inesperado ' + JSON.stringify(error));
      res.status(500).json(error);
    }
  }
})

router.get('/synchronize', async (req, res) => {
  try {
    registerLogInfo('sincronizando productos');
    let response = await synchronizeProducts().catch(e => {
      if (e.response.status && e.response.data.message) {
        throw { code: e.response.status, message: e.response.data.message };
      } else {
        throw { code: 400, message: "Error en la insercion a la base de datos, por favor revisa los parametros e intenta nuevamente" }
      }
    });
    res.status(200).json(response);
  } catch (error) {
    if (error.code && error.message) {
      registerLogError(error.message);
      res.status(error.code).json(error.message);
    } else {
      registerLogError('error inesperado ' + JSON.stringify(error));
      res.status(500).json(error);
    }
  }
})

router.post('/update', async (req, res) => {
  try {
    registerLogInfo('actualizando productos');
    const { update } = req.body;

    if (!update) {
      throw { code: 400, message: "Debe enviar un payload" }
    }

    let response = await updateProducts(update).catch(e => {
      if (e.response.status && e.response.data.message) {
        throw { code: e.response.status, message: e.response.data.message };
      } else {
        throw { code: 400, message: "Error en la insercion a la base de datos, por favor revisa los parametros e intenta nuevamente" }
      }
    });

    registerLogInfo(`Productos actualizados: ${update?.length}`);
    res.status(200).json(response);
  } catch (error) {
    if (error.code && error.message) {
      registerLogError(error.message);
      res.status(error.code).json(error.message);
    } else {
      registerLogError('error inesperado ' + JSON.stringify(error));
      res.status(500).json(error);
    }
  }
})

router.post('/create-for-sku', async (req, res) => {
  try {
    registerLogInfo('creando productos por sku');
    const { update } = req.body;

    if (!update) {
      throw { code: 400, message: "Debe enviar un payload" }
    }

    await constructProductsForSku(update).catch(e => {
      console.log(e);
      if (e.response.status && e.response.data.message) {
        throw { code: e.response.status, message: e.response.data.message };
      } else {
        throw { code: 400, message: "Error en la insercion a la base de datos, por favor revisa los parametros e intenta nuevamente" }
      }
    });
    res.status(200).json('created');
  } catch (error) {

    if (error.code && error.message) {
      registerLogError(error.message);
      res.status(error.code).json(error.message);
    } else {
      registerLogError('error inesperado ' + JSON.stringify(error));
      res.status(500).json(error);
    }
  }

})
router.put('/update-for-sku', async (req, res) => {
  try {
    registerLogInfo('actualizando productos por sku');
    const { update } = req.body;

    if (!update) {
      throw { code: 400, message: "Debe enviar un payload" }
    }

    await updateProductsForSku(update).catch(e => {
      if (e.response.status && e.response.data.message) {
        throw { code: e.response.status, message: e.response.data.message };
      } else {
        throw { code: 400, message: "Error en la insercion a la base de datos, por favor revisa los parametros e intenta nuevamente" }
      }
    });
    res.status(200).json('update');
  } catch (error) {
    if (error.code && error.message) {
      registerLogError(error.message);
      res.status(error.code).json(error.message);
    } else {
      registerLogError('error inesperado ' + JSON.stringify(error));
      res.status(500).json(error);
    }
  }

})

module.exports = router
