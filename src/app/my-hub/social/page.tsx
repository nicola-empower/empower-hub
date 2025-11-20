// src/app/my-hub/social/page.tsx
'use client';


import { useState, Fragment } from 'react';


// --- Main Social Genie Page Component ---
export default function SocialGeniePage() {
  const [blogContent, setBlogContent] = useState('');
  const [socialPost, setSocialPost] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedMessage, setCopiedMessage] = useState('');


  // Function to copy the generated text to the clipboard
  const copyToClipboard = () => {
    if (socialPost) {
      const el = document.createElement('textarea');
      el.value = socialPost;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
     
      setCopiedMessage('Copied to clipboard!');
      setTimeout(() => setCopiedMessage(''), 2000);
    }
  };


  // Function to handle fetching the generated social media post
  const generatePost = async () => {
    if (!blogContent) {
      setError("Please paste some blog content first!");
      return;
    }


    setIsLoading(true);
    setError(null);
    setSocialPost('');


    const prompt = `You are a professional virtual assistant social media expert. Your task is to write a short, engaging social media post (e.g., for LinkedIn, Facebook, or Instagram) based on the following blog post content. The post should be friendly, professional, and include a clear call to action. Do not include hashtags. Keep it under 250 characters. Here is the blog post content: \n\n${blogContent}`;


    let chatHistory = [];
    chatHistory.push({ role: "user", parts: [{ text: prompt }] });
    const payload = { contents: chatHistory };
   
    // --- FIX: Read the API key from environment variables ---
    // Make sure you have NEXT_PUBLIC_GEMINI_KEY="YOUR_KEY" in your .env.local file
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_KEY || "";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;


    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });


      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData?.error?.message || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }


      const result = await response.json();
      if (result.candidates && result.candidates[0]?.content?.parts?.[0]) {
        const text = result.candidates[0].content.parts[0].text;
        setSocialPost(text);
      } else {
        const finishReason = result.candidates?.[0]?.finishReason;
        if (finishReason === 'SAFETY') {
          setError("Content could not be generated due to safety settings. Please adjust your input.");
        } else {
          setError("Failed to generate content. The API returned an empty response.");
        }
      }
    } catch (e: any) {
      console.error("API call failed:", e);
      setError(`Failed to connect to the API: ${e.message}. Please try again later.`);
    }
    setIsLoading(false);
  };


  return (
    <Fragment>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Social Media Genie</h1>
        <p className="text-lg text-gray-600 mt-1">Generate a short, engaging social media post from your blog content.</p>
      </header>


      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
        {/* Input Area */}
        <div className="mb-6">
          <label htmlFor="blogContent" className="block text-sm font-medium text-gray-700 mb-2">
            Blog Post Content
          </label>
          <textarea
            id="blogContent"
            rows={8}
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Paste your blog post content here..."
            value={blogContent}
            onChange={(e) => setBlogContent(e.target.value)}
          ></textarea>
        </div>


        {/* Action Button */}
        <div className="flex justify-center mb-6">
          <button
            onClick={generatePost}
            disabled={isLoading}
            className={`w-full sm:w-auto px-6 py-3 rounded-lg text-white font-bold shadow-lg transition-all duration-300 transform ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700 hover:scale-105'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </span>
            ) : (
              'Generate Social Media Post'
            )}
          </button>
        </div>


        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg relative mb-6" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline ml-2">{error}</span>
          </div>
        )}


        {/* Output Area */}
        {socialPost && (
          <div className="relative p-6 bg-gray-50 border border-gray-200 rounded-lg shadow-inner">
            <label htmlFor="socialPostOutput" className="block text-sm font-medium text-gray-700 mb-2">
              Generated Post
            </label>
            <textarea
              id="socialPostOutput"
              rows={5}
              className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:outline-none"
              readOnly
              value={socialPost}
            ></textarea>
            <div className="flex justify-end items-center mt-4">
              {copiedMessage && <span className="text-sm text-purple-700 mr-4">{copiedMessage}</span>}
              <button
                onClick={copyToClipboard}
                className="px-5 py-2 bg-emerald-600 text-white rounded-lg font-semibold shadow-md hover:bg-emerald-700 transition-colors"
              >
                Copy to Clipboard
              </button>
            </div>
          </div>
        )}
      </div>
    </Fragment>
  );
};



