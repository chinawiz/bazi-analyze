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
    timeout: 25000, // 减少到25秒超时
    maxRetries: 2, // 减少到2次重试
  });
}

// 设置响应超时
export const maxDuration = 30; // 减少到30秒

// 设置响应配置
export const runtime = 'edge'; // 使用边缘运行时
export const preferredRegion = 'hkg1'; // 使用香港节点

export async function POST(request: Request) {
  try {
    console.log('收到API请求');
    
    // 解析请求体
    let body;
    try {
      body = await request.json();
      console.log('请求数据:', body);
    } catch (error) {
      console.error('请求数据解析失败:', error);
      return NextResponse.json(
        { error: '无效的请求数据格式' },
        { status: 400 }
      );
    }

    const { gender, birthplace, birthdate } = body;

    // 验证输入
    if (!gender || !birthplace || !birthdate) {
      console.error('缺少必要参数:', { gender, birthplace, birthdate });
      return NextResponse.json(
        { error: '请提供性别、出生地和生辰八字' },
        { status: 400 }
      );
    }

    // 创建OpenAI客户端
    let openai;
    try {
      openai = createOpenAIClient();
      console.log('OpenAI客户端创建成功');
    } catch (error) {
      console.error('创建OpenAI客户端失败:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : '配置错误' },
        { status: 500 }
      );
    }

    // 构建提示词
    const prompt = `简要分析：
性别：${gender}
出生地：${birthplace}
生辰八字：${birthdate}

请提供简明的八字分析，包括：
1. 五行属性
2. 主要命运特征
3. 事业发展建议
4. 感情婚姻概述`;

    console.log('使用的模型:', process.env.OPENAI_API_MODEL || "gpt-3.5-turbo");
    console.log('最大Token数:', process.env.OPENAI_MAX_TOKENS || "1000");

    // 准备消息数组
    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: "你是一位专业的命理分析师，请简明扼要地回答。" },
      { role: "user", content: prompt }
    ];

    try {
      // 调用API
      console.log('开始调用OpenAI API');
      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_API_MODEL || "gpt-3.5-turbo",
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000, // 减少token数量
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      });
      console.log('OpenAI API调用成功');

      const response = { 
        result: completion.choices[0].message.content,
        usage: completion.usage
      };
      console.log('API响应:', response);
      
      return new NextResponse(JSON.stringify(response), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache'
        }
      });
    } catch (error) {
      console.error('OpenAI API调用出错:', error);
      // 检查是否是超时错误
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isTimeout = errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT');
      
      return NextResponse.json(
        { 
          error: isTimeout ? 'API请求超时，请稍后重试' : 'AI服务调用失败',
          details: errorMessage
        },
        { status: isTimeout ? 504 : 500 }
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