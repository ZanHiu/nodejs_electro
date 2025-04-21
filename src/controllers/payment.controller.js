import crypto from 'crypto';
import querystring from 'qs';
import Order from '../models/Order.js';
import mongoose from 'mongoose';
import moment from 'moment';
import { format } from 'date-fns';
import { OrderStatus, PaymentStatus } from '../utils/constants.js';

const sortObject = (obj) => {
  const sorted = {};
  const str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }
  return sorted;
};

export const createVNPayPayment = async (req, res) => {
  try {
    const { orderId: orderIdFromBody, amount: amountFromBody } = req.body;
    
    const date = new Date();
    const createDate = format(date, 'yyyyMMddHHmmss');
    const ipAddr = req.headers['x-forwarded-for'] || 
      req.connection.remoteAddress || 
      req.socket.remoteAddress;

    const tmnCode = process.env.VNPAY_TMN_CODE;
    const secretKey = process.env.VNPAY_HASH_SECRET;
    const vnpUrl = process.env.VNPAY_URL;
    const returnUrl = `${process.env.CLIENT_URL}/payment/payment-return`;

    // Generate transaction reference
    const txnRef = moment(date).format('DDHHmmss');

    let vnp_Params = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = tmnCode;
    vnp_Params['vnp_Locale'] = 'vn';
    vnp_Params['vnp_CurrCode'] = 'VND';
    vnp_Params['vnp_TxnRef'] = txnRef;
    vnp_Params['vnp_OrderInfo'] = 'Thanh toan cho ma GD:' + orderIdFromBody;
    vnp_Params['vnp_OrderType'] = 'billpayment';
    vnp_Params['vnp_Amount'] = amountFromBody * 100;
    vnp_Params['vnp_ReturnUrl'] = returnUrl;
    vnp_Params['vnp_IpAddr'] = ipAddr;
    vnp_Params['vnp_CreateDate'] = createDate;

    vnp_Params = sortObject(vnp_Params);

    const signData = querystring.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex"); 
    vnp_Params['vnp_SecureHash'] = signed;

    const vnpayUrl = vnpUrl + "?" + querystring.stringify(vnp_Params, { encode: false });
    
    res.json({
      success: true,
      paymentUrl: vnpayUrl
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const vnpayReturn = async (req, res) => {
  try {
    console.log('VNPay return params:', req.query);
    const vnpParams = req.query;
    const secureHash = vnpParams.vnp_SecureHash;

    if (!secureHash) {
      console.error('No secure hash provided');
      return res.redirect(`${process.env.CLIENT_URL}/payment/failed?message=Invalid request`);
    }

    // Remove secure hash fields for signature verification
    delete vnpParams.vnp_SecureHash;
    delete vnpParams.vnp_SecureHashType;

    const secretKey = process.env.VNPAY_HASH_SECRET;
    const signData = querystring.stringify(sortObject(vnpParams), { encode: false });
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    if (secureHash !== signed) {
      console.error('Invalid signature for VNPay callback');
      return res.redirect(`${process.env.CLIENT_URL}/payment/failed?message=Invalid signature`);
    }

    const orderInfo = vnpParams.vnp_OrderInfo;
    const orderId = orderInfo.replace('Thanh toan cho ma GD:', '').trim();
    console.log('Processing order:', orderId);

    const order = await Order.findById(orderId);
    if (!order) {
      console.error('Order not found:', orderId);
      return res.redirect(`${process.env.CLIENT_URL}/payment/failed?message=Order not found`);
    }

    if (vnpParams.vnp_ResponseCode === '00') {
      console.log('Payment successful, updating order status...');
      let session;
      try {
        // Start session
        session = await mongoose.startSession();
        session.startTransaction();

        // Find order and update atomically
        const updatedOrder = await Order.findOneAndUpdate(
          { _id: orderId, paymentStatus: PaymentStatus.PENDING },
          {
            $set: {
              paymentStatus: PaymentStatus.PAID,
              status: OrderStatus.PROCESSING,
              paymentDetails: {
                vnpayTxnRef: vnpParams.vnp_TxnRef,
                vnpayAmount: vnpParams.vnp_Amount / 100,
                vnpayBankCode: vnpParams.vnp_BankCode,
                vnpayPayDate: new Date(),
              }
            }
          },
          { 
            new: true,
            session,
            runValidators: true
          }
        );

        if (!updatedOrder) {
          throw new Error('Order not found or already processed');
        }

        console.log('Order updated successfully:', {
          orderId,
          paymentStatus: updatedOrder.paymentStatus,
          orderStatus: updatedOrder.status,
        });

        // Commit the transaction
        await session.commitTransaction();

        return res.redirect(
          `${process.env.CLIENT_URL}/payment/success?orderId=${orderId}&vnp_ResponseCode=${vnpParams.vnp_ResponseCode}`
        );
      } catch (error) {
        console.error('Error during payment processing:', error);
        if (session) {
          await session.abortTransaction();
        }
        return res.redirect(`${process.env.CLIENT_URL}/payment/failed?message=${error.message}`);
      } finally {
        if (session) {
          await session.endSession();
        }
      }
    } else {
      console.log('Payment failed, updating order status to FAILED...');
      try {
        const failedOrder = await Order.findOneAndUpdate(
          { _id: orderId },
          {
            $set: {
              paymentStatus: PaymentStatus.FAILED,
              status: OrderStatus.CANCELLED
            }
          },
          { new: true, runValidators: true }
        );

        if (!failedOrder) {
          throw new Error('Failed to update order status');
        }

        console.log('Order marked as failed:', {
          orderId,
          paymentStatus: failedOrder.paymentStatus,
          orderStatus: failedOrder.status,
        });

        return res.redirect(`${process.env.CLIENT_URL}/payment/failed?message=Payment failed`);
      } catch (error) {
        console.error('Error updating failed order:', error);
        return res.redirect(`${process.env.CLIENT_URL}/payment/failed?message=${error.message}`);
      }
    }
  } catch (error) {
    console.error('VNPay return error:', error);
    return res.redirect(`${process.env.CLIENT_URL}/payment/failed?message=Server error`);
  }
};
