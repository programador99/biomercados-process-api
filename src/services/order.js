import { httpGet } from "./axios";
import Order from '../models/order'
import ProductMoreSeller from '../models/productsMoreSeller.js'
import { getNewProducts, getProductforCategory, getProductforSku, getProductsBioInsuperables, getProductsOfertas } from "./products";
import { getCategoriesPrincipal } from "./category";
import { getStores } from "./store";

const countAllOrderForWeek = async (lastDate, today) => {
  const url = 'rest/all/V1/orders?searchCriteria[pageSize]=1&searchCriteria[currentPage]=1&fields=total_count[0]&searchCriteria[filter_groups][0][filters][0][field]=created_at&searchCriteria[filter_groups][1][filters][0][field]=created_at&searchCriteria[filter_groups][0][filters][0][value]=' + lastDate + '&searchCriteria[filter_groups][0][filters][0][condition_type]=gt&searchCriteria[filter_groups][1][filters][0][value]=' + today + '&searchCriteria[filter_groups][1][filters][0][condition_type]=lt';
  const quantity = (await httpGet(url)).total_count;
  return { quantity, lastDate };
}

const getOrders = async (lastDate, today, quantity) => {
  const url = 'rest/all/V1/orders?searchCriteria[pageSize]=' + quantity + '&searchCriteria[currentPage]=1&searchCriteria[filter_groups][0][filters][0][field]=created_at&searchCriteria[filter_groups][1][filters][0][field]=created_at&searchCriteria[filter_groups][0][filters][0][value]=' + lastDate + '&searchCriteria[filter_groups][0][filters][0][condition_type]=gt&searchCriteria[filter_groups][1][filters][0][value]=' + today + '&searchCriteria[filter_groups][1][filters][0][condition_type]=lt';
  const ordersInWeek = (await httpGet(url)).items;
  return ordersInWeek;
}

export const getAndSaveAllOrdersInWeek = async () => {
  const quantityOrdesinWeek = await getQuantityOrdesinWeek(new Date());
  const today = formatDate(new Date());
  let orders = await getOrders(quantityOrdesinWeek.lastDate, today, quantityOrdesinWeek.quantity);
  orders = await formatOrders(orders);
  await Order.deleteMany();
  orders = await Order.insertMany(orders);
  return orders;
}

const getQuantityOrdesinWeek = async (today) => {
  let lastDate = new Date(today - 7 * 24 * 60 * 60 * 1000);
  today = formatDate(today);
  lastDate = formatDate(lastDate);
  let response = await countAllOrderForWeek(lastDate, today);
  response = JSON.parse(JSON.stringify(response));
  lastDate = response.lastDate;
  const quantity = response.quantity;
  if (!quantity) {
    getQuantityOrdesinWeek(lastDate)
  }
  return { quantity, lastDate };
}

const formatOrders = (orders) => {
  let ordersFormat = orders.map(order => {
    const orderformat = {
      currency: order.order_currency_code,
      subTotal: order.subtotal,
      tax: order.tax_amount,
      total: order.grand_total,
      customerName: order.customer_firstname + order.customer_lastname,
      createAt: order.created_at,
      email: order.customer_email,
      identification: order.customer_taxvat,
      discount: order.discount_amount,
      coupon: order.coupon_code,
      shippingAmount: order.shipping_amount,
      shippingDescription: order.shipping_description,
      status: order.status,
      storeId: order.store_id,
      weight: order.weight,
      totalItemsQuantity: order.total_item_count,
      products: formatProducts(order.items)
    }
    return orderformat;
  })
  return ordersFormat;
}

const formatProducts = (products) => {
  let productsFormat = products.map(product => {
    const productsFormat = {
      sku: product.sku,
      id: product.product_id,
      name: product.name,
      price: product.price,
      taxPercent: product.tax_percent,
      quantity: product.qty_ordered,
      weight: product.weight
    }
    return productsFormat;
  })
  return productsFormat;
}



