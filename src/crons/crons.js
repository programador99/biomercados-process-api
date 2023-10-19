import cron from "node-cron";
import { constructCategories } from "../services/category";
import { constructBestSellingProductsPerWeek } from "../services/order";
import { constructProducts, synchronizeProducts } from "../services/products";
import { constructStore } from "../services/store";

export const runJobs = () => {
  // Trabajos ejecutados cada hora
  cron.schedule("0 */1 * * *", async () => {
    console.log("Comenzo proceso de cada hora");
    synchronizeProducts().catch((e) => {
      if (e.response?.status && e.response.data.message) {
        throw {
          code: e.response?.status,
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
    console.log("termino de cada hora");
  });

  // Trabajos ejecutados cada dia
  cron.schedule("0 0 * * *", async () => {
    console.log("comenzo proceso el proceso diario");
    // Construccion de categorias
    await constructCategories().catch((e) => {
      if (e.response?.status && e.response.data.message) {
        throw {
          code: e.response?.status,
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

    // Construccion de productos, mas vendidos
    await constructProducts().catch((e) => {
      if (e.response?.status && e.response.data.message) {
        throw {
          code: e.response?.status,
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

    console.log("termino el proceso diario")
  });

  // Trabajos ejecutados todos los dias a las 00:00 y a las 03:00
  cron.schedule("0 0,3 * * *", async () => {
    console.log("comenzo proceso de cada semana");
    // Construccion de productos mas vendidos
    await constructBestSellingProductsPerWeek().catch((e) => {
      if (e.response?.status && e.response.data.message) {
        throw {
          code: e.response?.status,
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

    // Construccion de tiendas
    await constructStore().catch((e) => {
      if (e.response?.status && e.response.data.message) {
        throw {
          code: e.response?.status,
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
    console.log("termino de cada semana");
  });
};
