import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export const chatWithOpenRouter = async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    
    if (!message) {
      return res.status(400).json({ 
        success: false, 
        error: "Message is required" 
      });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({
        success: false,
        error: "OpenRouter API key not configured"
      });
    }

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `Bạn là trợ lý AI của website thương mại điện tử Electro chuyên về đồ điện tử.

QUY TẮC QUAN TRỌNG:
1. Trả lời HOÀN TOÀN bằng tiếng Việt
2. Chỉ trả lời về sản phẩm điện tử (laptop, điện thoại, tablet, gaming, phụ kiện...)
3. Trả lời NGẮN GỌN, CHÍNH XÁC, KHÔNG LAN MAN
4. Nếu câu hỏi không liên quan đến điện tử, từ chối trả lời một cách lịch sự
5. Luôn thân thiện và hữu ích
6. Tối đa 80 từ cho mỗi câu trả lời
7. LUÔN NHỚ VÀ THAM CHIẾU ĐẾN CUỘC HỘI THOẠI TRƯỚC ĐÓ

CHỨC NĂNG:
- Tư vấn sản phẩm điện tử
- Hướng dẫn mua hàng, thanh toán
- Hỗ trợ kỹ thuật cơ bản
- Thông tin về website Electro`
          },
          ...conversationHistory,
          {
            role: "user",
            content: message
          }
        ],
        max_tokens: 120,
        temperature: 0.3
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "Electro E-commerce"
        }
      }
    );

    const aiResponse = response.data.choices[0].message.content.trim();

    res.json({
      success: true,
      response: aiResponse,
      timestamp: new Date().toISOString(),
      model: response.data.model
    });

  } catch (error) {
    console.error("OpenRouter API Error:", error?.response?.data || error.message);
    
    // Fallback responses
    const fallbackResponses = {
      "laptop": "Tôi tư vấn laptop. Bạn cần dùng để làm gì? (học tập, gaming, công việc)",
      "điện thoại": "Tôi tư vấn điện thoại. Bạn thích Android hay iPhone?",
      "mua": "Tôi hướng dẫn mua hàng. Bạn muốn mua gì?",
      "giá": "Bạn xem giá trên website. Sản phẩm nào bạn quan tâm?",
      "thanh toán": "Chúng tôi hỗ trợ: thẻ tín dụng, chuyển khoản, COD.",
      "gaming": "Tôi tư vấn sản phẩm gaming. Bạn cần laptop hay desktop?",
      "tablet": "Tôi tư vấn tablet. Bạn dùng để làm gì?",
      "phụ kiện": "Tôi tư vấn phụ kiện. Bạn cần gì? (tai nghe, chuột, bàn phím...)"
    };

    let fallbackResponse = "Tôi chỉ tư vấn về sản phẩm điện tử. Bạn cần gì ạ?";
    
    for (const [keyword, response] of Object.entries(fallbackResponses)) {
      if (message.toLowerCase().includes(keyword)) {
        fallbackResponse = response;
        break;
      }
    }

    res.status(500).json({
      success: false,
      error: "Có lỗi xảy ra, vui lòng thử lại sau",
      fallback: fallbackResponse,
      details: error?.response?.data || error.message
    });
  }
};
