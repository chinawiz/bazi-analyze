'use client';

import { useState } from 'react';

// 定义使用信息的接口
interface UsageInfo {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

export default function Home() {
  // 状态管理
  const [gender, setGender] = useState<string>('男');
  const [birthplace, setBirthplace] = useState<string>('');
  const [birthdate, setBirthdate] = useState<string>('');
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [usageInfo, setUsageInfo] = useState<UsageInfo | null>(null);

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult('');
    setUsageInfo(null);

    try {
      console.log('发送请求数据:', { gender, birthplace, birthdate });
      
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gender,
          birthplace,
          birthdate,
        }),
      });

      console.log('服务器响应状态:', response.status);
      
      let data;
      try {
        const text = await response.text();
        console.log('服务器原始响应:', text);
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('JSON解析错误:', parseError);
        throw new Error('服务器返回的数据格式无效');
      }

      if (!response.ok) {
        throw new Error(data.error || data.details || `请求失败 (${response.status})`);
      }

      if (!data.result) {
        console.error('无效的响应数据:', data);
        throw new Error('服务器返回的数据缺少分析结果');
      }

      setResult(data.result);
      if (data.usage) {
        setUsageInfo(data.usage);
      }
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
            <h2 className="text-xl font-semibold mb-4 text-gray-800">分析结果</h2>
            {usageInfo && (
              <div className="mb-4 text-sm text-gray-500">
                消耗令牌: {usageInfo.total_tokens || '未知'}
              </div>
            )}
            <div className="prose max-w-none">
              {result.split('\n').map((line, index) => (
                <p key={index} className="mb-2">
                  {line}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
