import Product from '../models/Product.js';
import ProductVariant from '../models/ProductVariant.js';
import ProductAttribute from '../models/ProductAttribute.js';
import ProductImage from '../models/ProductImage.js';

export const getHomeProducts = async (req, res) => {
  try {
    // Helper function để xử lý variants với đầy đủ thông tin EAV
    const processProductVariants = async (products) => {
      return await Promise.all(products.map(async (product) => {
        const variants = await ProductVariant.find({ productId: product._id })
          .populate('attributeIds')
          .populate('imageId');
        
        // Xử lý variants để có cấu trúc dữ liệu rõ ràng
        const processedVariants = variants.map(variant => {
          const variantObj = variant.toObject();
          
          // Parse attributes từ JSON string
          let attributes = {};
          if (variantObj.attributeId && variantObj.attributeId.value) {
            try {
              attributes = JSON.parse(variantObj.attributeId.value);
            } catch (e) {
              console.error('Error parsing attributes:', e);
            }
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
        const productObj = product.toObject();
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
    };

    // Get sale products - tìm sản phẩm có variants với offerPrice < price
    const saleProductsRaw = await Product.find({ isActive: true })
      .populate('category')
      .populate('brand');

    // Lọc sản phẩm có giảm giá và tính phần trăm giảm
    const productsWithDiscount = [];
    const saleProductsWithVariants = await processProductVariants(saleProductsRaw);
    
    for (const product of saleProductsWithVariants) {
      // Tìm variant có giảm giá cao nhất
      let maxDiscountPercent = 0;
      let bestVariant = null;
      
      for (const variant of product.variants) {
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
          ...product,
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
      .populate('category')
      .populate('brand')
      .sort({ date: -1 })
      .limit(8);

    // Get hot products
    const hotProductsRaw = await Product.find({ isActive: true })
      .populate('category')
      .populate('brand')
      .sort({ views: -1 })
      .limit(8);

    // Xử lý variants cho new và hot products
    const newProducts = await processProductVariants(newProductsRaw);
    const hotProducts = await processProductVariants(hotProductsRaw);

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