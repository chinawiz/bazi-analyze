'use client';

import { useState } from 'react';

// 定义请求超时时间
const FETCH_TIMEOUT = 30000;

// 带超时的fetch函数
async function fetchWithTimeout(url: string, options: RequestInit, timeout: number) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('请求超时，请稍后重试');
    }
    throw error;
  }
}

export default function Home() {
  // 状态管理
  const [gender, setGender] = useState<string>('男');
  const [birthplace, setBirthplace] = useState<string>('');
  const [birthdate, setBirthdate] = useState<string>('');
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // 处理流式响应
  async function handleStream(response: Response) {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let text = '';

    if (!reader) {
      throw new Error('无法读取响应流');
    }

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        text += chunk;
        setResult(text); // 实时更新UI
      }
    } finally {
      reader.releaseLock();
    }
  }

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult('');

    try {
      console.log('发送请求数据:', { gender, birthplace, birthdate });
      
      const response = await fetchWithTimeout('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gender,
          birthplace,
          birthdate,
        }),
      }, FETCH_TIMEOUT);

      console.log('服务器响应状态:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `请求失败 (${response.status})`);
      }

      // 处理流式响应
      await handleStream(response);
      
    } catch (err) {
      console.error('请求错误:', err);
      setError(err instanceof Error ? err.message : '发生未知错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-6 md:p-24 bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">生辰八字分析</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">性别</label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio h-4 w-4 text-blue-600"
                    value="男"
                    checked={gender === '男'}
                    onChange={() => setGender('男')}
                  />
                  <span className="ml-2">男</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio h-4 w-4 text-blue-600"
                    value="女"
                    checked={gender === '女'}
                    onChange={() => setGender('女')}
                  />
                  <span className="ml-2">女</span>
                </label>
              </div>
            </div>

            <div>
              <label htmlFor="birthplace" className="block text-sm font-medium text-gray-700 mb-1">
                出生地
              </label>
              <input
                type="text"
                id="birthplace"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="例如：北京市朝阳区"
                value={birthplace}
                onChange={(e) => setBirthplace(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="birthdate" className="block text-sm font-medium text-gray-700 mb-1">
                生辰八字
              </label>
              <input
                type="text"
                id="birthdate"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="例如：1990年7月15日 12时30分"
                value={birthdate}
                onChange={(e) => setBirthdate(e.target.value)}
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                请输入准确的出生年月日时，格式不限
              </p>
            </div>

            <div>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-150 ease-in-out"
                disabled={loading}
              >
                {loading ? '分析中...' : '开始分析'}
              </button>
            </div>
          </form>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {result && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">八字分析结果</h2>
            <div className="prose max-w-none">
              {result.split('\n').map((line, index) => {
                // 处理标题
                if (line.startsWith('**') && line.endsWith('**')) {
                  const title = line.replace(/\*\*/g, '');
                  if (title.includes('：')) {
                    return null; // 跳过主标题
                  }
                  return (
                    <h3 key={index} className="text-xl font-semibold mt-8 mb-4 text-blue-800 border-b pb-2">
                      {title}
                    </h3>
                  );
                }
                
                // 处理分隔线
                if (line.startsWith('---')) {
                  return <hr key={index} className="my-6 border-gray-200" />;
                }

                // 处理小标题
                if (line.startsWith('- **')) {
                  const subtitle = line.replace(/- \*\*|\*\*/g, '');
                  return (
                    <h4 key={index} className="text-lg font-medium mt-4 mb-2 text-blue-700">
                      {subtitle}
                    </h4>
                  );
                }

                // 处理列表项
                if (line.startsWith('  ')) {
                  return (
                    <p key={index} className="ml-4 mb-2 text-gray-700">
                      {line.trim()}
                    </p>
                  );
                }

                // 处理普通文本
                if (line.trim()) {
                  return (
                    <p key={index} className="mb-2 text-gray-700">
                      {line.trim()}
                    </p>
                  );
                }

                return null;
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
