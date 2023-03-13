import { httpGet } from "./axios"
import Category from '../models/category'

const baseUrl = process.env.MEDIA_URL_MAGENTO;

export const getCategoriesPrincipal = async () => {
  return await Category.find({ isParent: true }, { _id: 0, __v: 0 });
}

const getCategoryById = async (categoryId) => {
  const url =
    "rest/V1/categories/" +
    categoryId +
    "?fields=id,name,is_active,children,custom_attributes"
  return await httpGet(url)
}

export const constructCategories = async () => {
  const url = "rest/V1/categories";
  let categories = await httpGet(url);

  categories = await recursiveExtractChildrenData(categories.children_data);


  if (categories) {
    await Category.deleteMany();
    categories = await Category.insertMany(categories);
  }

  return categories;
}

const recursiveExtractChildrenData = async (children) => {
  let temp = [];

  for (let child of children) {
    if (!temp.some(cat => cat.id === child.id) && child.is_active === true) {
      let category = child.parent_id === 2 ? await getCategoryById(child.id) : null;

      let image = category ?
        baseUrl +
        category.custom_attributes.filter(
          (atribute) => atribute.attribute_code == "image"
        )[0]?.value.replace(/\/media\//, '')/*.slice(1).replace('jpeg' || 'png','webp')*/ : '';

      temp.push({
        id: child.id,
        parent_id: child.parent_id,
        name: child.name,
        is_active: child.is_active,
        isParent: child.parent_id === 2 ? true : false,
        image,
        gallery_image: child.parent_id ? getGalleryImage(child.id) : null,
        isAgeRestricted: false
      });
    }

    if (child.children_data && child.children_data?.length > 0) {
      temp = [...temp, ...(await recursiveExtractChildrenData(child.children_data))];
    }
  }

  return temp;
}

export const getCategories = async () => {
  return await Category.find({}, { _id: 0, __v: 0 })
}

export const getCategoryForId = async (categoryId) => {
  return await Category.findOne({ id: categoryId });
}

const getGalleryImage = (categoryId) => {
  const map = {
    3:    'https://media.biomercados.com.ve/media/movil/categorias/frutas-y-hortalizas.webp',
    5:    'https://media.biomercados.com.ve/media/movil/categorias/carnes-aves-y-congelados.webp',
    4:    'https://media.biomercados.com.ve/media/movil/categorias/viveres.webp',
  993:    'https://media.biomercados.com.ve/media/movil/categorias/panes-y-tortas.webp',
    9:    'https://media.biomercados.com.ve/media/movil/categorias/charcuteria-y-lacteos.webp',
   18:    'https://media.biomercados.com.ve/media/movil/categorias/licores.webp',
    16:   'https://media.biomercados.com.ve/media/movil/categorias/hogar.webp',
    6:    'https://media.biomercados.com.ve/media/movil/categorias/listos-para-llevar.webp',
    10:   'https://media.biomercados.com.ve/media/movil/categorias/bebidas-y-snacks.webp',
    7:    'https://media.biomercados.com.ve/media/movil/categorias/cuidado-personal.webp',
    19:   'https://media.biomercados.com.ve/media/movil/categorias/juguetes.webp',
    11:   'https://media.biomercados.com.ve/media/movil/categorias/mascotas.webp',
    20:   'https://media.biomercados.com.ve/media/movil/categorias/automotriz.webp',
    21:   'https://media.biomercados.com.ve/media/movil/categorias/bio-saludable.webp'
  }
  return map[categoryId] ?? null;
}