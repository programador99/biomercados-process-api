import cron from "node-cron";
import { constructCategories } from "../services/category";
import { constructBestSellingProductsPerWeek } from "../services/order";
import { constructProducts, synchronizeProducts } from "../services/products";
import { constructStore } from "../services/store";

const runJobs = () => {
  //trabajos ejecutados cada hora
  /*cron.schedule("0 27 * * * *", async () => {
    console.log("comenzo proceso el de cada hora");
    synchronizeProducts().catch((e) => {
      if (e.response.status && e.response.data.message) {
        throw {
          code: e.response.status,
          message: e.response.data.message,
        };
      } else {
        throw {
          code: 400,
          message:
            "Error en la insercion a la base de datos, por favor revisa los parametros e intenta nuevamente",
        };
      }
    });
    console.log("termino el de cada hora");
  });*/

  //trabajos ejecutados cada dia
  cron.schedule("0 0 0 * * *", async () => {
    console.log("comenzo proceso el proceso diario");
   /* await constructProducts().catch((e) => {
      if (e.response.status && e.response.data.message) {
        throw {
          code: e.response.status,
          message: e.response.data.message,
        };
      } else {
        throw {
          code: 400,
          message:
            "Error en la insercion a la base de datos, por favor revisa los parametros e intenta nuevamente",
        };
      }
    });*/
    /*await constructCategories().catch((e) => {
      if (e.response.status && e.response.data.message) {
        throw {
          code: e.response.status,
          message: e.response.data.message,
        };
      } else {
        throw {
          code: 400,
          message:
            "Error en la insercion a la base de datos, por favor revisa los parametros e intenta nuevamente",
        };
      }
    });*/
    console.log("termino el proceso diario")
  });

  //trabajos ejecutados cada semana
  cron.schedule("0 0 8 * * 0", async () => {
    console.log("comenzo proceso el de cada semana");
   /* await constructBestSellingProductsPerWeek().catch((e) => {
      if (e.response.status && e.response.data.message) {
        throw {
          code: e.response.status,
          message: e.response.data.message,
        };
      } else {
        throw {
          code: 400,
          message:
            "Error en la insercion a la base de datos, por favor revisa los parametros e intenta nuevamente",
        };
      }
    }); */
    await constructStore().catch((e) => {
      if (e.response.status && e.response.data.message) {
        throw {
          code: e.response.status,
          message: e.response.data.message,
        };
      } else {
        throw {
          code: 400,
          message:
            "Error en la insercion a la base de datos, por favor revisa los parametros e intenta nuevamente",
        };
      }
    });
    console.log("termino el de cada semana");
  });
};

module.exports = {
  runJobs,
};
