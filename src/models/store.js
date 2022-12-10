import mongoose from "mongoose";

const storeSchema = new mongoose.Schema({
  store_id: Number,
  storeViews: Array
});
export default mongoose.model('Store', storeSchema);