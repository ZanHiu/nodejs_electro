import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { OrderStatus, PaymentStatus } from '../utils/constants.js';
import mongoose from 'mongoose';

export const createOrder = async (req, res) => {
  try {
    const { address, items, paymentMethod } = req.body;

    if (!address || items.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid data" });
    }

    let amount = 0;
    let validItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({ success: false, message: `Product not found: ${item.product}` });
      }
      amount += product.offerPrice * item.quantity;
      validItems.push(item);
    }

    if (validItems.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "No valid products found in cart" 
      });
    }

    const totalAmount = amount + Math.floor(amount * 0.02);

    const order = await Order.create({
      userId: req.user.id,
      address,
      items: validItems,
      amount: totalAmount,
      date: Date.now(),
      paymentMethod,
      status: paymentMethod === 'VNPAY' ? OrderStatus.PENDING : OrderStatus.PROCESSING,
      paymentStatus: paymentMethod === 'VNPAY' ? PaymentStatus.PENDING : PaymentStatus.PENDING,
      // paymentType: "COD"
    });

    const user = await User.findById(req.user.id);
    user.cartItems = {};
    await user.save();

    res.json({ success: true, message: "Order placed", order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id })
      .populate('address items.product');
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSellerOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).populate('address items.product');
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrderDetail = async (req, res) => {
  try {
    const { id } = req.params;
    
    const order = await Order.findById(id)
      .populate('items.product')
      .populate('address');
      
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Error getting order detail:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { 
      orderId, 
      transactionNo, 
      payDate, 
      bankCode, 
      amount, 
      responseCode 
    } = req.body;

    if (!orderId || !responseCode) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin thanh toán'
      });
    }

    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Find and update order atomically
      const order = await Order.findOneAndUpdate(
        { 
          _id: orderId,
          paymentStatus: PaymentStatus.PENDING // Only update if still pending
        },
        {
          $set: {
            paymentStatus: responseCode === '00' ? PaymentStatus.PAID : PaymentStatus.FAILED,
            status: responseCode === '00' ? OrderStatus.PROCESSING : OrderStatus.CANCELLED,
            paymentDetails: {
              vnpayTxnRef: transactionNo,
              vnpayAmount: amount ? Number(amount) / 100 : 0,
              vnpayBankCode: bankCode,
              vnpayPayDate: payDate ? new Date(Number(payDate)) : new Date()
            }
          }
        },
        { 
          new: true,
          session,
          runValidators: true
        }
      );

      if (!order) {
        throw new Error('Không tìm thấy đơn hàng hoặc đơn hàng đã được xử lý');
      }

      await session.commitTransaction();

      res.json({
        success: true,
        message: responseCode === '00' ? 'Thanh toán thành công' : 'Thanh toán thất bại',
        order
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi xử lý thanh toán'
    });
  }
};
