import ProductAttribute from '../models/ProductAttribute.js';

// Lấy tất cả thuộc tính
export const getAllAttributes = async (req, res) => {
  try {
    const attributes = await ProductAttribute.find()
      .sort({ name: 1, value: 1 })
      .lean();
    
    // Nhóm thuộc tính theo tên
    const groupedAttributes = attributes.reduce((acc, attr) => {
      if (!acc[attr.name]) {
        acc[attr.name] = [];
      }
      acc[attr.name].push(attr);
      return acc;
    }, {});
    
    res.json({ 
      success: true, 
      attributes: groupedAttributes,
      allAttributes: attributes 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Lấy danh sách tên thuộc tính duy nhất
export const getAttributeNames = async (req, res) => {
  try {
    const attributeNames = await ProductAttribute.distinct('name');
    res.json({ success: true, attributeNames });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Lấy giá trị thuộc tính theo tên
export const getAttributeValues = async (req, res) => {
  try {
    const { name } = req.params;
    const attributes = await ProductAttribute.find({ name })
      .select('value _id')
      .sort({ value: 1 })
      .lean();
    
    res.json({ success: true, attributes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Thêm thuộc tính mới
export const addAttribute = async (req, res) => {
  try {
    const { name, value } = req.body;
    
    if (!name || !value) {
      return res.status(400).json({ 
        success: false, 
        message: "Tên và giá trị thuộc tính là bắt buộc" 
      });
    }
    
    // Kiểm tra thuộc tính đã tồn tại
    const existingAttribute = await ProductAttribute.findOne({ 
      name: name.trim(), 
      value: value.trim() 
    });
    
    if (existingAttribute) {
      return res.status(400).json({ 
        success: false, 
        message: "Thuộc tính này đã tồn tại" 
      });
    }
    
    const attribute = await ProductAttribute.create({
      name: name.trim(),
      value: value.trim()
    });
    
    res.status(201).json({ 
      success: true, 
      message: "Thêm thuộc tính thành công",
      attribute 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cập nhật thuộc tính
export const updateAttribute = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, value } = req.body;
    
    if (!name || !value) {
      return res.status(400).json({ 
        success: false, 
        message: "Tên và giá trị thuộc tính là bắt buộc" 
      });
    }
    
    // Kiểm tra thuộc tính đã tồn tại (trừ chính nó)
    const existingAttribute = await ProductAttribute.findOne({ 
      name: name.trim(), 
      value: value.trim(),
      _id: { $ne: id }
    });
    
    if (existingAttribute) {
      return res.status(400).json({ 
        success: false, 
        message: "Thuộc tính này đã tồn tại" 
      });
    }
    
    const attribute = await ProductAttribute.findByIdAndUpdate(
      id,
      { 
        name: name.trim(),
        value: value.trim()
      },
      { new: true }
    );
    
    if (!attribute) {
      return res.status(404).json({ 
        success: false, 
        message: "Không tìm thấy thuộc tính" 
      });
    }
    
    res.json({ 
      success: true, 
      message: "Cập nhật thuộc tính thành công",
      attribute 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Xóa thuộc tính
export const deleteAttribute = async (req, res) => {
  try {
    const { id } = req.params;
    
    const attribute = await ProductAttribute.findByIdAndDelete(id);
    
    if (!attribute) {
      return res.status(404).json({ 
        success: false, 
        message: "Không tìm thấy thuộc tính" 
      });
    }
    
    res.json({ 
      success: true, 
      message: "Xóa thuộc tính thành công" 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Tìm kiếm thuộc tính
export const searchAttributes = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.json({ success: true, attributes: [] });
    }
    
    const attributes = await ProductAttribute.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { value: { $regex: query, $options: 'i' } }
      ]
    })
    .sort({ name: 1, value: 1 })
    .lean();
    
    res.json({ success: true, attributes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};