import Product from '../models/Product.js';
import ProductVariant from '../models/ProductVariant.js';

export const getHomeProducts = async (req, res) => {
  try {
    // Get new products
    const newProductsRaw = await Product.find({ isActive: true })
      .sort({ date: -1 })
      .limit(8);

    // Get sale products
    const saleProductsRaw = await Product.find({ offerPrice: { $ne: null }, isActive: true })
      .sort({ offerPrice: 1 })
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

    const saleProducts = await Promise.all(saleProductsRaw.map(async (product) => {
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
