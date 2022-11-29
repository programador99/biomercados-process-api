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
  const url = "rest/V1/categories?fields=";
  let categories = (await httpGet(url)).children_data

  categories = await recursiveExtractChildrenData(categories);

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
        )[0]?.value.slice(1).replace('.jpeg' || '.png', '.webp') : '';

      temp.push({
        id: child.id,
        parent_id: child.parent_id,
        name: child.name,
        is_active: child.is_active,
        isParent: child.parent_id === 2 ? true : false,
        image,
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