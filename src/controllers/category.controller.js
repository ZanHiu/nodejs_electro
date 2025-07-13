import { v2 as cloudinary } from 'cloudinary';
import Category from '../models/Category.js';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const addCategory = async (req, res) => {
    try {
        const { name, description, views, cateId } = req.body;
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

        const newCategory = await Category.create({
            name,
            description,
            image: images,
            views,
            cateId,
            date: Date.now(),
        });

        res.json({ success: true, message: "Upload successful", newCategory });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const editCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, cateId, existingImages, views, isActive } = req.body;
        const files = req.files;

        // Nếu chỉ cập nhật trạng thái isActive
        if (typeof isActive !== 'undefined') {
            const updated = await Category.findByIdAndUpdate(id, { isActive }, { new: true });
            if (!updated) return res.status(404).json({ success: false, message: "Category not found" });
            return res.json({ success: true, message: 'Cập nhật trạng thái thành công', category: updated });
        }

        // Find category and check ownership
        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }
        // if (category.userId !== req.user.id) {
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

        // Update category
        const updateCategory = await Category.findByIdAndUpdate(
            id,
            {
                name,
                description,
                cateId: Number(cateId),
                image: finalImages,
                views: Number(views),
            },
            { new: true }
        );

        res.json({
            success: true,
            message: "Category updated successfully",
            category: updateCategory
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        // Find category and check ownership
        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }
        // if (category.userId !== req.user.id) {
        //   return res.status(403).json({ success: false, message: "Not authorized" });
        // }

        // Delete category
        await Category.findByIdAndDelete(id);

        res.json({
            success: true,
            message: "Category deleted successfully"
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getCategories = async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true });
        res.json({ success: true, categories });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getTopCategories = async (req, res) => {
    try {
        const topCategories = await Category.find({ isActive: true })
            .sort('-views')
            .limit(10);

        res.json({ success: true, topCategories });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getSellerCategories = async (req, res) => {
    try {
        const categories = await Category.find({});
        res.json({ success: true, categories });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};