import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Coupon from '../models/Coupon.js';
import UserCoupon from '../models/UserCoupon.js';
import ProductVariant from '../models/ProductVariant.js';
import UserRank from '../models/UserRank.js';
import { OrderStatus, PaymentStatus } from '../utils/constants.js';
import { RANK_THRESHOLDS } from '../utils/rankConstants.js';
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
              // Kiểm tra user đã sử dụng coupon này chưa
              const existingUserCoupon = await UserCoupon.findOne({
                userId: req.user.id,
                couponId: coupon._id
              });

              // Nếu đã có record với status USED thì không cho dùng lại
              if (existingUserCoupon && existingUserCoupon.status === 'USED') {
                return res.status(400).json({
                  success: false,
                  message: "Bạn đã sử dụng mã giảm giá này trước đó"
                });
              }

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

              // Cập nhật UserCoupon có sẵn hoặc tạo mới nếu chưa có
              if (existingUserCoupon) {
                // Cập nhật record có sẵn
                existingUserCoupon.status = 'USED';
                existingUserCoupon.usedAt = new Date();
                await existingUserCoupon.save();
              } else {
                // Tạo mới nếu chưa có record nào
                await UserCoupon.create({
                  userId: req.user.id,
                  couponId: coupon._id,
                  status: 'USED',
                  usedAt: new Date()
                });
              }
            } else {
              return res.status(400).json({
                success: false,
                message: `Đơn hàng phải có giá trị tối thiểu ${coupon.minOrderAmount.toLocaleString()}đ`
              });
            }
          } else {
            return res.status(400).json({
              success: false,
              message: "Mã giảm giá đã hết lượt sử dụng"
            });
          }
        } else {
          return res.status(400).json({
            success: false,
            message: "Mã giảm giá đã hết hạn"
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          message: "Mã giảm giá không tồn tại hoặc đã bị vô hiệu hóa"
        });
      }
    }

    const order = await Order.create({
      userId: req.user.id,
      address,
      items: validItems,
      amount: totalAmount,
      date: Date.now(),
      paymentMethod,
      status: paymentMethod === 'VNPAY' ? OrderStatus.PENDING : OrderStatus.PENDING,
      paymentStatus: paymentMethod === 'VNPAY' ? PaymentStatus.PENDING : PaymentStatus.PENDING,
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
      .populate('items.product');
    
    // Xử lý variants với đầy đủ thông tin EAV cho từng order
    const ordersWithProcessedVariants = await Promise.all(orders.map(async (order) => {
      const orderObj = order.toObject();
      
      // Xử lý từng item trong order
      const processedItems = await Promise.all(orderObj.items.map(async (item) => {
        if (item.variant) {
          // Lấy variant với đầy đủ thông tin EAV
          const variant = await ProductVariant.findById(item.variant)
            .populate('attributeIds')
            .populate('imageId');
          
          if (variant) {
            const variantObj = variant.toObject();
            
            // Xử lý attributes từ mảng attributeIds
            let attributes = {};
            if (variantObj.attributeIds && variantObj.attributeIds.length > 0) {
              variantObj.attributeIds.forEach(attr => {
                if (attr && attr.name && attr.value) {
                  attributes[attr.name] = attr.value;
                }
              });
            }
            
            // Lấy images và colorName từ imageId (ProductImage)
            let images = [];
            let colorName = '';
            if (variantObj.imageId) {
              if (variantObj.imageId.value) {
                images = Array.isArray(variantObj.imageId.value) ? variantObj.imageId.value : [variantObj.imageId.value];
              }
              if (variantObj.imageId.name) {
                colorName = variantObj.imageId.name;
              }
            }
            
            return {
              ...item,
              variant: {
                _id: variantObj._id,
                price: variantObj.price,
                offerPrice: variantObj.offerPrice,
                attributes,
                images,
                colorName,
                createdAt: variantObj.createdAt
              }
            };
          }
        }
        return item;
      }));
      
      return {
        ...orderObj,
        items: processedItems
      };
    }));
    
    res.json({ success: true, orders: ordersWithProcessedVariants });
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

    // Nếu đơn hàng được giao thành công, cập nhật rank của user
    if (status === OrderStatus.DELIVERED && order.paymentStatus === PaymentStatus.PAID) {
      try {
        // Tính tổng chi tiêu mới
        const deliveredOrders = await Order.find({
          userId: order.userId,
          status: OrderStatus.DELIVERED,
          paymentStatus: PaymentStatus.PAID
        });
        
        const totalSpent = deliveredOrders.reduce((total, ord) => total + ord.amount, 0);
        
        // Xác định rank mới
        const newRank = Object.keys(RANK_THRESHOLDS).reverse().find(rank => 
          totalSpent >= RANK_THRESHOLDS[rank]
        ) || 'IRON';
        
        // Cập nhật hoặc tạo UserRank
        let userRank = await UserRank.findOne({ userId: order.userId });
        if (!userRank) {
          userRank = new UserRank({
            userId: order.userId,
            currentRank: newRank,
            totalSpent
          });
        } else {
          const oldRank = userRank.currentRank;
          userRank.currentRank = newRank;
          userRank.totalSpent = totalSpent;
          
          // Nếu rank được nâng lên, cập nhật thời gian và tăng spin count
          if (newRank !== oldRank && RANK_THRESHOLDS[newRank] > RANK_THRESHOLDS[oldRank]) {
            userRank.lastRankUpgrade = new Date();
            
            // Tăng spin count cho PLATINUM và DIAMOND
            if (newRank === 'PLATINUM' || newRank === 'DIAMOND') {
              userRank.spinCount += 1;
            }
          }
        }
        
        await userRank.save();
      } catch (error) {
        console.error('Error updating user rank:', error);
      }
    }

    res.json({
      success: true,
      message: 'Cập nhật trạng thái đơn hàng thành công'
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
      message: 'Hủy đơn hàng thành công'
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
