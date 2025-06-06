import { v2 as cloudinary } from 'cloudinary';
import Product from '../models/Product.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const addProduct = async (req, res) => {
  try {
    const { name, description, category, brand, price, offerPrice, views } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: "No images uploaded" });
    }

    const uploadPromises = files.map(file => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { resource_type: "auto" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(file.buffer);
      });
    });

    const results = await Promise.all(uploadPromises);
    const images = results.map(result => result.secure_url);

    const newProduct = await Product.create({
      name,
      description,
      category,
      brand,
      price: Number(price),
      offerPrice: Number(offerPrice),
      image: images,
      views: Number(views),
      date: Date.now(),
    });

    res.json({ success: true, message: "Upload successful", newProduct });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const editProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, brand, price, offerPrice, existingImages, views } = req.body;
    const files = req.files;

    // Find product
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Handle new image uploads if any
    let newImages = [];
    if (files && files.length > 0) {
      const uploadPromises = files.map(file => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { resource_type: "auto" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          stream.end(file.buffer);
        });
      });

      const results = await Promise.all(uploadPromises);
      newImages = results.map(result => result.secure_url);
    }

    // Combine existing and new images
    const finalImages = JSON.parse(existingImages || '[]').concat(newImages);

    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        name,
        description,
        category,
        brand,
        price: Number(price),
        offerPrice: Number(offerPrice),
        image: finalImages,
        views: Number(views),
      },
      { new: true }
    );

    res.json({ 
      success: true, 
      message: "Product updated successfully", 
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
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Delete product
    await Product.findByIdAndDelete(id);

    res.json({ 
      success: true, 
      message: "Product deleted successfully"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProducts = async (req, res) => {
  try {
    const products = await Product.find({})
      .populate('category')
      .populate('brand');
    res.json({ success: true, products });
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
    res.json({ success: true, products });
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
    res.json({ success: true, products });
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
    res.json({ success: true, products });
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

    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
