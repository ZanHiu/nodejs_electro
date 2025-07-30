import Product from '../models/Product.js';
import ProductVariant from '../models/ProductVariant.js';

export const getHomeProducts = async (req, res) => {
  try {
    // Get sale products - tìm sản phẩm có variants với offerPrice < price
    const saleProductsRaw = await Product.find({ isActive: true })
      .populate('category')
      .populate('brand');

    // Lọc sản phẩm có giảm giá và tính phần trăm giảm
    const productsWithDiscount = [];
    for (const product of saleProductsRaw) {
      const variants = await ProductVariant.find({ productId: product._id });
      
      // Tìm variant có giảm giá cao nhất
      let maxDiscountPercent = 0;
      let bestVariant = null;
      
      for (const variant of variants) {
        if (variant.offerPrice < variant.price) {
          const discountPercent = ((variant.price - variant.offerPrice) / variant.price) * 100;
          if (discountPercent > maxDiscountPercent) {
            maxDiscountPercent = discountPercent;
            bestVariant = variant;
          }
        }
      }
      
      if (bestVariant) {
        productsWithDiscount.push({
          ...product.toObject(),
          variants: [bestVariant], // Chỉ lấy variant có giảm giá cao nhất
          discountPercent: maxDiscountPercent
        });
      }
    }
    
    // Sort theo phần trăm giảm giá giảm dần
    const saleProducts = productsWithDiscount
      .sort((a, b) => b.discountPercent - a.discountPercent)
      .slice(0, 8);

    // Get new products
    const newProductsRaw = await Product.find({ isActive: true })
    .sort({ date: -1 })
    .limit(8);

    // Get hot products
    const hotProductsRaw = await Product.find({ isActive: true })
      .sort({ views: -1 })
      .limit(8);

    // Gắn variants cho từng product
    const newProducts = await Promise.all(newProductsRaw.map(async (product) => {
      const variants = await ProductVariant.find({ productId: product._id });
      return { ...product.toObject(), variants };
    }));

    const hotProducts = await Promise.all(hotProductsRaw.map(async (product) => {
      const variants = await ProductVariant.find({ productId: product._id });
      return { ...product.toObject(), variants };
    }));

    res.json({ 
      success: true, 
      newProducts, 
      saleProducts, 
      hotProducts
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
