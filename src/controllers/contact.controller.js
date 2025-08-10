import nodemailer from 'nodemailer';
import Contact from '../models/Contact.js';

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

// Gửi email liên hệ đến admin
const sendContactEmailToAdmin = async (contactData) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: `Liên hệ mới: ${contactData.subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ff6b35, #f7931e); padding: 20px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 24px;">📧 Liên hệ mới từ website</h1>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #333; margin-top: 0;">Thông tin người gửi:</h3>
              <p><strong>Họ và tên:</strong> ${contactData.name}</p>
              <p><strong>Email:</strong> ${contactData.email}</p>
              <p><strong>Chủ đề:</strong> ${contactData.subject}</p>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px;">
              <h3 style="color: #333; margin-top: 0;">Nội dung tin nhắn:</h3>
              <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #ff6b35;">
                <p style="margin: 0; line-height: 1.6;">${contactData.message}</p>
              </div>
            </div>
            
            <div style="margin-top: 20px; padding: 15px; background: #e8f5e8; border-radius: 8px;">
              <p style="margin: 0; color: #2d5a2d; font-size: 14px;">
                <strong>Thời gian:</strong> ${new Date().toLocaleString('vi-VN')}
              </p>
            </div>
          </div>
          
          <div style="padding: 15px; background: #333; color: white; text-align: center; font-size: 12px;">
            <p style="margin: 0;">© 2024 Electro. Email được gửi tự động từ hệ thống.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Email liên hệ đã gửi đến admin');
  } catch (error) {
    console.error('Lỗi gửi email liên hệ:', error);
    throw error;
  }
};

// Gửi email xác nhận cho người dùng
const sendConfirmationEmailToUser = async (contactData) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: contactData.email,
      subject: 'Xác nhận đã nhận được liên hệ của bạn - Electro',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ff6b35, #f7931e); padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px;">Cảm ơn bạn đã liên hệ! 🙏</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Chúng tôi đã nhận được tin nhắn của bạn</p>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
              Xin chào <strong>${contactData.name}</strong>,
            </p>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
              Cảm ơn bạn đã liên hệ với Electro. Chúng tôi đã nhận được tin nhắn của bạn với chủ đề "<strong>${contactData.subject}</strong>" và sẽ phản hồi trong thời gian sớm nhất.
            </p>
            
            <div style="background: white; border: 2px solid #ff6b35; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #ff6b35; margin: 0 0 15px 0;">📋 Thông tin liên hệ của bạn:</h3>
              <p style="margin: 5px 0; color: #666;"><strong>Chủ đề:</strong> ${contactData.subject}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Thời gian gửi:</strong> ${new Date().toLocaleString('vi-VN')}</p>
            </div>
            
            <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="color: #2d5a2d; margin: 0 0 10px 0;">⏰ Thời gian phản hồi dự kiến:</h4>
              <p style="color: #666; margin: 0;">Chúng tôi sẽ phản hồi trong vòng 24-48 giờ làm việc.</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.CLIENT_URL}" 
                 style="background: #ff6b35; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
                Quay lại website
              </a>
            </div>
          </div>
          
          <div style="padding: 20px; background: #333; color: white; text-align: center; font-size: 12px;">
            <p style="margin: 0;">© 2024 Electro. Tất cả quyền được bảo lưu.</p>
            <p style="margin: 5px 0 0 0;">Nếu bạn có thắc mắc, vui lòng liên hệ: support@electro.com</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Email xác nhận đã gửi đến:', contactData.email);
  } catch (error) {
    console.error('Lỗi gửi email xác nhận:', error);
    throw error;
  }
};

// Controller chính để xử lý liên hệ
export const submitContact = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    
    // Validate dữ liệu đầu vào
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin'
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

    // Validate độ dài
    if (name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Họ và tên phải có ít nhất 2 ký tự'
      });
    }

    if (subject.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Chủ đề phải có ít nhất 5 ký tự'
      });
    }

    if (message.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Tin nhắn phải có ít nhất 10 ký tự'
      });
    }

    const contactData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      subject: subject.trim(),
      message: message.trim()
    };

    // Lưu vào database
    await Contact.create(contactData);

    // Gửi email đến admin
    await sendContactEmailToAdmin(contactData);
    
    // Gửi email xác nhận cho user
    await sendConfirmationEmailToUser(contactData);

    res.json({
      success: true,
      message: 'Gửi liên hệ thành công! Chúng tôi sẽ phản hồi sớm nhất có thể.'
    });
  } catch (error) {
    console.error('Lỗi gửi liên hệ:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra, vui lòng thử lại sau'
    });
  }
};

// Controller lấy danh sách liên hệ (cho admin)
export const getContacts = async (req, res) => {
  try {
    const { page = 1, limit = 10, isRead } = req.query;
    
    const filter = {};
    if (isRead !== undefined) {
      filter.isRead = isRead === 'true';
    }

    const contacts = await Contact.find(filter)
      .sort({ submittedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Contact.countDocuments(filter);

    res.json({
      success: true,
      data: contacts,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách liên hệ:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra, vui lòng thử lại sau'
    });
  }
};

// Controller đánh dấu đã đọc
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    await Contact.findByIdAndUpdate(id, { isRead: true });

    res.json({
      success: true,
      message: 'Đã đánh dấu là đã đọc'
    });
  } catch (error) {
    console.error('Lỗi đánh dấu đã đọc:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra, vui lòng thử lại sau'
    });
  }
};