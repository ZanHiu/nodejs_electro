import { v2 as cloudinary } from 'cloudinary';
import Blog from '../models/Blog.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const addBlog = async (req, res) => {
  try {
    const { name, content, slug } = req.body;
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

    const newBlog = await Blog.create({
      userId: req.user.id,
      name,
      content,
      slug,
      image: images,
      date: Date.now(),
    });

    res.json({ success: true, message: "Upload successful", newBlog });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({});
    res.json({ success: true, blogs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getHomeBlogs = async (req, res) => {
  try {
    const homeBlogs = await Blog.find({})
      .sort({ date: -1 })
      .limit(5);
    res.json({ success: true, homeBlogs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
