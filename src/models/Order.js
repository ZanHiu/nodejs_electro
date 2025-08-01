import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  userId: { type: String, required: true, ref: "user" },
  items: [{
    product: { type: String, required: true, ref: "product" },
    variant: { type: String, ref: "productVariant" },
    quantity: { type: Number, required: true },
  }],
  amount: { type: Number, required: true },
  address: { type: String, required: true, ref: "address" },
  // status: { type: String, required: true, default: "Order placed" },
  status: {
    type: String,
    required: true,
    enum: [
      "PENDING", 
      "PROCESSING", 
      "DELIVERED", 
      "CANCELLED"
    ],
    default: "PENDING"
  },
  paymentStatus: {
    type: String,
    enum: [
      "PENDING", 
      "PAID", 
      "FAILED", 
      "REFUND_PENDING", 
    ],
    default: 'PENDING'
  },
  paymentMethod: {
    type: String,
    enum: ['COD', 'VNPAY'],
    required: true,
    default: 'COD'
  },
  paymentDetails: {
    vnpayTxnRef: String,
    vnpayAmount: Number,
    vnpayBankCode: String,
    vnpayPayDate: Date
  },
  coupon: { type: Object, default: {} },
  date: { type: Number, required: true },
  // paymentType: { type: String, required: true },
});

export default mongoose.model("order", orderSchema);
