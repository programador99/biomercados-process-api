import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  currency: String,
  subTotal: Number,
  tax: Number,
  total: Number,
  totalItemsQuantity: Number,
  customerName: String,
  createdAt: String,
  email: String,
  identification: String,
  shippingAmount: Number,
  shippingDescription: String,
  status: String,
  storeId: Number,
  weight: Number,
  discount: Number,
  coupon: String,
  products: Array
}) 

module.exports = mongoose.model('Order', orderSchema);


/**
 * currency: order_currency_code,
 * subTotal: subtotal,
 * tax : tax_amount,
 * total : grand_total,
 * customerName : customer_firstname + customer_lastname,
 * createAt : created_at,
 * email : customer_email,
 * identification : customer_taxvat,
 * discount : discount_amount, 
 * coupon : coupon_code,
 * shippingAmount : shipping_amount,
 * shippingDescription : shipping_description
 * status: status,
 * storeId: store_id,
 * weight: weight,
 * totalItemsQuantity : total_item_count
 * products:[{
 *  sku: sku,
 *  id: product_id,
 *  name: name,
 *  price: price,
 *  taxPercent: tax_percent,
 *  quantity: qty_ordered,
 *  weight: weight
 * }]
 */