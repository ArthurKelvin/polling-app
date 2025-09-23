'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { debugQRCodeGeneration } from '@/lib/qr/debug';

export default function TestQRPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testQRGeneration = async () => {
    setIsLoading(true);
    setLogs([]);
    
    try {
      addLog('Starting QR code generation test...');
      const testUrl = 'https://example.com/test-poll';
      
      const result = await debugQRCodeGeneration(testUrl);
      
      addLog('Test completed successfully!');
      addLog(`First generation: ${result.firstResult.fromCache ? 'from cache' : 'generated'}`);
      addLog(`Second generation: ${result.secondResult.fromCache ? 'from cache' : 'generated'}`);
      addLog(`Third generation: ${result.thirdResult.fromCache ? 'from cache' : 'generated'}`);
      
    } catch (error) {
      addLog(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">QR Code Generation Test</h1>
      
      <Button 
        onClick={testQRGeneration} 
        disabled={isLoading}
        className="mb-4"
      >
        {isLoading ? 'Testing...' : 'Test QR Generation'}
      </Button>
      
      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="font-semibold mb-2">Test Logs:</h2>
        <div className="space-y-1">
          {logs.map((log, index) => (
            <div key={index} className="text-sm font-mono">
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
