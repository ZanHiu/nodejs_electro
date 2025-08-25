import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Coupon from '../models/Coupon.js';
import UserCoupon from '../models/UserCoupon.js';
import ProductVariant from '../models/ProductVariant.js';
import UserRank from '../models/UserRank.js';
import { OrderStatus, PaymentStatus } from '../utils/constants.js';
import { RANK_THRESHOLDS } from '../utils/rankConstants.js';
import nodemailer from 'nodemailer';
import mongoose from 'mongoose';

// Tạo transporter cho Gmail
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Gửi email xác nhận đơn hàng
const sendOrderConfirmationEmail = async (userEmail, order, orderItems) => {
  try {
    const transporter = createTransporter();
    
    // Tạo HTML cho danh sách sản phẩm
    const itemsHTML = orderItems.map(item => {
      const itemPrice = item.variant ? item.variant.offerPrice : item.product.offerPrice;
      const itemTotal = itemPrice * item.quantity;
      
      return `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 10px; text-align: left;">
            <strong>${item.product.name}</strong>
            ${item.variant ? `<br><small style="color: #666;">Phiên bản: ${item.variant.attributes ? Object.values(JSON.parse(item.variant.attributes)).join(', ') : 'N/A'}</small>` : ''}
          </td>
          <td style="padding: 10px; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; text-align: right;">${itemPrice.toLocaleString('vi-VN')}đ</td>
          <td style="padding: 10px; text-align: right;"><strong>${itemTotal.toLocaleString('vi-VN')}đ</strong></td>
        </tr>
      `;
    }).join('');
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: `Xác nhận đơn hàng #${order._id.toString().slice(-8).toUpperCase()} - Electro`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9;">
          <div style="background: linear-gradient(135deg, #ff6b35, #f7931e); padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px;">✅ Đơn hàng đã được xác nhận!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Cảm ơn bạn đã mua sắm tại Electro</p>
          </div>
          
          <div style="padding: 30px; background: white;">
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
              <h2 style="color: #333; margin: 0 0 15px 0; font-size: 20px;">📋 Thông tin đơn hàng</h2>
              <p style="margin: 5px 0; color: #666;"><strong>Mã đơn hàng:</strong> #${order._id.toString().slice(-6).toUpperCase()}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Ngày đặt:</strong> ${new Date(order.date).toLocaleString('vi-VN')}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Phương thức thanh toán:</strong> ${order.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng' : 'VNPay'}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Trạng thái:</strong> <span style="color: #ff6b35; font-weight: bold;">${order.status}</span></p>
            </div>
            
            <div style="margin-bottom: 25px;">
              <h3 style="color: #333; margin-bottom: 15px;">📦 Chi tiết sản phẩm</h3>
              <table style="width: 100%; border-collapse: collapse; background: white; border: 1px solid #eee;">
                <thead>
                  <tr style="background: #f8f9fa;">
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #eee;">Sản phẩm</th>
                    <th style="padding: 12px; text-align: center; border-bottom: 2px solid #eee;">SL</th>
                    <th style="padding: 12px; text-align: right; border-bottom: 2px solid #eee;">Đơn giá</th>
                    <th style="padding: 12px; text-align: right; border-bottom: 2px solid #eee;">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHTML}
                </tbody>
              </table>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: #666;">Tạm tính:</span>
                <span style="color: #666;">${(order.amount + (order.coupon ? order.coupon.discountAmount : 0)).toLocaleString('vi-VN')}đ</span>
              </div>
              ${order.coupon ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                  <span style="color: #666;">Giảm giá (${order.coupon.code}):</span>
                  <span style="color: #28a745;">-${order.coupon.discountAmount.toLocaleString('vi-VN')}đ</span>
                </div>
              ` : ''}
              <div style="display: flex; justify-content: space-between; padding-top: 10px; border-top: 2px solid #ddd;">
                <span style="font-size: 18px; font-weight: bold; color: #333;">Tổng cộng:</span>
                <span style="font-size: 18px; font-weight: bold; color: #ff6b35;">${order.amount.toLocaleString('vi-VN')}đ</span>
              </div>
            </div>
            
            <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
              <h3 style="color: #2d5a2d; margin: 0 0 15px 0;">🚚 Địa chỉ giao hàng</h3>
              <p style="margin: 5px 0; color: #666;"><strong>Họ tên:</strong> ${order.address.firstName} ${order.address.lastName}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Số điện thoại:</strong> ${order.address.phone}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Địa chỉ:</strong> ${order.address.street}, ${order.address.city}, ${order.address.state}, ${order.address.country}</p>
              ${order.address.zipcode ? `<p style="margin: 5px 0; color: #666;"><strong>Mã bưu điện:</strong> ${order.address.zipcode}</p>` : ''}
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.CLIENT_URL}/my-orders" 
                 style="background: #ff6b35; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
                Theo dõi đơn hàng
              </a>
            </div>
            
            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                <strong>📞 Hỗ trợ khách hàng:</strong> Nếu bạn có bất kỳ câu hỏi nào về đơn hàng, vui lòng liên hệ với chúng tôi qua email hoặc hotline.
              </p>
            </div>
          </div>
          
          <div style="padding: 20px; background: #333; color: white; text-align: center; font-size: 12px;">
            <p style="margin: 0;">© 2024 Electro. Tất cả quyền được bảo lưu.</p>
            <p style="margin: 5px 0 0 0;">Email này được gửi tự động, vui lòng không trả lời.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Email xác nhận đơn hàng đã gửi đến:', userEmail);
  } catch (error) {
    console.error('Lỗi gửi email xác nhận đơn hàng:', error);
  }
};

// Gửi email hoàn tất đơn hàng
const sendOrderCompletedEmail = async (userEmail, order, orderItems) => {
  try {
    const transporter = createTransporter();
    
    // Tạo HTML cho danh sách sản phẩm
    const itemsHTML = orderItems.map(item => {
      const itemPrice = item.variant ? item.variant.offerPrice : item.product.offerPrice;
      const itemTotal = itemPrice * item.quantity;
      
      return `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 10px; text-align: left;">
            <strong>${item.product.name}</strong>
            ${item.variant ? `<br><small style="color: #666;">Phiên bản: ${item.variant.attributes ? Object.values(JSON.parse(item.variant.attributes)).join(', ') : 'N/A'}</small>` : ''}
          </td>
          <td style="padding: 10px; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; text-align: right;">${itemPrice.toLocaleString('vi-VN')}đ</td>
          <td style="padding: 10px; text-align: right;"><strong>${itemTotal.toLocaleString('vi-VN')}đ</strong></td>
        </tr>
      `;
    }).join('');
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: `Đơn hàng #${order._id.toString().slice(-8).toUpperCase()} đã được giao thành công! - Electro`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9;">
          <div style="background: linear-gradient(135deg, #28a745, #20c997); padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px;">🎉 Đơn hàng đã được giao thành công!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Cảm ơn bạn đã tin tưởng và mua sắm tại Electro</p>
          </div>
          
          <div style="padding: 30px; background: white;">
            <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #28a745;">
              <h2 style="color: #155724; margin: 0 0 15px 0; font-size: 20px;">✅ Giao hàng thành công</h2>
              <p style="margin: 5px 0; color: #155724;"><strong>Mã đơn hàng:</strong> #${order._id.toString().slice(-8).toUpperCase()}</p>
              <p style="margin: 5px 0; color: #155724;"><strong>Ngày giao:</strong> ${new Date().toLocaleString('vi-VN')}</p>
              <p style="margin: 5px 0; color: #155724;"><strong>Trạng thái:</strong> <span style="font-weight: bold;">Đã giao hàng</span></p>
            </div>
            
            <div style="margin-bottom: 25px;">
              <h3 style="color: #333; margin-bottom: 15px;">📦 Chi tiết sản phẩm đã giao</h3>
              <table style="width: 100%; border-collapse: collapse; background: white; border: 1px solid #eee;">
                <thead>
                  <tr style="background: #f8f9fa;">
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #eee;">Sản phẩm</th>
                    <th style="padding: 12px; text-align: center; border-bottom: 2px solid #eee;">SL</th>
                    <th style="padding: 12px; text-align: right; border-bottom: 2px solid #eee;">Đơn giá</th>
                    <th style="padding: 12px; text-align: right; border-bottom: 2px solid #eee;">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHTML}
                </tbody>
              </table>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
              <div style="display: flex; justify-content: space-between; padding-top: 10px; border-top: 2px solid #ddd;">
                <span style="font-size: 18px; font-weight: bold; color: #333;">Tổng giá trị đơn hàng:</span>
                <span style="font-size: 18px; font-weight: bold; color: #28a745;">${order.amount.toLocaleString('vi-VN')}đ</span>
              </div>
            </div>
            
            <div style="background: #e7f3ff; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
              <h3 style="color: #0066cc; margin: 0 0 15px 0;">⭐ Đánh giá sản phẩm</h3>
              <p style="margin: 0; color: #0066cc;">Hãy chia sẻ trải nghiệm của bạn về sản phẩm để giúp khách hàng khác có thêm thông tin tham khảo!</p>
              <div style="text-align: center; margin-top: 15px;">
                <a href="${process.env.CLIENT_URL}/my-orders" 
                   style="background: #0066cc; color: white; padding: 10px 25px; text-decoration: none; border-radius: 20px; display: inline-block; font-weight: bold;">
                  Đánh giá ngay
                </a>
              </div>
            </div>
            
            <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
              <h3 style="color: #856404; margin: 0 0 15px 0;">🎁 Ưu đãi đặc biệt</h3>
              <p style="margin: 0; color: #856404;">Cảm ơn bạn đã mua sắm! Hãy theo dõi email để nhận những ưu đãi hấp dẫn trong tương lai.</p>
              <div style="text-align: center; margin-top: 15px;">
                <a href="${process.env.CLIENT_URL}" 
                   style="background: #ffc107; color: #212529; padding: 10px 25px; text-decoration: none; border-radius: 20px; display: inline-block; font-weight: bold;">
                  Tiếp tục mua sắm
                </a>
              </div>
            </div>
            
            <div style="background: #f8d7da; padding: 15px; border-radius: 8px; border-left: 4px solid #dc3545;">
              <p style="margin: 0; color: #721c24; font-size: 14px;">
                <strong>📞 Hỗ trợ sau bán hàng:</strong> Nếu bạn gặp bất kỳ vấn đề nào với sản phẩm, vui lòng liên hệ với chúng tôi trong vòng 7 ngày để được hỗ trợ đổi trả.
              </p>
            </div>
          </div>
          
          <div style="padding: 20px; background: #333; color: white; text-align: center; font-size: 12px;">
            <p style="margin: 0;">© 2024 Electro. Tất cả quyền được bảo lưu.</p>
            <p style="margin: 5px 0 0 0;">Email này được gửi tự động, vui lòng không trả lời.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Email hoàn tất đơn hàng đã gửi đến:', userEmail);
  } catch (error) {
    console.error('Lỗi gửi email hoàn tất đơn hàng:', error);
  }
};

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

    // Gửi email xác nhận đơn hàng
    try {
      // Populate order với thông tin chi tiết để gửi email
      const populatedOrder = await Order.findById(order._id)
        .populate('address')
        .populate('items.product')
        .populate('items.variant');
      
      await sendOrderConfirmationEmail(user.email, populatedOrder, populatedOrder.items);
    } catch (emailError) {
      console.error('Lỗi gửi email xác nhận đơn hàng:', emailError);
      // Không throw error để không ảnh hưởng đến việc tạo đơn hàng
    }

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

    // Gửi email hoàn tất đơn hàng khi status là DELIVERED
    if (status === OrderStatus.DELIVERED) {
      try {
        // Lấy thông tin user và populate order
        const user = await User.findById(order.userId);
        const populatedOrder = await Order.findById(order._id)
          .populate('address')
          .populate('items.product')
          .populate('items.variant');
        
        if (user && user.email) {
          await sendOrderCompletedEmail(user.email, populatedOrder, populatedOrder.items);
        }
      } catch (emailError) {
        console.error('Lỗi gửi email hoàn tất đơn hàng:', emailError);
        // Không throw error để không ảnh hưởng đến việc cập nhật status
      }
    }

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
