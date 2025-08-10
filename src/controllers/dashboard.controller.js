import ExcelJS from 'exceljs';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import { OrderStatus, PaymentStatus } from '../utils/constants.js';
import { clerkClient } from '@clerk/clerk-sdk-node';

// Lấy thống kê tổng quan
export const getDashboardStats = async (req, res) => {
  try {
    // Tổng doanh thu (chỉ tính đơn hàng đã giao và đã thanh toán)
    const totalRevenueResult = await Order.aggregate([
      {
        $match: {
          status: OrderStatus.DELIVERED,
          paymentStatus: PaymentStatus.PAID
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" }
        }
      }
    ]);
    const totalRevenue = totalRevenueResult[0]?.totalRevenue || 0;

    // Tổng số đơn hàng
    const totalOrders = await Order.countDocuments();

    // Tổng số sản phẩm
    const totalProducts = await Product.countDocuments({ isActive: true });

    // Tổng số khách hàng
    const clerkUsers = await clerkClient.users.getUserList();
    const totalCustomers = clerkUsers.data.length;

    res.json({
      success: true,
      stats: {
        totalRevenue,
        totalOrders,
        totalProducts,
        totalCustomers
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Lấy dữ liệu doanh thu theo tháng
export const getMonthlySalesData = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const monthlyData = await Order.aggregate([
      {
        $match: {
          status: OrderStatus.DELIVERED,
          paymentStatus: PaymentStatus.PAID,
          date: {
            $gte: new Date(currentYear, 0, 1).getTime(),
            $lte: new Date(currentYear, 11, 31).getTime()
          }
        }
      },
      {
        $group: {
          _id: {
            month: { $month: { $toDate: "$date" } }
          },
          revenue: { $sum: "$amount" },
          orderCount: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.month": 1 }
      }
    ]);

    // Tạo mảng 12 tháng với dữ liệu mặc định
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const salesData = months.map((month, index) => {
      const monthData = monthlyData.find(item => item._id.month === index + 1);
      return {
        month,
        revenue: monthData?.revenue || 0,
        orderCount: monthData?.orderCount || 0
      };
    });

    res.json({ success: true, salesData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Lấy thống kê trạng thái đơn hàng
export const getOrderStatusStats = async (req, res) => {
  try {
    const statusStats = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    const statusData = {
      processing: 0,
      delivered: 0,
      cancelled: 0,
      pending: 0
    };

    statusStats.forEach(stat => {
      switch(stat._id) {
        case OrderStatus.PROCESSING:
          statusData.processing = stat.count;
          break;
        case OrderStatus.DELIVERED:
          statusData.delivered = stat.count;
          break;
        case OrderStatus.CANCELLED:
          statusData.cancelled = stat.count;
          break;
        case OrderStatus.PENDING:
          statusData.pending = stat.count;
          break;
      }
    });

    res.json({ success: true, statusData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Lấy thống kê sản phẩm theo danh mục
export const getProductCategoryStats = async (req, res) => {
  try {
    const categoryStats = await Product.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      {
        $unwind: '$categoryInfo'
      },
      {
        $group: {
          _id: '$categoryInfo.name',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json({ success: true, categoryStats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Lấy đơn hàng gần đây
export const getRecentOrders = async (req, res) => {
  try {
    const recentOrders = await Order.find()
      .populate('address')
      .populate('items.product')
      .sort({ date: -1 })
      .limit(10);

    // Lấy thông tin user từ Clerk
    const ordersWithUserInfo = await Promise.all(
      recentOrders.map(async (order) => {
        try {
          const clerkUser = await clerkClient.users.getUser(order.userId);
          return {
            _id: order._id,
            customer: `${clerkUser.firstName} ${clerkUser.lastName}`,
            date: new Date(order.date).toLocaleDateString('vi-VN'),
            status: order.status,
            amount: order.amount,
            paymentMethod: order.paymentMethod
          };
        } catch (error) {
          return {
            _id: order._id,
            customer: 'Unknown User',
            date: new Date(order.date).toLocaleDateString('vi-VN'),
            status: order.status,
            amount: order.amount,
            paymentMethod: order.paymentMethod
          };
        }
      })
    );

    res.json({ success: true, recentOrders: ordersWithUserInfo });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Xuất báo cáo Excel
export const exportDashboardExcel = async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Electro Dashboard';
    workbook.lastModifiedBy = 'System';
    workbook.created = new Date();
    workbook.modified = new Date();

    // 1. Sheet Tổng quan
    const overviewSheet = workbook.addWorksheet('Tổng quan', {
      pageSetup: { paperSize: 9, orientation: 'landscape' }
    });

    // Header cho sheet tổng quan
    overviewSheet.mergeCells('A1:D1');
    overviewSheet.getCell('A1').value = 'BÁO CÁO TỔNG QUAN DASHBOARD';
    overviewSheet.getCell('A1').font = { size: 16, bold: true };
    overviewSheet.getCell('A1').alignment = { horizontal: 'center' };

    overviewSheet.getCell('A2').value = `Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`;
    overviewSheet.getCell('A2').font = { italic: true };

    // Lấy dữ liệu thống kê
    const totalRevenueResult = await Order.aggregate([
      {
        $match: {
          status: OrderStatus.DELIVERED,
          paymentStatus: PaymentStatus.PAID
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" }
        }
      }
    ]);
    const totalRevenue = totalRevenueResult[0]?.totalRevenue || 0;
    const totalOrders = await Order.countDocuments();
    const totalProducts = await Product.countDocuments({ isActive: true });
    const clerkUsers = await clerkClient.users.getUserList();
    const totalCustomers = clerkUsers.data.length;

    // Thêm dữ liệu thống kê
    overviewSheet.addRow(['Chỉ số', 'Giá trị']);
    overviewSheet.addRow(['Tổng doanh thu', `${totalRevenue.toLocaleString('vi-VN')} VNĐ`]);
    overviewSheet.addRow(['Tổng đơn hàng', totalOrders]);
    overviewSheet.addRow(['Tổng sản phẩm', totalProducts]);
    overviewSheet.addRow(['Tổng khách hàng', totalCustomers]);

    // Định dạng header
    overviewSheet.getRow(4).font = { bold: true };
    overviewSheet.getRow(4).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6E6FA' }
    };

    // 2. Sheet Doanh thu theo tháng
    const salesSheet = workbook.addWorksheet('Doanh thu theo tháng');
    
    salesSheet.mergeCells('A1:C1');
    salesSheet.getCell('A1').value = 'DOANH THU THEO THÁNG';
    salesSheet.getCell('A1').font = { size: 14, bold: true };
    salesSheet.getCell('A1').alignment = { horizontal: 'center' };

    const currentYear = new Date().getFullYear();
    const monthlyData = await Order.aggregate([
      {
        $match: {
          status: OrderStatus.DELIVERED,
          paymentStatus: PaymentStatus.PAID,
          date: {
            $gte: new Date(currentYear, 0, 1).getTime(),
            $lte: new Date(currentYear, 11, 31).getTime()
          }
        }
      },
      {
        $group: {
          _id: {
            month: { $month: { $toDate: "$date" } }
          },
          revenue: { $sum: "$amount" },
          orderCount: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.month": 1 }
      }
    ]);

    const months = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 
                   'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
    
    salesSheet.addRow(['Tháng', 'Doanh thu (VNĐ)', 'Số đơn hàng']);
    salesSheet.getRow(3).font = { bold: true };
    salesSheet.getRow(3).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6E6FA' }
    };

    months.forEach((month, index) => {
      const monthData = monthlyData.find(item => item._id.month === index + 1);
      salesSheet.addRow([
        month,
        monthData?.revenue || 0,
        monthData?.orderCount || 0
      ]);
    });

    // 3. Sheet Đơn hàng chi tiết
    const ordersSheet = workbook.addWorksheet('Đơn hàng chi tiết');
    
    ordersSheet.mergeCells('A1:F1');
    ordersSheet.getCell('A1').value = 'DANH SÁCH ĐƠN HÀNG CHI TIẾT';
    ordersSheet.getCell('A1').font = { size: 14, bold: true };
    ordersSheet.getCell('A1').alignment = { horizontal: 'center' };

    const allOrders = await Order.find()
      .populate('address')
      .populate('items.product')
      .sort({ date: -1 })
      .limit(100); // Giới hạn 100 đơn hàng gần nhất

    ordersSheet.addRow(['Mã đơn hàng', 'Khách hàng', 'Ngày đặt', 'Trạng thái', 'Số tiền (VNĐ)', 'Phương thức thanh toán']);
    ordersSheet.getRow(3).font = { bold: true };
    ordersSheet.getRow(3).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6E6FA' }
    };

    for (const order of allOrders) {
      let customerName = 'Unknown User';
      try {
        const clerkUser = await clerkClient.users.getUser(order.userId);
        customerName = `${clerkUser.firstName} ${clerkUser.lastName}`;
      } catch (error) {
        // Giữ tên mặc định
      }

      const statusText = {
        'PENDING': 'Chờ xử lý',
        'PROCESSING': 'Đang xử lý',
        'DELIVERED': 'Đã giao',
        'CANCELLED': 'Đã hủy'
      }[order.status] || order.status;

      const paymentText = {
        'COD': 'Thanh toán khi nhận hàng',
        'VNPAY': 'VNPay'
      }[order.paymentMethod] || order.paymentMethod;

      ordersSheet.addRow([
        order._id.toString().slice(-8),
        customerName,
        new Date(order.date).toLocaleDateString('vi-VN'),
        statusText,
        order.amount,
        paymentText
      ]);
    }

    // 4. Sheet Sản phẩm theo danh mục
    const categorySheet = workbook.addWorksheet('Sản phẩm theo danh mục');
    
    categorySheet.mergeCells('A1:B1');
    categorySheet.getCell('A1').value = 'THỐNG KÊ SẢN PHẨM THEO DANH MỤC';
    categorySheet.getCell('A1').font = { size: 14, bold: true };
    categorySheet.getCell('A1').alignment = { horizontal: 'center' };

    const categoryStats = await Product.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      {
        $unwind: '$categoryInfo'
      },
      {
        $group: {
          _id: '$categoryInfo.name',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    categorySheet.addRow(['Danh mục', 'Số lượng sản phẩm']);
    categorySheet.getRow(3).font = { bold: true };
    categorySheet.getRow(3).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6E6FA' }
    };

    categoryStats.forEach(stat => {
      categorySheet.addRow([stat._id, stat.count]);
    });

    // 5. Sheet Trạng thái đơn hàng
    const statusSheet = workbook.addWorksheet('Trạng thái đơn hàng');
    
    statusSheet.mergeCells('A1:B1');
    statusSheet.getCell('A1').value = 'THỐNG KÊ TRẠNG THÁI ĐƠN HÀNG';
    statusSheet.getCell('A1').font = { size: 14, bold: true };
    statusSheet.getCell('A1').alignment = { horizontal: 'center' };

    const statusStats = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    statusSheet.addRow(['Trạng thái', 'Số lượng']);
    statusSheet.getRow(3).font = { bold: true };
    statusSheet.getRow(3).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6E6FA' }
    };

    statusStats.forEach(stat => {
      const statusText = {
        'PENDING': 'Chờ xử lý',
        'PROCESSING': 'Đang xử lý',
        'DELIVERED': 'Đã giao',
        'CANCELLED': 'Đã hủy'
      }[stat._id] || stat._id;
      
      statusSheet.addRow([statusText, stat.count]);
    });

    // Tự động điều chỉnh độ rộng cột cho tất cả sheets
    [overviewSheet, salesSheet, ordersSheet, categorySheet, statusSheet].forEach(sheet => {
      sheet.columns.forEach(column => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, (cell) => {
          const columnLength = cell.value ? cell.value.toString().length : 10;
          if (columnLength > maxLength) {
            maxLength = columnLength;
          }
        });
        column.width = maxLength < 10 ? 10 : maxLength + 2;
      });
    });

    // Thiết lập response headers
    const fileName = `Dashboard_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    // Gửi file
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Error exporting Excel:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};