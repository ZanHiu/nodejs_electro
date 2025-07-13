import Product from '../models/Product.js';

export const getHomeProducts = async (req, res) => {
  try {
    // Get new products
    const newProducts = await Product.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(8);

    // Get sale products
    const saleProducts = await Product.find({ offerPrice: { $ne: null }, isActive: true })
      .sort({ offerPrice: 1 })
      .limit(8);

    // Get hot products
    const hotProducts = await Product.find({ isActive: true })
      .sort({ views: -1 })
      .limit(8);

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
