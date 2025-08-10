import nodemailer from 'nodemailer';
import Newsletter from '../models/Newsletter.js';
import Contact from '../models/Contact.js';

// Tạo transporter cho Gmail (có thể thay đổi cho dịch vụ khác)
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // email của bạn
      pass: process.env.EMAIL_PASSWORD // app password từ Gmail
    }
  });
};

// Gửi email đến admin khi có user đăng ký
const sendNotificationToAdmin = async (userEmail) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // email của bạn
      subject: 'Có người đăng ký newsletter mới!',
      html: `
        <h2>Thông báo đăng ký newsletter</h2>
        <p>Có người dùng mới đăng ký nhận thông tin từ website:</p>
        <p><strong>Email:</strong> ${userEmail}</p>
        <p><strong>Thời gian:</strong> ${new Date().toLocaleString('vi-VN')}</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Email thông báo đã gửi đến admin');
  } catch (error) {
    console.error('Lỗi gửi email thông báo:', error);
  }
};

// Gửi email chào mừng với mã giảm giá cho user
const sendWelcomeEmail = async (userEmail) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: 'Chào mừng bạn đến với Electro! 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ff6b35, #f7931e); padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px;">Chào mừng bạn!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Cảm ơn bạn đã đăng ký nhận thông tin từ Electro</p>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #333; margin-bottom: 20px;">🎁 Quà tặng đặc biệt dành cho bạn!</h2>
            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
              Để chào mừng bạn đến với Electro, chúng tôi tặng bạn mã giảm giá đặc biệt:
            </p>
            
            <div style="background: white; border: 2px dashed #ff6b35; padding: 20px; text-align: center; margin: 20px 0;">
              <h3 style="color: #ff6b35; margin: 0 0 10px 0; font-size: 24px;">WELCOME5086</h3>
              <p style="color: #666; margin: 0; font-size: 14px;">Giảm 20% cho đơn hàng đầu tiên</p>
            </div>
            
            <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="color: #2d5a2d; margin: 0 0 10px 0;">📋 Hướng dẫn sử dụng:</h4>
              <ul style="color: #666; margin: 0; padding-left: 20px;">
                <li>Mã có hiệu lực ngay lập tức</li>
                <li>Áp dụng cho đơn hàng đầu tiên</li>
                <li>Không giới hạn giá trị đơn hàng</li>
                <li>Một lần sử dụng duy nhất</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.CLIENT_URL}" 
                 style="background: #ff6b35; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
                Mua sắm ngay
              </a>
            </div>
          </div>
          
          <div style="padding: 20px; background: #333; color: white; text-align: center; font-size: 12px;">
            <p style="margin: 0;">© 2024 Electro. Tất cả quyền được bảo lưu.</p>
            <p style="margin: 5px 0 0 0;">Nếu bạn không muốn nhận email này, vui lòng <a href="#" style="color: #ff6b35;">hủy đăng ký</a></p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Email chào mừng đã gửi đến:', userEmail);
  } catch (error) {
    console.error('Lỗi gửi email chào mừng:', error);
    throw error;
  }
};

// Controller chính để xử lý đăng ký newsletter
export const subscribeNewsletter = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email là bắt buộc'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email không hợp lệ'
      });
    }

    // Kiểm tra email đã đăng ký chưa
    const existingSubscription = await Newsletter.findOne({ 
      email: email.toLowerCase() 
    });

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: 'Email này đã được đăng ký trước đó'
      });
    }

    // Lưu email vào database
    await Newsletter.create({
      email: email.toLowerCase()
    });

    // Gửi email thông báo đến admin
    await sendNotificationToAdmin(email);
    
    // Gửi email chào mừng với mã giảm giá cho user
    await sendWelcomeEmail(email);

    res.json({
      success: true,
      message: 'Đăng ký thành công! Vui lòng kiểm tra email của bạn.'
    });
  } catch (error) {
    console.error('Lỗi đăng ký newsletter:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra, vui lòng thử lại sau'
    });
  }
};

// Controller kiểm tra email đã đăng ký chưa
export const checkNewsletterSubscription = async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email là bắt buộc'
      });
    }

    const subscription = await Newsletter.findOne({ 
      email: email.toLowerCase() 
    });

    res.json({
      success: true,
      isSubscribed: !!subscription
    });
  } catch (error) {
    console.error('Lỗi kiểm tra subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra, vui lòng thử lại sau'
    });
  }
};
