import React from 'react';
import { useStore } from '../store/useStore';
import { Play } from 'lucide-react';

const TerminalOutput: React.FC = () => {
  const { code, language, output, setOutput, isExecuting, setIsExecuting } = useStore();

  const handleExecute = async () => {
    setIsExecuting(true);
    setOutput('Executing...');
    
    try {
      const token = localStorage.getItem('token');
      console.log('Token:', token ? 'Present' : 'Missing');
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }
      
      const response = await fetch(`${import.meta.env.VITE_EXEC_URL || 'http://localhost:5001'}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code, language }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setOutput(data.output || (data.error ? `Error:\n${data.error}` : 'Code executed successfully. No output.'));
      } else {
        setOutput(`Execution Failed:\n${data.error}`);
      }
    } catch (error: any) {
      setOutput(`Submission Error:\n${error.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 border-l border-gray-800 text-gray-100">
      <div className="flex justify-between items-center p-3 border-b border-gray-800 bg-gray-900">
        <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-400">Terminal Output</h3>
        <button
          onClick={handleExecute}
          disabled={isExecuting}
          className={`flex items-center gap-2 px-4 py-1.5 rounded text-sm font-medium transition-colors ${
            isExecuting 
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
              : 'bg-green-600 hover:bg-green-500 text-white shadow-sm shadow-green-900/20'
          }`}
        >
          <Play size={14} fill={isExecuting ? "transparent" : "currentColor"} />
          {isExecuting ? 'Running...' : 'Run Code'}
        </button>
      </div>
      <div className="flex-1 p-4 font-mono text-sm overflow-auto whitespace-pre-wrap">
        {output || <span className="text-gray-600 italic">No output yet. Run your code to see results here.</span>}
      </div>
    </div>
  );
};

export default TerminalOutput;
