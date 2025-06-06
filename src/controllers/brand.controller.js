import { v2 as cloudinary } from 'cloudinary';
import Brand from '../models/Brand.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const addBrand = async (req, res) => {
  try {
    const { name, description, views, brandId } = req.body;
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

    const newBrand = await Brand.create({
      name,
      description,
      image: images,
      views,
      brandId,
      date: Date.now(),
    });

    res.json({ success: true, message: "Upload successful", newBrand });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const editBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, brandId, existingImages, views } = req.body;
    const files = req.files;

    // Find brand and check ownership
    const brand = await Brand.findById(id);
    if (!brand) {
      return res.status(404).json({ success: false, message: "Brand not found" });
    }
    // if (brand.userId !== req.user.id) {
    //   return res.status(403).json({ success: false, message: "Not authorized" });
    // }

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

    // Update brand
    const updateBrand = await Brand.findByIdAndUpdate(
      id,
      {
        name,
        description,
        brandId: Number(brandId),
        image: finalImages,
        views: Number(views),
      },
      { new: true }
    );

    res.json({ 
      success: true, 
      message: "Brand updated successfully", 
      brand: updateBrand 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteBrand = async (req, res) => {
  try {
    const { id } = req.params;

    // Find brand and check ownership
    const brand = await Brand.findById(id);
    if (!brand) {
      return res.status(404).json({ success: false, message: "Brand not found" });
    }
    // if (brand.userId !== req.user.id) {
    //   return res.status(403).json({ success: false, message: "Not authorized" });
    // }

    // Delete brand
    await Brand.findByIdAndDelete(id);

    res.json({ 
      success: true, 
      message: "Brand deleted successfully"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBrands = async (req, res) => {
  try {
    const brands = await Brand.find({});
    res.json({ success: true, brands });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTopBrands = async (req, res) => {
  try {
    const topBrands = await Brand.find({})
      .sort('-views')
      .limit(10);

    res.json({ success: true, topBrands });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSellerBrands = async (req, res) => {
  try {
    const brands = await Brand.find({});
    res.json({ success: true, brands });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
