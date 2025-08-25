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

    // Xử lý variants với đầy đủ thông tin EAV cho từng product
    const favoritesWithVariants = await Promise.all(favorites.map(async (favorite) => {
      const variants = await ProductVariant.find({ productId: favorite.product._id })
        .populate('attributeIds')
        .populate('imageId');
      
      // Xử lý variants để có cấu trúc dữ liệu rõ ràng
      const processedVariants = variants.map(variant => {
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
          _id: variantObj._id,
          price: variantObj.price,
          offerPrice: variantObj.offerPrice,
          attributes,
          images,
          colorName,
          createdAt: variantObj.createdAt
        };
      });
      
      // Chuyển đổi commonAttributes từ Map sang Object
      const productObj = favorite.product.toObject();
      let commonAttributes = {};
      if (productObj.commonAttributes && productObj.commonAttributes instanceof Map) {
        commonAttributes = Object.fromEntries(productObj.commonAttributes);
      } else if (productObj.commonAttributes && typeof productObj.commonAttributes === 'object') {
        commonAttributes = productObj.commonAttributes;
      }
      
      return { 
        ...productObj, 
        variants: processedVariants,
        commonAttributes 
      };
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
