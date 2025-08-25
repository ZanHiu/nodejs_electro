import { v2 as cloudinary } from 'cloudinary';
import Product from '../models/Product.js';
import ProductVariant from '../models/ProductVariant.js';
import ProductImage from '../models/ProductImage.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const processVariantAttributes = (variantObj) => {
  let attributes = {};
  if (variantObj.attributeIds && variantObj.attributeIds.length > 0) {
    variantObj.attributeIds.forEach(attr => {
      if (attr && attr.name && attr.value) {
        attributes[attr.name] = attr.value;
      }
    });
  }
  return attributes;
};

export const addProduct = async (req, res) => {
  try {
    const { name, description, category, brand, views } = req.body;
    let productData = req.body.productData;
    const files = req.files;

    // Parse productData từ frontend
    if (typeof productData === 'string') {
      try {
        productData = JSON.parse(productData);
      } catch (e) {
        return res.status(400).json({ success: false, message: "Dữ liệu sản phẩm không hợp lệ" });
      }
    }

    // Kiểm tra duplicate product name
    const existingProduct = await Product.findOne({ name: name.trim() });
    if (existingProduct) {
      return res.status(400).json({ success: false, message: "Tên sản phẩm đã tồn tại" });
    }

    if (!productData || !productData.variants || productData.variants.length === 0) {
      return res.status(400).json({ success: false, message: "Cần ít nhất 1 biến thể cho sản phẩm" });
    }

    if (!productData.colors || productData.colors.length === 0) {
      return res.status(400).json({ success: false, message: "Cần ít nhất 1 màu sắc cho sản phẩm" });
    }

    // Chuẩn bị thuộc tính chung
    const commonAttributes = new Map();
    if (productData.commonAttributes && productData.commonAttributes.length > 0) {
      productData.commonAttributes.forEach(attr => {
        if (attr.name && attr.value) {
          commonAttributes.set(attr.name, attr.value);
        }
      });
    }

    // Tạo sản phẩm chính với thuộc tính chung
    const newProduct = await Product.create({
      name: name.trim(),
      description,
      category,
      brand,
      views: Number(views) || 0,
      date: Date.now(),
      commonAttributes
    });

    // Upload ảnh cho từng màu
    let colorImageMap = {}; // { colorName: [url1, url2, ...] }
    for (let cIdx = 0; cIdx < productData.colors.length; cIdx++) {
      const color = productData.colors[cIdx];
      const colorImages = files
        .filter(f => f.fieldname.startsWith(`colorImages_${cIdx}_`))
        .sort((a, b) => {
          const aIdx = parseInt(a.fieldname.split('_').pop());
          const bIdx = parseInt(b.fieldname.split('_').pop());
          return aIdx - bIdx;
        });
      if (!colorImages.length) {
        return res.status(400).json({ success: false, message: `Màu thứ ${cIdx + 1} chưa có ảnh!` });
      }
      let imageUrls = [];
      for (const file of colorImages) {
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { resource_type: "auto" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          stream.end(file.buffer);
        });
        imageUrls.push(result.secure_url);
      }
      colorImageMap[color.name] = imageUrls;
    }

    // Tạo ProductImage cho các màu sắc (BỎ productId)
    const createdImages = [];
    for (let colorIdx = 0; colorIdx < productData.colors.length; colorIdx++) {
      const color = productData.colors[colorIdx];
      
      // Tạo ProductImage KHÔNG CẦN productId
      const productImage = await ProductImage.create({
        name: color.name,
        value: colorImageMap[color.name] // Mảng các URL ảnh
      });
      
      createdImages.push(productImage);
    }

    // Tạo ProductAttribute riêng lẻ cho từng thuộc tính
    const createdAttributeIds = [];
    
    // Tạo ProductVariant cho từng biến thể x từng màu
    const createdVariants = [];
    for (const variant of productData.variants) {
      // Sử dụng selectedAttributeIds thay vì attributeIndices
      let variantAttributeIds = [];
      if (variant.selectedAttributeIds && variant.selectedAttributeIds.length > 0) {
        // Sử dụng trực tiếp selectedAttributeIds từ frontend
        variantAttributeIds = variant.selectedAttributeIds;
      }
      
      // Chỉ tạo ProductVariant cho màu được chọn
      for (const variant of productData.variants) {
        let variantAttributeIds = [];
        if (variant.selectedAttributeIds && variant.selectedAttributeIds.length > 0) {
          variantAttributeIds = variant.selectedAttributeIds;
        }
        
        // Chỉ tạo variant cho màu được chọn
        const colorIndex = variant.colorIndex || 0;
        if (colorIndex < createdImages.length) {
          const productVariant = await ProductVariant.create({
            productId: newProduct._id,
            attributeIds: variantAttributeIds,
            imageId: createdImages[colorIndex]._id, // Chỉ màu được chọn
            price: Number(variant.price),
            offerPrice: Number(variant.offerPrice) || 0
          });
          
          createdVariants.push(productVariant);
        }
      }
    }

    res.json({ 
      success: true, 
      message: "Thêm sản phẩm thành công", 
      product: newProduct,
      images: createdImages,
      variants: createdVariants,
      attributes: createdAttributeIds
    });
  } catch (error) {
    console.error('Error in addProduct:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const editProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, brand, views } = req.body;
    let productData = req.body.productData;
    const files = req.files;

    // Nếu chỉ cập nhật trạng thái isActive
    if (typeof req.body.isActive !== 'undefined') {
      const updated = await Product.findByIdAndUpdate(id, { isActive: req.body.isActive }, { new: true });
      if (!updated) return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm" });
      return res.json({ success: true, message: 'Cập nhật trạng thái thành công', product: updated });
    }

    // Parse productData từ frontend
    if (typeof productData === 'string') {
      try {
        productData = JSON.parse(productData);
      } catch (e) {
        return res.status(400).json({ success: false, message: "Dữ liệu sản phẩm không hợp lệ" });
      }
    }

    // Kiểm tra sản phẩm tồn tại
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm" });
    }

    // Kiểm tra duplicate product name (trừ chính nó)
    const existingProduct = await Product.findOne({ 
      name: name.trim(), 
      _id: { $ne: id } 
    });
    if (existingProduct) {
      return res.status(400).json({ success: false, message: "Tên sản phẩm đã tồn tại" });
    }

    if (!productData || !productData.variants || productData.variants.length === 0) {
      return res.status(400).json({ success: false, message: "Cần ít nhất 1 biến thể cho sản phẩm" });
    }

    if (!productData.colors || productData.colors.length === 0) {
      return res.status(400).json({ success: false, message: "Cần ít nhất 1 màu sắc cho sản phẩm" });
    }

    // Chuẩn bị thuộc tính chung
    const commonAttributes = new Map();
    if (productData.commonAttributes && productData.commonAttributes.length > 0) {
      productData.commonAttributes.forEach(attr => {
        if (attr.name && attr.value) {
          commonAttributes.set(attr.name, attr.value);
        }
      });
    }

    // Cập nhật sản phẩm chính
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        name: name.trim(),
        description,
        category,
        brand,
        views: Number(views) || 0,
        commonAttributes
      },
      { new: true }
    );

    // Lấy các ProductImage hiện tại của sản phẩm này thông qua ProductVariant
    const existingVariants = await ProductVariant.find({ productId: id }).populate('imageId');
    const existingImageIds = existingVariants.map(v => v.imageId?._id).filter(Boolean);
    const existingImages = await ProductImage.find({ _id: { $in: existingImageIds } });
    
    // Tạo map để tra cứu nhanh
    const existingImageMap = new Map();
    existingImages.forEach(img => {
      existingImageMap.set(img.name, img);
    });

    // Upload ảnh cho từng màu (chỉ upload file mới)
    let colorImageMap = {}; // { colorName: [url1, url2, ...] }
    for (let cIdx = 0; cIdx < productData.colors.length; cIdx++) {
      const color = productData.colors[cIdx];
      
      // Lấy ảnh mới từ files
      const newColorImages = files
        .filter(f => f.fieldname.startsWith(`colorImages_${cIdx}_`))
        .sort((a, b) => {
          const aIdx = parseInt(a.fieldname.split('_').pop());
          const bIdx = parseInt(b.fieldname.split('_').pop());
          return aIdx - bIdx;
        });
      
      // Lấy ảnh cũ từ color.images (URL string)
      const existingImages = color.images || [];
      
      let imageUrls = [];
      
      // Upload ảnh mới và giữ ảnh cũ
      for (let imgIdx = 0; imgIdx < Math.max(newColorImages.length, existingImages.length); imgIdx++) {
        const newFile = newColorImages.find(f => f.fieldname === `colorImages_${cIdx}_${imgIdx}`);
        
        if (newFile) {
          // Upload ảnh mới
          const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              { resource_type: "auto" },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            );
            stream.end(newFile.buffer);
          });
          imageUrls.push(result.secure_url);
        } else if (existingImages[imgIdx] && typeof existingImages[imgIdx] === 'string') {
          // Giữ ảnh cũ
          imageUrls.push(existingImages[imgIdx]);
        }
      }
      
      if (imageUrls.length === 0) {
        return res.status(400).json({ success: false, message: `Màu "${color.name}" chưa có ảnh!` });
      }
      
      colorImageMap[color.name] = imageUrls;
    }

    // Cập nhật hoặc tạo mới ProductImage cho các màu sắc
    const createdImages = [];
    for (let colorIdx = 0; colorIdx < productData.colors.length; colorIdx++) {
      const color = productData.colors[colorIdx];
      
      // Kiểm tra xem đã có ProductImage cho màu này chưa
      const existingImage = existingImageMap.get(color.name);
      
      if (existingImage) {
        // Cập nhật ProductImage hiện tại
        const updatedImage = await ProductImage.findByIdAndUpdate(
          existingImage._id,
          {
            name: color.name,
            value: colorImageMap[color.name]
          },
          { new: true }
        );
        createdImages.push(updatedImage);
      } else {
        // Tạo ProductImage mới
        const productImage = await ProductImage.create({
          name: color.name,
          value: colorImageMap[color.name]
        });
        createdImages.push(productImage);
      }
    }

    // Xóa các ProductImage không còn sử dụng (chỉ của sản phẩm này)
    const currentColorNames = productData.colors.map(c => c.name);
    const imagesToDelete = existingImages.filter(img => !currentColorNames.includes(img.name));
    if (imagesToDelete.length > 0) {
      await ProductImage.deleteMany({ _id: { $in: imagesToDelete.map(img => img._id) } });
    }

    // Lấy các ProductVariant hiện có của sản phẩm này
    const existingVariantsForUpdate = await ProductVariant.find({ productId: id }).sort({ createdAt: 1 });

    // Cập nhật hoặc tạo mới ProductVariant (giữ nguyên ID khi có thể)
    const finalVariants = [];
    for (let i = 0; i < productData.variants.length; i++) {
      const variant = productData.variants[i];
      let variantAttributeIds = [];
      if (variant.selectedAttributeIds && variant.selectedAttributeIds.length > 0) {
        variantAttributeIds = variant.selectedAttributeIds;
      }
      
      const colorIndex = variant.colorIndex || 0;
      if (colorIndex < createdImages.length) {
        let productVariant;
        
        if (existingVariantsForUpdate[i]) {
          // Cập nhật ProductVariant hiện có (giữ nguyên ID)
          productVariant = await ProductVariant.findByIdAndUpdate(
            existingVariantsForUpdate[i]._id,
            {
              attributeIds: variantAttributeIds,
              imageId: createdImages[colorIndex]._id,
              price: Number(variant.price),
              offerPrice: Number(variant.offerPrice) || 0
            },
            { new: true }
          );
        } else {
          // Tạo mới nếu không có variant tương ứng
          productVariant = await ProductVariant.create({
            productId: id,
            attributeIds: variantAttributeIds,
            imageId: createdImages[colorIndex]._id,
            price: Number(variant.price),
            offerPrice: Number(variant.offerPrice) || 0
          });
        }
        
        finalVariants.push(productVariant);
      }
    }

    // Xóa các ProductVariant thừa (nếu số variant mới ít hơn số variant cũ)
    if (existingVariantsForUpdate.length > productData.variants.length) {
      const variantsToDelete = existingVariantsForUpdate.slice(productData.variants.length);
      await ProductVariant.deleteMany({ 
        _id: { $in: variantsToDelete.map(v => v._id) } 
      });
    }

    res.json({ 
      success: true, 
      message: "Cập nhật sản phẩm thành công", 
      product: updatedProduct,
      images: createdImages,
      variants: finalVariants
    });
  } catch (error) {
    console.error('Error in editProduct:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Find product
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm" });
    }

    // Delete product
    await Product.findByIdAndDelete(id);

    res.json({ 
      success: true, 
      message: "Xóa sản phẩm thành công",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 9 } = req.query;
    const skip = (page - 1) * limit;
    
    const products = await Product.find({ isActive: true })
      .populate('category')
      .populate('brand')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ date: -1 });
    
    const total = await Product.countDocuments({ isActive: true });
    
    // Xử lý variants với đầy đủ thông tin EAV cho từng product
    const productsWithVariants = await Promise.all(products.map(async (product) => {
      const variants = await ProductVariant.find({ productId: product._id })
        .populate('attributeIds')
        .populate('imageId');
      
      // Xử lý variants để có cấu trúc dữ liệu rõ ràng
      const processedVariants = variants.map(variant => {
        const variantObj = variant.toObject();
        
        // Xử lý attributes từ mảng attributeIds
        const attributes = processVariantAttributes(variantObj);
        
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
    
    res.json({ 
      success: true, 
      products: productsWithVariants,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSellerProducts = async (req, res) => {
  try {
    const products = await Product.find({})
      .populate('category')
      .populate('brand');
    
    // Lấy variants với đầy đủ thông tin EAV cho từng product
    const productsWithVariants = await Promise.all(products.map(async (product) => {
      const variants = await ProductVariant.find({ productId: product._id })
        .populate('attributeIds')
        .populate('imageId');
      
      // Xử lý variants để có cấu trúc dữ liệu rõ ràng
      const processedVariants = variants.map(variant => {
        const variantObj = variant.toObject();
        
        // Xử lý attributes từ mảng attributeIds
        const attributes = processVariantAttributes(variantObj);
        
        // Lấy images và colorName từ imageId (ProductImage)
        let images = [];
        let colorName = '';
        if (variantObj.imageId) {
          if (variantObj.imageId.value) {
            images = Array.isArray(variantObj.imageId.value) ? variantObj.imageId.value : [variantObj.imageId.value];
          }
          if (variantObj.imageId.name) {
            colorName = variantObj.imageId.name; // Tên màu từ ProductImage
          }
        }
        
        return {
          _id: variantObj._id,
          price: variantObj.price,
          offerPrice: variantObj.offerPrice,
          attributes,
          images,
          colorName, // Thêm tên màu
          createdAt: variantObj.createdAt
        };
      });
      
      // Chuyển đổi commonAttributes từ Map sang Object để frontend dễ sử dụng
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
    
    res.json({ success: true, products: productsWithVariants });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProductsByCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const products = await Product.find({ category: id, isActive: true })
      .populate('category')
      .populate('brand');
    
    // Xử lý variants với đầy đủ thông tin EAV cho từng product
    const productsWithVariants = await Promise.all(products.map(async (product) => {
      const variants = await ProductVariant.find({ productId: product._id })
        .populate('attributeIds')
        .populate('imageId');
      
      // Xử lý variants để có cấu trúc dữ liệu rõ ràng
      const processedVariants = variants.map(variant => {
        const variantObj = variant.toObject();
        
        // Xử lý attributes từ mảng attributeIds
        const attributes = processVariantAttributes(variantObj);
        
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
    
    res.json({ success: true, products: productsWithVariants });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProductsByBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const products = await Product.find({ brand: id, isActive: true })
      .populate('category')
      .populate('brand');
    
    // Xử lý variants với đầy đủ thông tin EAV cho từng product
    const productsWithVariants = await Promise.all(products.map(async (product) => {
      const variants = await ProductVariant.find({ productId: product._id })
        .populate('attributeIds')
        .populate('imageId');
      
      // Xử lý variants để có cấu trúc dữ liệu rõ ràng
      const processedVariants = variants.map(variant => {
        const variantObj = variant.toObject();
        
        // Xử lý attributes từ mảng attributeIds
        const attributes = processVariantAttributes(variantObj);
        
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
    
    res.json({ success: true, products: productsWithVariants });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFilteredProducts = async (req, res) => {
  try {
    const { categoryId, brandId, page = 1, limit = 9 } = req.query;
    const skip = (page - 1) * limit;
    
    let query = { isActive: true };

    if (categoryId !== 'all') {
      query.category = categoryId;
    }
    if (brandId !== 'all') {
      query.brand = brandId;
    }

    const products = await Product.find(query)
      .populate('category')
      .populate('brand')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ date: -1 });
    
    const total = await Product.countDocuments(query);
    
    // Xử lý variants với đầy đủ thông tin EAV cho từng product
    const productsWithVariants = await Promise.all(products.map(async (product) => {
      const variants = await ProductVariant.find({ productId: product._id })
        .populate('attributeIds')
        .populate('imageId');
      
      // Xử lý variants để có cấu trúc dữ liệu rõ ràng
      const processedVariants = variants.map(variant => {
        const variantObj = variant.toObject();
        
        // Xử lý attributes từ mảng attributeIds
        const attributes = processVariantAttributes(variantObj);
        
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
    
    res.json({ 
      success: true, 
      products: productsWithVariants,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const searchProducts = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.json({ success: true, products: [] });
    }

    const products = await Product.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
      ]
    })
    .populate('category')
    .populate('brand');

    // Lấy variants cho từng product
    const productsWithVariants = await Promise.all(products.map(async (product) => {
      const variants = await ProductVariant.find({ productId: product._id });
      return { ...product.toObject(), variants };
    }));

    res.json({ success: true, products: productsWithVariants });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProductDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id)
      .populate('category')
      .populate('brand');
    
    if (!product) {
      return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm" });
    }

    // Lấy danh sách variant với đầy đủ thông tin EAV
    const variants = await ProductVariant.find({ productId: id })
      .populate('attributeIds')
      .populate('imageId');
    
    // Xử lý variants để có cấu trúc dữ liệu rõ ràng
    const processedVariants = variants.map(variant => {
      const variantObj = variant.toObject();
      
      // Xử lý attributes từ mảng attributeIds
      const attributes = processVariantAttributes(variantObj);
      
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
        attributeIds: variantObj.attributeIds, // SỬA: Thêm variantObj. trước attributeIds
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

    res.json({ 
      success: true, 
      product: { ...productObj, commonAttributes }, 
      variants: processedVariants 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
