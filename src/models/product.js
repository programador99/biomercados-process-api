import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  id: Number,
  name: String,
  sku: String,
  status: Number,
  visibility: Number,
  weight: Number,
  stores: Array,
  categories: Array,
  image: String,
  sponsored: Boolean,
  brand: Object,
  origin: Object,
  packing: Object,
  tax: Number,
  isAgeRestricted: Boolean,
});
export default mongoose.model('Product', productSchema);