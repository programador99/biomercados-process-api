import mongoose from "mongoose";

const temporalProductSchema = new mongoose.Schema({
  id: Number,
  name: String,
  sku: String,
  price: Number,
  status: Number,
  visibility: Number,
  weight: Number,
  extension_attributes: Object,
  product_links: Array,
  media_gallery_entries: Array,
  custom_attributes: Array
});
module.exports = mongoose.model('TemporalProduct', temporalProductSchema);