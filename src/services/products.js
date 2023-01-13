import { httpGet } from "./axios";
import Product from "../models/product";
import TemporalProduct from "../models/temporalProducts";
import { getCategoryForId } from "./category";
import axios from "axios";

const baseUrl =
  process.env.MEDIA_URL_MAGENTO || "https://biomercados.com.ve/media/";
const prefixImagePath =
  "catalog/product/cache/f7518a5bb674ebdb0160bf37e33f351f";

const urlIntegrator = process.env.URL_INTEGRATOR;

export const constructProducts = async () => {
  const quantityProductsTotal = await getQuantityProducts();
  const quantityForProcess = 100;
  console.log("construyendo productos...");
  const sectionsForJob = createSectionsForProducts(
    quantityProductsTotal,
    quantityForProcess
  );

  let products = [];

  let indexSectionGetMagento = 1;
  await TemporalProduct.deleteMany();
  for await (const section of sectionsForJob) {
    products = await getAllProducts(quantityForProcess, indexSectionGetMagento);
    products = await TemporalProduct.insertMany(products);
    indexSectionGetMagento++;
  }

  await Product.deleteMany();
  const storesCode = await getSitesStore();

  let indexSection = 0;
  console.info("Construyendo atributos...");
  const customAttributesMap = await constructCustomAtributes();
  for await (const section of sectionsForJob) {
    products = await TemporalProduct.find({}, null, {
      skip: indexSection * quantityForProcess,
      limit: quantityForProcess,
    });
    products = await formatProducts(storesCode, products, customAttributesMap);
    await Product.insertMany(products);
    indexSection++;
  }

  products = await Product.find();
  console.log("termino", products.length);
  return products;
};

const createSectionsForProducts = (
  quantityProductsTotal,
  quantityForProcess
) => {
  const iterationesCicle = Math.ceil(
    quantityProductsTotal / quantityForProcess
  );
  let sectionsForProducts = [];
  for (let index = 0; index < iterationesCicle; index++) {
    sectionsForProducts.push(index * quantityForProcess);
  }
  sectionsForProducts.push(quantityProductsTotal);
  return sectionsForProducts;
};

const getQuantityProducts = async () => {
  const url =
    "rest/all/V1/products?searchCriteria[pageSize]=1&searchCriteria[currentPage]=0&fields=total_count[0]";
  return (await httpGet(url)).total_count;
};

const getAllProducts = async (quantity, page) => {
  const url =
    "rest/all/V1/products?searchCriteria[currentPage]=" +
    page +
    "&searchCriteria[pageSize]=" +
    quantity +
    "&fields=items[id,name,sku,price,status,visibility,weight,extension_attributes,media_gallery_entries,product_links,custom_attributes]";
  return (await httpGet(url)).items;
};

const getProductsForSku = async (listSku) => {
  let stringSKU = "";
  for (const sku of listSku) {
    stringSKU = stringSKU + sku + ",";
  }
  const url =
    "rest/all/V1/products?searchCriteria[filter_groups][0][filters][0][field]=sku&searchCriteria[filter_groups][0][filters][0][value]=" +
    stringSKU +
    "&searchCriteria[filter_groups][0][filters][0][condition_type]=in&fields=items[id,name,sku,price,status,visibility,weight,extension_attributes,media_gallery_entries,product_links,custom_attributes]";
  return (await httpGet(url)).items;
};

const getSitesStore = async () => {
  const url = "rest/V1/store/storeConfigs";
  const sites = await httpGet(url);
  let coincidences = [];
  let sitesReturn = [];
  sites.forEach((site) => {
    const coincidenceId = coincidences.filter(
      (coincidence) => coincidence === site.website_id
    )[0];
    if (!coincidenceId) {
      coincidences.push(site.website_id);
      const website = {
        id: site.website_id,
        code: site.code,
      };
      sitesReturn.push(website);
    }
  });
  return sitesReturn;
};

const formatProducts = async (storesCode, products, customAttributesMap) => {
  let formatingProducts = [];
  try {
    for await (let product of products) {
      product = JSON.parse(JSON.stringify(product));
      const stores = addProductStores(storesCode, product);
      const categories = await addCategories(product);

      const formatProduct = {
        image: addImageInProduct(product),
        ...addCustomAtributes(product, customAttributesMap),
        stores,
        categories,
        ...product,
      };
      formatingProducts.push(formatProduct);
    }
  } catch (e) {
    console.log("se produjo un error en el formato", e);
  }
  return formatingProducts;
};

