import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Coupon from '../models/Coupon.js';
import ProductVariant from '../models/ProductVariant.js';
import { OrderStatus, PaymentStatus } from '../utils/constants.js';
import mongoose from 'mongoose';

export const createOrder = async (req, res) => {
  try {
    const { address, items, paymentMethod, couponCode } = req.body;

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
      let price = 0;
      if (item.variant) {
        const variant = await ProductVariant.findById(item.variant);
        if (!variant) {
          return res.status(400).json({ success: false, message: `Variant not found: ${item.variant}` });
        }
        price = variant.offerPrice;
      } else {
        price = product.offerPrice;
      }
      if (typeof price !== 'number' || isNaN(price)) {
        return res.status(400).json({ success: false, message: `Invalid price for product/variant` });
      }
      amount += price * item.quantity;
      validItems.push(item);
    }

    if (validItems.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "No valid products found in cart" 
      });
    }

    let totalAmount = amount;
    let couponDiscount = 0;
    let couponDetails = null;

    // Validate and apply coupon if provided
    if (couponCode) {
      const coupon = await Coupon.findOne({ 
        code: couponCode.toUpperCase(),
        isActive: true
      });

      if (coupon) {
        const now = new Date();
        if (now >= new Date(coupon.startDate) && now <= new Date(coupon.endDate)) {
          if (coupon.usedCount < coupon.maxUses) {
            if (amount >= coupon.minOrderAmount) {
              if (coupon.type === 'PERCENTAGE') {
                couponDiscount = Math.floor((amount * coupon.value) / 100);
              } else {
                couponDiscount = coupon.value;
              }
              totalAmount -= couponDiscount;
              couponDetails = {
                code: coupon.code,
                type: coupon.type,
                value: coupon.value,
                discountAmount: couponDiscount
              };

              // Increment coupon usage
              coupon.usedCount += 1;
              await coupon.save();
            }
          }
        }
      }
    }

    const order = await Order.create({
      userId: req.user.id,
      address,
      items: validItems,
      amount: totalAmount,
      date: Date.now(),
      paymentMethod,
      status: paymentMethod === 'VNPAY' ? OrderStatus.PENDING : OrderStatus.PROCESSING,
      paymentStatus: paymentMethod === 'VNPAY' ? PaymentStatus.PROCESSING : PaymentStatus.PROCESSING,
      coupon: couponDetails
    });

    const user = await User.findById(req.user.id);
    user.cartItems = {};
    await user.save();

    res.json({ 
      success: true, 
      message: "Order placed", 
      order,
      discount: couponDiscount
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id })
      .populate('address')
      .populate('items.product')
      .populate('items.variant');
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPendingOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id, status: OrderStatus.PENDING })
      .populate('address')
      .populate('items.product')
      .populate('items.variant');
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProcessingOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id, status: OrderStatus.PROCESSING })
      .populate('address')
      .populate('items.product')
      .populate('items.variant');
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDeliveredOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id, status: OrderStatus.DELIVERED })
      .populate('address')
      .populate('items.product')
      .populate('items.variant');
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export const getCancelledOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id, status: OrderStatus.CANCELLED })
      .populate('address')
      .populate('items.product')
      .populate('items.variant');
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export const getSellerOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('address')
      .populate('items.product')
      .populate('items.variant');
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
      .populate('items.variant')
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

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Đối với COD method
    // Nếu order status là DELIVERED set payment status là PAID
    if (status === OrderStatus.DELIVERED && order.paymentMethod === 'COD') {
      order.paymentStatus = PaymentStatus.PAID;
    }

    // Nếu order status là CANCELLED set payment status là FAILED
    if (status === OrderStatus.CANCELLED && order.paymentMethod === 'COD') {
      order.paymentStatus = PaymentStatus.FAILED;
    }

    // Đối với VNPAY method
    // Nếu order status là CANCELLED và payment status là PENDING, set payment status là FAILED
    if (status === OrderStatus.CANCELLED && order.paymentMethod === 'VNPAY' && order.paymentStatus === PaymentStatus.PENDING) {
      order.paymentStatus = PaymentStatus.FAILED;
    }

    // Nếu order status là CANCELLED và payment status là PAID, set payment status là REFUND_PENDING
    if (status === OrderStatus.CANCELLED && order.paymentMethod === 'VNPAY' && order.paymentStatus === PaymentStatus.PAID) {
      order.paymentStatus = PaymentStatus.REFUND_PENDING;
    }

    order.status = status;
    await order.save();

    res.json({
      success: true,
      message: 'Order status updated successfully'
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order belongs to the user
    if (order.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order'
      });
    }

    // Check if order can be cancelled
    if (order.status === OrderStatus.DELIVERED || 
        order.status === OrderStatus.CANCELLED) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled'
      });
    }

    // Update order status to cancelled
    order.status = OrderStatus.CANCELLED;
    
    // Update payment status based on payment method
    if (order.paymentMethod === 'COD') {
      order.paymentStatus = PaymentStatus.FAILED;
    } else if (order.paymentMethod === 'VNPAY') {
      order.paymentStatus = order.paymentStatus === PaymentStatus.PAID 
        ? PaymentStatus.REFUND_PENDING 
        : PaymentStatus.FAILED;
    }

    await order.save();

    res.json({
      success: true,
      message: 'Order cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
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

export const checkPurchaseStatus = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    const hasPurchased = await Order.exists({
      userId: userId,
      'items.product': productId,
      status: OrderStatus.DELIVERED,
      paymentStatus: PaymentStatus.PAID
    });

    res.json({ success: true, hasPurchased: !!hasPurchased });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
