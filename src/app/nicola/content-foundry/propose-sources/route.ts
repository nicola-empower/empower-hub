// app/nicola/content-foundry/page.tsx
'use client';

import { useState, useCallback } from 'react';
import { Loader2, Sparkles, Check, ThumbsUp, FileText, Send } from 'lucide-react';

// Define the structure for a single source
type Source = {
  title: string;
  url: string;
  snippet: string;
};

// Define the structure for the AI's response
type AiSourceResponse = {
  sources: Source[];
};

export default function ContentFoundryPage() {
  const [topic, setTopic] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [proposedSources, setProposedSources] = useState<Source[]>([]);
  const [approvedSources, setApprovedSources] = useState<Source[]>([]);

  const handleProposeSources = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError('Please enter a topic.');
      return;
    }

    setIsSearching(true);
    setError(null);
    setProposedSources([]);
    setApprovedSources([]);

    try {
      const response = await fetch('/api/nicola/content-foundry/propose-sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'An unknown error occurred while searching for sources.');
      }

      const data: AiSourceResponse = await response.json();
      setProposedSources(data.sources);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleApproveSource = (sourceToApprove: Source) => {
    setApprovedSources(prev => [...prev, sourceToApprove]);
    setProposedSources(prev => prev.filter(s => s.url !== sourceToApprove.url));
  };

  const handleGenerateContent = () => {
    // This is where the next step will go: sending the approved sources
    // to another API endpoint to write the blog post.
    alert(`Ready to generate content from ${approvedSources.length} approved sources!`);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-12">
        <header className="text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
            Content Foundry
          </h1>
          <p className="text-gray-400 mt-2">Generate complete content packages from approved sources.</p>
        </header>

        {/* Step 1: Topic Input */}
        <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-cyan-300">Step 1: Enter a Topic</h2>
          <form onSubmit={handleProposeSources} className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., 'The future of AI in marketing'..."
              className="flex-grow bg-gray-800 text-white placeholder-gray-400 px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
              disabled={isSearching}
            />
            <button
              type="submit"
              disabled={isSearching || !topic.trim()}
              className="flex items-center justify-center gap-2 bg-cyan-600 text-white font-bold px-6 py-3 rounded-lg hover:bg-cyan-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-md"
            >
              {isSearching ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
              <span>{isSearching ? 'Finding Sources...' : 'Propose Sources'}</span>
            </button>
          </form>
          {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
        </div>

        {/* Step 2: Approve Sources */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <section>
            <h2 className="flex items-center gap-3 text-2xl font-semibold mb-6 text-cyan-300">
              <FileText /> Proposed Sources ({proposedSources.length})
            </h2>
            <div className="space-y-4">
              {isSearching && (
                <div className="flex justify-center items-center gap-4 py-8">
                  <Loader2 className="animate-spin text-cyan-400" size={24} />
                  <p className="text-gray-400">Searching the web...</p>
                </div>
              )}
              {proposedSources.map((source) => (
                <div key={source.url} className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                  <h3 className="font-bold text-white">{source.title}</h3>
                  <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 hover:underline truncate block">{source.url}</a>
                  <p className="text-sm text-gray-400 mt-2">{source.snippet}</p>
                  <button 
                    onClick={() => handleApproveSource(source)}
                    className="mt-4 w-full flex items-center justify-center gap-2 bg-green-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <ThumbsUp size={16} /> Approve
                  </button>
                </div>
              ))}
            </div>
          </section>
          
          <section>
            <h2 className="flex items-center gap-3 text-2xl font-semibold mb-6 text-green-300">
              <Check /> Approved Sources ({approvedSources.length})
            </h2>
            <div className="space-y-4 bg-green-900/20 p-4 rounded-lg border border-green-700/50">
              {approvedSources.length > 0 ? (
                approvedSources.map(source => (
                  <div key={source.url} className="bg-gray-800/80 p-3 rounded-md">
                    <p className="font-semibold text-white truncate">{source.title}</p>
                    <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 hover:underline truncate block">{source.url}</a>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">Approve sources to add them here.</p>
              )}
            </div>
            {approvedSources.length > 0 && (
              <button
                onClick={handleGenerateContent}
                className="mt-6 w-full flex items-center justify-center gap-2 bg-purple-600 text-white font-bold px-6 py-3 rounded-lg hover:bg-purple-700 transition-all duration-300 transform hover:scale-105 shadow-md"
              >
                <Send size={20} />
                Generate Content Package
              </button>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
