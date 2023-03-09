import mongoose from "mongoose";

const storeSchema = new mongoose.Schema({
  store_id: Number,
  name: String,
  phone: String,
  address: String,
  storeViews: Array
});
export default mongoose.model('Store', storeSchema);