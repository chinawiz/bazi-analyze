import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { Stream } from 'openai/streaming';
import { ChatCompletionChunk } from 'openai/resources/chat/completions';

// 重试函数
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 30000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.log(`操作失败，第 ${i + 1} 次重试`);
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('操作失败');
}

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
    timeout: 30000,
    maxRetries: 2,
  });
}

// 设置响应超时
export const maxDuration = 60;

// 设置响应配置
export const runtime = 'edge';
export const preferredRegion = 'hkg1';

// 处理OpenAI API请求的函数
async function processOpenAIRequest(messages: ChatCompletionMessageParam[]) {
  const openai = createOpenAIClient();
  return openai.chat.completions.create({
    model: process.env.OPENAI_API_MODEL || "gpt-3.5-turbo",
    messages: messages,
    temperature: 0.7,
    max_tokens: 1500,
    presence_penalty: 0.1,
    frequency_penalty: 0.1,
    stream: true,
  });
}

export async function POST(request: Request) {
  const encoder = new TextEncoder();
  
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

    // 构建提示词
    const prompt = `分析八字：
性别：${gender}
出生地：${birthplace}
生辰八字：${birthdate}

请提供详细的八字命理分析，按以下格式输出（使用Markdown格式）：

**八字分析总览**

**1. 八字格局**
- **天干地支五行**
  年柱：
  月柱：
  日柱：
  时柱：
  五行分布：

- **日主特征**
  详细说明日主状态...

- **吉神凶煞**
  列出主要吉神凶煞...

**2. 性格特征与健康**
- **性格优势**
  列出3-4个主要优点...

- **性格短板**
  列出2-3个需要注意的方面...

- **健康建议**
  针对性地提供3-4条建议...

**3. 事业与财运**
- **事业方向**
  最适合的2-3个行业方向...

- **财运分析**
  财运特点和走势...

- **发展建议**
  具体的发展建议和时机...

**4. 姻缘与家庭**
- **感情特质**
  个人在感情方面的特点...

- **婚姻分析**
  婚姻状况和时机...

- **配偶特征**
  理想配偶的特点...

**未来运势**
- 近期（1年内）运势重点
- 中期（3年内）发展方向
- 长期（5年内）整体趋势

请确保分析专业、准确，并给出实用的建议。`;

    console.log('使用的模型:', process.env.OPENAI_API_MODEL || "gpt-3.5-turbo");

    // 准备消息数组
    const messages: ChatCompletionMessageParam[] = [
      { 
        role: "system", 
        content: "你是一位精通八字命理的分析师，擅长提供准确、实用、有见地的分析。请用专业但易懂的语言输出分析结果，注重分析的可操作性。" 
      },
      { role: "user", content: prompt }
    ];

    try {
      // 使用重试机制调用API
      const stream = await retryOperation(async () => {
        const openai = createOpenAIClient();
        return openai.chat.completions.create({
          model: process.env.OPENAI_API_MODEL || "gpt-3.5-turbo",
          messages: messages,
          temperature: 0.7,
          max_tokens: 1500,
          presence_penalty: 0.1,
          frequency_penalty: 0.1,
          stream: true,
        });
      });

      // 创建响应流
      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              const content = chunk.choices[0]?.delta?.content || '';
              if (content) {
                controller.enqueue(encoder.encode(content));
              }
            }
            controller.close();
          } catch (error) {
            console.error('流处理错误:', error);
            controller.error(error);
          }
        }
      });

      // 返回流式响应
      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } catch (error) {
      console.error('API调用失败:', error);
      return NextResponse.json(
        { 
          error: '服务暂时不可用，请稍后重试',
          details: error instanceof Error ? error.message : String(error)
        },
        { status: 503 }
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