const addCategories = async (product) => {
  let categories = [];
  const listCategoriesLinks = product.extension_attributes?.category_links;
  if (listCategoriesLinks && listCategoriesLinks.length != 0) {
    for await (const categoryLink of listCategoriesLinks) {
      const category = await getCategoryForId(categoryLink.category_id);
      categories.push(category);
    }
  }
  delete product.extension_attributes;
  return categories;
};

const addCustomAtributes = (product, customAttributesMap) => {
  if (product.custom_attributes.length > 0) {
    const sponsored = getBooleanValue(
      parseInt(
        product.custom_attributes.filter(
          (attribute) => attribute.attribute_code == "patrocinado"
        )[0]?.value
      )
    );

    const bioinsuperable = getBooleanValue(
      parseInt(
        product.custom_attributes.filter(
          (attribute) => attribute.attribute_code == "bioinsuperable"
        )[0]?.value
      )
    );

    let brand = product.custom_attributes.filter(
      (attribute) => attribute.attribute_code == "marca"
    )[0]?.value;
    let options = customAttributesMap.filter(
      (item) => item.attribute_code === "marca"
    )[0]?.options;
    if (options) {
      brand = options.filter((option) => option.value == brand)[0];
    } else {
      brand = null;
    }

    let origin = product.custom_attributes.filter(
      (attribute) => attribute.attribute_code == "origen"
    )[0]?.value;
    options = customAttributesMap.filter(
      (item) => item.attribute_code === "origen"
    )[0]?.options;
    if (options) {
      origin = options.filter((option) => option.value == origin)[0];
    } else {
      origin = null;
    }

    let packing = product.custom_attributes.filter(
      (attribute) => attribute.attribute_code == "empaque"
    )[0]?.value;
    options = customAttributesMap.filter(
      (item) => item.attribute_code === "empaque"
    )[0]?.options;
    if (options) {
      packing = options.filter((option) => option.value == packing)[0];
    } else {
      packing = null;
    }

    // Impuesto del producto
    let tax = product.custom_attributes.filter(
      (attribute) => attribute.attribute_code === "tax_class_id"
    )[0]?.value;
    options = customAttributesMap.filter(
      (item) => item.attribute_code === "tax_class_id"
    )[0]?.options;
    if (options) {
      tax = getTaxValue(
        options.filter((option) => option.value == tax)[0]?.label
      );
    } else {
      tax = null;
    }

    // Evalua un valor y devuelve un <Boolean>
    let isAgeRestricted = getBooleanValue(
      parseInt(
        product.custom_attributes.filter(
          (attribute) => attribute.attribute_code == "isagerestricted"
        )[0]?.value
      )
    );

    let description = product.custom_attributes.filter(
      (attribute) => attribute.attribute_code == "short_description"
    )[0]?.value;

    // let sponsored = false;
    // let bioinsuperable = false;

    // if (sponsoredNumber == 1) {
    //   sponsored = true;
    // }

    // if (sponsoredNumber == 1) {
    //   bioinsuperable = true;
    // }

    // if (isAgeRestricted == 1) {
    //   isAgeRestricted = true;
    // } else {
    //   isAgeRestricted = false;
    // }

    //comentar para ver los demas custom attributes
    delete product.custom_attributes;
    return {
      sponsored,
      bioinsuperable,
      brand,
      origin,
      packing,
      isAgeRestricted,
      tax,
      description,
    };
  }
};

const getTaxValue = (code) => {
  const tax_class_id = {
    EXCENTO: 0,
    "IVA 8%": 0.8,
    "IVA 16%": 0.16,
  };

  return tax_class_id[code] ?? 0;
};

const getBooleanValue = (value) => {
  return value === 1;
};

const addProductStores = (storesCode, product) => {
  let stores = [];
  try {
    if (product.extension_attributes) {
      for (const webSiteId of product.extension_attributes.website_ids) {
        let store = storesCode.filter(
          (storeCode) => storeCode.id == webSiteId
        )[0];
        store.stock = 0;
        store.price = product.price;
        store.bioinsuperable = product.bioinsuperable;
        stores.push(store);
      }

      delete product.extension_attributes.website_ids;
    }
  } catch (e) {
    console.log(
      "se produjo un error en agregar el stock producto",
      e.response?.status
    );
  }
  return stores;
};

const addImageInProduct = (product) => {
  let image =
    "https://beta.biomercados.com.ve/media/catalog/product/placeholder/default/bio_placeholder.webp";

  if (product.media_gallery_entries[0]) {
    image = baseUrl + prefixImagePath + product.media_gallery_entries[0].file; //.replace('.jpeg' || '.png', '.webp');
  }
  delete product.media_gallery_entries;
  return image;
};

