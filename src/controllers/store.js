import express from "express";
import { constructStore, setFrequentQuestions } from "../services/store";
import { registerLogError, registerLogInfo } from "../middlewares/registerLog";

let router = express.Router();

router.get('/construct-stores', async (req, res) => {
  try {    
    registerLogInfo('creando tiendas');
    let response = await constructStore().catch(e => {
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
});

router.post('/create-frequent-question', async (req, res, next) => {
  try {    
    registerLogInfo('creando preguntas frecuentes');
    const frequentQuestions = req.body;
    let response = await setFrequentQuestions(frequentQuestions).catch(e => {
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
});

module.exports = router
