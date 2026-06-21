import { useState } from 'react';
import { aiService } from '../api/ai';
import { type AITaskSuggestion } from '../types';

interface AITaskInputProps {
  onSuggestion: (suggestion: AITaskSuggestion) => void;
  onCancel: () => void;
}

export default function AITaskInput({ onSuggestion, onCancel }: AITaskInputProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!input.trim()) return;
    setError('');
    setLoading(true);
    try {
      const suggestion = await aiService.parseTask(input);
      onSuggestion(suggestion);
    } catch (err) {
      setError('Failed to generate task. Try rephrasing your input.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4 mb-4 border border-purple-100">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">✨</span>
        <h3 className="font-semibold text-sm text-gray-800">Describe your task in plain English</h3>
      </div>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder='e.g. "Call the client tomorrow morning, it&apos;s urgent" or "Review PR by Friday"'
        rows={2}
        className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
      />

      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}

      <div className="flex gap-2 mt-3">
        <button
          onClick={handleGenerate}
          disabled={loading || !input.trim()}
          className="flex-1 bg-purple-600 text-white py-2 rounded text-sm hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="animate-spin">⏳</span> Generating...
            </>
          ) : (
            <>✨ Generate Task</>
          )}
        </button>
        <button
          onClick={onCancel}
          className="flex-1 bg-gray-200 text-gray-800 py-2 rounded text-sm hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}