const constructCustomAtributes = async () => {
  const url =
    "rest/V1/products/attributes?searchCriteria[filterGroups][0][filters][0][field]=attribute_code&searchCriteria[filterGroups][0][filters][0][value]=marca,empaque,origen,tax_class_id&fields=items[attribute_code,options]&searchCriteria[filterGroups][0][filters][0][condition_type]=in";
  return (await httpGet(url)).items;
};

export const updateProducts = async (update) => {
  let response = [];
  for await (const productToUpdate of update) {
    let product = JSON.parse(
      JSON.stringify(await getProductforSku(productToUpdate.sku))
    );
    if (product) {
      const upd = await Product.findOneAndUpdate(
        { sku: productToUpdate.sku },
        { $set: { stores: productToUpdate.stores } },
        { new: true }
      );
      response.push(upd);
    }
  }
  return response;
};

export const updateProductsForSku = async (listSku) => {
  const productsOfMagento = await getProductsForSku(listSku);

  const storesCode = await getSitesStore();

  const customAttributesMap = await constructCustomAtributes();
  const products = await formatProducts(
    storesCode,
    productsOfMagento,
    customAttributesMap
  );

  for (const product of products) {
    delete product.stores;
    const response = await Product.updateOne(
      { sku: product.sku },
      { ...product }
    );
  }
};

export const constructProductsForSku = async (listSku) => {
  /** validate exist in mongo */
  let listForCreated = [];
  for await (const sku of listSku) {
    const productInDatabase = await getProductforSku(sku);
    if (!productInDatabase) {
      listForCreated.push(sku);
    }
  }

  if (listForCreated.length > 0) {
    const productsOfMagento = await getProductsForSku(listForCreated);
    const storesCode = await getSitesStore();
    const customAttributesMap = await constructCustomAtributes();
    const products = await formatProducts(
      storesCode,
      productsOfMagento,
      customAttributesMap
    );
    await Product.insertMany(products);
    await synchronizeProductsForSku(listForCreated);
  }
};

export const getProductsBioInsuperables = async () => {
  return await Product.find({
    stores: {
      $all: [{ $elemMatch: { bioinsuperable: true, stock: { $gt: 0 } } }],
    },
  });
};

export const synchronizeProducts = async () => {
  const url = urlIntegrator;
  const payload = {
    type: "ALL_SIMPLE_PRODUCTS",
    params: null,
  };
  const response = await axios.post(url, payload);
  return response.data;
};

export const synchronizeProductsForSku = async (skuList) => {
  const url = urlIntegrator;
  const payload = {
    type: "SYNC_BY_SKU",
    params: skuList,
  };
  const response = await axios.post(url, payload);
  return response.data;
};

export const getProductforSku = async (sku) => {
  return await Product.findOne({ sku }, { __v: 0 });
};

export const getProductforCategory = async (categoryId, storeViewId) => {
  // const storeId = await getStoreByViewId(storeViewId);
  const categoryFilter = {
    stores: {
      $elemMatch: { id: storeViewId, stock: { $gt: 0 }, price: { $gt: 0 } },
    },
    categories: { $elemMatch: { id: categoryId } },
    image: {
      $ne: "https://beta.biomercados.com.ve/media/catalog/product/placeholder/default/bio_placeholder.webp",
    },
  };

  // Ejemplo
  // {stores: {$elemMatch: { id: { $eq: '2' }, stock: { $gt: 0 }, price: { $gt: 0 }}},categories: {$elemMatch: { id: 3}},image: {$ne: 'https://beta.biomercados.com.ve/media/catalog/product/placeholder/default/bio_placeholder.webp'}}

  // Si la categoria es licores, solo ubicara productos
  // que esten solo para esa categoria
  // if (categoryId === 18) {
  //   categoryFilter = {
  //     ...categoryFilter,
  //     categories: {
  //       ...categoryFilter.categories,
  //       $size: 3
  //     }
  //   };
  // }

  let products = await Product.find(categoryFilter, { __v: 0 });

  products = products
    .map((product) => {
      let countParentInProductCategory = product.categories.filter(
        (category) => category?.isParent === true
      );

      // Solo debe existe una categoria padre asociada al producto
      if (
        countParentInProductCategory &&
        countParentInProductCategory.length === 1
      ) {
        return product;
      } else {
        return null;
      }

      // return null;
    })
    .filter((product) => product);

  return products;
};
