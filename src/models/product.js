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
  expirationpush: String,
  tax: Number,
  isAgeRestricted: Boolean,
  description: Object,
});
export default mongoose.model('Product', productSchema);