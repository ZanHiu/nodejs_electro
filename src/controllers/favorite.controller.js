import Favorite from '../models/Favorite.js';
import Product from '../models/Product.js';
import ProductVariant from '../models/ProductVariant.js';

export const addToFavorite = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user.id;

    // Kiểm tra sản phẩm tồn tại
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Sản phẩm không tồn tại" });
    }

    // Kiểm tra đã yêu thích chưa
    const existingFavorite = await Favorite.findOne({ userId, product: productId });
    if (existingFavorite) {
      return res.status(400).json({ success: false, message: "Sản phẩm đã có trong danh sách yêu thích" });
    }

    // Thêm vào danh sách yêu thích
    const favorite = await Favorite.create({
      userId,
      product: productId,
    });

    res.json({ success: true, message: "Đã thêm vào danh sách yêu thích", favorite });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const removeFromFavorite = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    const favorite = await Favorite.findOneAndDelete({ userId, product: productId });
    if (!favorite) {
      return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm trong danh sách yêu thích" });
    }

    res.json({ success: true, message: "Đã xóa khỏi danh sách yêu thích" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const favorites = await Favorite.find({ userId })
      .populate({
        path: 'product',
        populate: [
          { path: 'category' },
          { path: 'brand' }
        ]
      });

    // Lấy variants cho từng product
    const favoritesWithVariants = await Promise.all(favorites.map(async (favorite) => {
      const variants = await ProductVariant.find({ productId: favorite.product._id });
      return { ...favorite.product.toObject(), variants };
    }));

    res.json({ 
      success: true, 
      favorites: favoritesWithVariants
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const checkFavorite = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    const favorite = await Favorite.findOne({ userId, product: productId });
    res.json({ success: true, isFavorite: !!favorite });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
