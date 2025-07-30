import { v2 as cloudinary } from 'cloudinary';
import Product from '../models/Product.js';
import ProductVariant from '../models/ProductVariant.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const addProduct = async (req, res) => {
  try {
    const { name, description, category, brand, views } = req.body;
    let variants = req.body.variants;
    let colors = req.body.colors;
    const files = req.files;

    // Parse lại variants và colors nếu là string
    if (typeof variants === 'string') {
      try {
        variants = JSON.parse(variants);
      } catch (e) {
        variants = [];
      }
    }
    if (typeof colors === 'string') {
      try {
        colors = JSON.parse(colors);
      } catch (e) {
        colors = [];
      }
    }

    let specs = req.body.specs;
    if (typeof specs === 'string') {
      try {
        specs = JSON.parse(specs);
      } catch (e) {
        specs = {};
      }
    }

    // Upload ảnh cho từng màu
    let colorImageMap = {}; // { colorName: [url1, url2, ...] }
    for (let cIdx = 0; cIdx < colors.length; cIdx++) {
      const color = colors[cIdx];
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

    // Tạo sản phẩm chính
    const newProduct = await Product.create({
      name,
      description,
      category,
      brand,
      views: Number(views),
      date: Date.now(),
      specs: specs || {},
    });

    // Tạo các variant, lấy ảnh từ màu tương ứng
    let createdVariants = [];
    if (Array.isArray(variants) && variants.length > 0) {
      for (let vIdx = 0; vIdx < variants.length; vIdx++) {
        const variant = variants[vIdx];
        const colorName = variant.color;
        const imageUrls = colorImageMap[colorName] || [];
        if (!imageUrls.length) {
          return res.status(400).json({ success: false, message: `Màu '${colorName}' của biến thể thứ ${vIdx + 1} chưa có ảnh!` });
        }
        // Gom các trường attributes động
        const attributes = { color: colorName };
        if (variant.ram) attributes.ram = variant.ram;
        if (variant.rom) attributes.rom = variant.rom;
        const variantDoc = await ProductVariant.create({
          productId: newProduct._id,
          attributes,
          images: imageUrls,
          price: Number(variant.price),
          offerPrice: Number(variant.offerPrice),
        });
        createdVariants.push(variantDoc);
      }
    }

    res.json({ success: true, message: "Thêm sản phẩm thành công", newProduct, variants: createdVariants });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const editProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, brand, views, specs, variants, colors } = req.body;
    const files = req.files;

    // Nếu chỉ cập nhật trạng thái isActive
    if (typeof req.body.isActive !== 'undefined') {
      const updated = await Product.findByIdAndUpdate(id, { isActive: req.body.isActive }, { new: true });
      if (!updated) return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm" });
      return res.json({ success: true, message: 'Cập nhật trạng thái thành công', product: updated });
    }

    // Parse lại variants, colors, specs nếu là string
    let parsedVariants = variants;
    let parsedColors = colors;
    let parsedSpecs = specs;
    
    if (typeof variants === 'string') {
      try {
        parsedVariants = JSON.parse(variants);
      } catch (e) {
        parsedVariants = [];
      }
    }
    if (typeof colors === 'string') {
      try {
        parsedColors = JSON.parse(colors);
      } catch (e) {
        parsedColors = [];
      }
    }
    if (typeof specs === 'string') {
      try {
        parsedSpecs = JSON.parse(specs);
      } catch (e) {
        parsedSpecs = {};
      }
    }

    // Find product và variants hiện tại
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm" });
    }

    // Lấy variants hiện tại để có ảnh cũ
    const existingVariants = await ProductVariant.find({ productId: id });
    const existingColorImages = {};
    existingVariants.forEach(variant => {
      if (variant.attributes?.color) {
        existingColorImages[variant.attributes.color] = variant.images || [];
      }
    });

    // Upload ảnh cho từng màu nếu có
    let colorImageMap = {}; // { colorName: [url1, url2, ...] }
    if (parsedColors && parsedColors.length > 0) {
      for (let cIdx = 0; cIdx < parsedColors.length; cIdx++) {
        const color = parsedColors[cIdx];
        const colorImages = files
          .filter(f => f.fieldname.startsWith(`colorImages_${cIdx}_`))
          .sort((a, b) => {
            const aIdx = parseInt(a.fieldname.split('_').pop());
            const bIdx = parseInt(b.fieldname.split('_').pop());
            return aIdx - bIdx;
          });
        
        let imageUrls = [];
        
        // Giữ lại ảnh cũ nếu có
        if (existingColorImages[color.name]) {
          imageUrls = [...existingColorImages[color.name]];
        }
        
        // Upload ảnh mới nếu có
        if (colorImages.length > 0) {
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
        }
        
        colorImageMap[color.name] = imageUrls;
      }
    }

    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        name,
        description,
        category,
        brand,
        views: Number(views),
        specs: parsedSpecs || {},
      },
      { new: true }
    );

    // Xóa tất cả variants cũ và tạo mới
    if (parsedVariants && parsedVariants.length > 0) {
      await ProductVariant.deleteMany({ productId: id });
      
      let createdVariants = [];
      for (let vIdx = 0; vIdx < parsedVariants.length; vIdx++) {
        const variant = parsedVariants[vIdx];
        const colorName = variant.color;
        const imageUrls = colorImageMap[colorName] || [];
        
        // Gom các trường attributes động
        const attributes = { color: colorName };
        if (variant.ram) attributes.ram = variant.ram;
        if (variant.rom) attributes.rom = variant.rom;
        
        const variantDoc = await ProductVariant.create({
          productId: id,
          attributes,
          images: imageUrls,
          price: Number(variant.price),
          offerPrice: Number(variant.offerPrice),
        });
        createdVariants.push(variantDoc);
      }
    }

    res.json({ 
      success: true, 
      message: "Cập nhật sản phẩm thành công", 
      product: updatedProduct 
    });
  } catch (error) {
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
    const products = await Product.find({ isActive: true })
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

export const getSellerProducts = async (req, res) => {
  try {
    const products = await Product.find({})
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

export const getProductsByCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const products = await Product.find({ category: id })
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

export const getProductsByBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const products = await Product.find({ brand: id })
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

export const getFilteredProducts = async (req, res) => {
  try {
    const { categoryId, brandId } = req.query;
    let query = {};

    if (categoryId !== 'all') {
      query.category = categoryId;
    }
    if (brandId !== 'all') {
      query.brand = brandId;
    }

    const products = await Product.find(query)
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

    // Lấy danh sách variant của sản phẩm này
    const variants = await ProductVariant.find({ productId: id });

    res.json({ success: true, product, variants });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