export const constructBestSellingProductsPerWeek = async () => {
  let orders = await getAndSaveAllOrdersInWeek();

  let listOrdersForStore = {};
  for (const order of orders) {

    let listOrder = listOrdersForStore[order.storeId];

    if (!listOrder) {
      listOrder = [];
    }

    listOrder.push(order);
    listOrdersForStore[order.storeId] = listOrder;
  }

  await ProductMoreSeller.deleteMany();
  const storesViewsId = (await getStores()).map(store => store.storeViews[0].id);

  // fill listOrders empty for store
  for (const store of storesViewsId) {
    if (!listOrdersForStore[store]) {
      listOrdersForStore[store] = [];
    }
  }

  for (const ordersInStore in listOrdersForStore) {
    orders = listOrdersForStore[ordersInStore]
    let productsInAllOrdersForStore = [];
    for (const order of orders) {
      for (const product of order.products) {
        productsInAllOrdersForStore.push(product);
      }
    }

    let countsProducts = [];

    for await (const product of productsInAllOrdersForStore) {
      const isCount = countsProducts.filter(prod => prod.sku === product.sku)[0];
      if (isCount) {
        const productIndex = countsProducts.findIndex(prod => prod.sku === product.sku);
        countsProducts[productIndex].quantity = countsProducts[productIndex].quantity + product.quantity;
      } else {
        const _id = (await getProductforSku(product.sku))?._id;
        if (_id) {
          const productFormat = {
            _id,
            sku: product.sku,
            quantity: product.quantity
          };
          countsProducts.push(productFormat);
        }
      }
    }

    // Obteniendo lista de categorias padre
    let categoriesList = formatCategory(await getCategoriesPrincipal(), ordersInStore);

    // Agregamos los productos a las categorias a la que pertenece en una lista de productos
    // por categoria en la lista categoriesList[]
    for await (const product of countsProducts) {
      const categories = (await getProductforSku(product.sku)).categories;
      const categoryPrincipal = categories.filter(category => category?.isParent)[0];
      if (categoryPrincipal) {
        const indexCategoryPrincipal = categoriesList.findIndex(category => category.id == categoryPrincipal.id);
        if (indexCategoryPrincipal !== -1) {
          categoriesList[indexCategoryPrincipal].products.push(product.sku);
        }
      }
    };

    // Organiza la lista de categorias de menor a mayor y retorna
    // una sublista de id de los productos en la BD
    for (let i = 0; i < categoriesList.length; i++) {
      let orderProducts = categoriesList[i].products.sort((a, b) => {
        if (a.quantity < b.quantity) {
          return 1;
        } else {
          return -1;
        }
      });

      categoriesList[i].products = orderProducts.slice(0, 9).map(product => product);
    }

    // Validamos si quedaron categorias pendientes por mostrar
    console.info("Tiendas:", ordersInStore);
    for (const category of categoriesList) {
      try {
        let limitCount = 10;
        let countProducts = category?.products.length;
        let residualCountProducts = Math.abs(countProducts - limitCount);
        ordersInStore == 9 && console.info(limitCount, category?.id, countProducts, residualCountProducts);

        if (residualCountProducts > 0) {
          const indexCategoryPrincipal = categoriesList.findIndex(cat => cat.id === category.id);
          let cProducts = categoriesList[indexCategoryPrincipal].products;
          const categoryProductsIds = (await getProductforCategory(category.id, ordersInStore)).map(product => {
            if (!cProducts.includes(product)) {
              return product;
            }
          }).filter(product => product).slice(0, residualCountProducts);

          let categoryProducts = [...categoriesList[indexCategoryPrincipal].products, ...categoryProductsIds];
          ordersInStore == 9 && console.info(categoryProductsIds);
          categoriesList[indexCategoryPrincipal].products = categoryProducts; //Array.from(new Set(categoryProducts));
          // console.info(categoriesList[indexCategoryPrincipal], "lista de categorias");
        }
      } catch (error) {
        console.error(error);
        throw error;
      }
    }

    const productsBioInsuperables = await getProductsBioInsuperables();
    const productsOfertas = await getProductsOfertas();
    const productsNews = await getNewProducts();

    // for (const storeViewsId of storesViewsId) {
    let productsBioInsuperableInStore = [];
    productsBioInsuperables.forEach(product => {
      const storeProduct = product.stores.find(store => store.id == ordersInStore && store.bioinsuperable == true);
      if (storeProduct) {
        productsBioInsuperableInStore.push(product.sku);
      }
    });

    let productsOfertaInStore = [];
    productsOfertas.forEach(product => {
      const storeProduct = product.stores.find(store => store.id == ordersInStore && store.oferta == true);
      if (storeProduct) {
        productsOfertaInStore.push(product.sku);
      }
    });

    let productsNewsInStore = [];
    productsNews.forEach(product => {
      const storeProduct = product.stores.find(store => store.id == ordersInStore);
      if (storeProduct) {
        productsNewsInStore.push(product.sku);
      }
    });


    const categoryBioinsuperable = {
      id: -1,
      name: "Bioinsuperable",
      storeId: ordersInStore,
      category_route: "/store/search?search=bioinsuperable",
      brand: getCategoryBrandMoreSeller('-1'),
      products: productsBioInsuperableInStore.slice(0, 10),
    };

    // Productos de oferta
    const categoryOferta = {
      id: -2,
      name: "Ofertas",
      storeId: ordersInStore,
      category_route: "/store/search?search=oferta",
      brand: getCategoryBrandMoreSeller('-2'),
      products: productsOfertaInStore.slice(0, 10),
    };

    // Productos de oferta
    const categoryNews = {
      id: -3,
      name: "Nuevos",
      storeId: ordersInStore,
      category_route: "/store/search?search=nuevos",
      brand: null,
      products: productsNewsInStore.slice(0, 10),
    };

    if (categoriesList.some(item => item.id == -1 && item.storeId == ordersInStore) == false)
      categoriesList.push(categoryBioinsuperable, /*categoryOferta,*/ categoryNews);
    // }

    // let categoryIds = categoriesList.map(item => item.id);
    // categoriesList = categoriesList.filter(({ id }, index) => !categoryIds.includes(id, index + 1));

    // console.info(categoriesList)


    categoriesList = await ProductMoreSeller.insertMany(categoriesList);
  }

  return await ProductMoreSeller.find();
}

const getCategoryBrandMoreSeller = (catId) => {
  switch (catId) {
    case '-1':
      return 'BIOINSUPERABLES';
    case '-2':
      return 'OFERTAS';
    case '-3':
    default:
      return null;
  }
};

const formatCategory = (categories, ordersInStore) => {
  let categoriesFormat = categories.map(category => {
    const format = {
      id: category.id,
      name: category.name,
      storeId: ordersInStore,
      brand: getCategoryBrandMoreSeller(category.id),
      products: []
    }
    return format;
  })
  return categoriesFormat;
}

const formatDate = (date) => {
  var d = new Date(date),
    month = '' + (d.getMonth() + 1),
    day = '' + d.getDate(),
    year = d.getFullYear();

  if (month.length < 2)
    month = '0' + month;
  if (day.length < 2)
    day = '0' + day;

  return [year, month, day].join('-');
}
