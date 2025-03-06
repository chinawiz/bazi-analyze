import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

// 创建OpenAI客户端实例的函数
function createOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseURL = process.env.OPENAI_API_BASE_URL;

  if (!apiKey) {
    throw new Error('未配置OpenAI API密钥');
  }

  return new OpenAI({
    apiKey: apiKey,
    baseURL: baseURL || 'https://api.openai.com/v1',
  });
}

export async function POST(request: Request) {
  try {
    // 解析请求体
    let body;
    try {
      body = await request.json();
    } catch (_) {
      return NextResponse.json(
        { error: '无效的请求数据格式' },
        { status: 400 }
      );
    }

    const { gender, birthplace, birthdate } = body;

    // 验证输入
    if (!gender || !birthplace || !birthdate) {
      return NextResponse.json(
        { error: '请提供性别、出生地和生辰八字' },
        { status: 400 }
      );
    }

    // 创建OpenAI客户端
    let openai;
    try {
      openai = createOpenAIClient();
    } catch (error) {
      console.error('创建OpenAI客户端失败:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : '配置错误' },
        { status: 500 }
      );
    }

    // 构建提示词
    const prompt = `
      请根据以下信息进行八字分析：
      性别：${gender}
      出生地：${birthplace}
      生辰八字：${birthdate}
      
      请提供详细的命理分析，包括五行属性、命运走向、事业财运、婚姻感情等方面的解读。
    `;

    // 准备消息数组
    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: "你是一位精通命理学和八字分析的专家。" },
      { role: "user", content: prompt }
    ];

    try {
      // 调用API
      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_API_MODEL || "gpt-3.5-turbo",
        messages: messages,
        temperature: 0.7,
        max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS || "2000"),
      });

      // 返回结果
      return NextResponse.json({ 
        result: completion.choices[0].message.content,
        usage: completion.usage
      });
    } catch (error) {
      console.error('OpenAI API调用出错:', error);
      return NextResponse.json(
        { 
          error: 'AI服务调用失败',
          details: error instanceof Error ? error.message : String(error)
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API处理出错:', error);
    return NextResponse.json(
      { 
        error: '服务器内部错误',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 