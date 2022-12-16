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
    3:    '/assets/images/fruits.png',
    5:    '/assets/images/carnes.png',
    4:    '/assets/images/granos.png',
  993:    '/assets/images/panes.png',
    9:    '/assets/images/charcuteria.png',
   18:    '/assets/images/licores.png',
    16:   '/assets/images/house.png',
    6:    '/assets/images/helado.png',
    10:   '/assets/images/snacks.png',
    7:    '/assets/images/jabon.png',
    19:   '/assets/images/juguetes.png',
    11:   '/assets/images/mascotas.png',
    20:   '/assets/images/automotriz.png',
    21:   '/assets/images/bio-saludable.png'
  }
  return map[categoryId] ?? null;
}