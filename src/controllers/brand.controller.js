import { v2 as cloudinary } from 'cloudinary';
import Brand from '../models/Brand.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const addBrand = async (req, res) => {
  try {
    const { name, description, brandId } = req.body;
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
      userId: req.user.id,
      name,
      description,
      image: images,
      brandId,
      date: Date.now(),
    });

    res.json({ success: true, message: "Upload successful", newBrand });
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

export const getSellerBrands = async (req, res) => {
  try {
    const brands = await Brand.find({ userId: req.user.id });
    res.json({ success: true, brands });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
