import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Lock, ArrowRight, Delete } from 'lucide-react';
import clsx from 'clsx';

export default function LoginScreen() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleNumberClick = (num: string) => {
    if (pin.length < 8) {
      setPin(prev => prev + num);
      setError('');
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pin.length === 0) return;

    setLoading(true);
    setError('');
    
    const success = await login(pin);
    
    if (!success) {
      setError('Invalid PIN code');
      setPin('');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 mb-4">
            <Lock className="h-8 w-8 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">PrintFlow POS</h1>
          <p className="text-slate-500 mt-2">Enter your PIN to access the system</p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <form onSubmit={handleSubmit} className="mb-8">
            <div className="flex justify-center mb-2">
              <div className="flex space-x-3 h-12">
                {[...Array(4)].map((_, i) => (
                  <div 
                    key={i} 
                    className={clsx(
                      "w-4 h-4 rounded-full border-2 transition-all duration-200 mt-4",
                      i < pin.length ? "bg-indigo-600 border-indigo-600" : "bg-transparent border-slate-300"
                    )}
                  />
                ))}
                {pin.length > 4 && [...Array(pin.length - 4)].map((_, i) => (
                  <div 
                    key={i + 4} 
                    className="w-4 h-4 rounded-full border-2 bg-indigo-600 border-indigo-600 transition-all duration-200 mt-4"
                  />
                ))}
              </div>
            </div>
            
            <div className="h-6 text-center mb-6">
              {error && <p className="text-sm text-rose-600 font-medium animate-pulse">{error}</p>}
            </div>

            <input 
              type="password" 
              value={pin} 
              onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
              className="sr-only" 
              autoFocus
            />
          </form>

          <div className="grid grid-cols-3 gap-4 max-w-[280px] mx-auto">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleNumberClick(num.toString())}
                className="h-16 rounded-xl bg-slate-50 text-2xl font-semibold text-slate-900 hover:bg-slate-100 active:bg-slate-200 transition-colors focus:outline-none"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={handleDelete}
              className="h-16 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors focus:outline-none flex items-center justify-center"
            >
              <Delete className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={() => handleNumberClick('0')}
              className="h-16 rounded-xl bg-slate-50 text-2xl font-semibold text-slate-900 hover:bg-slate-100 active:bg-slate-200 transition-colors focus:outline-none"
            >
              0
            </button>
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={pin.length === 0 || loading}
              className="h-16 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 transition-colors focus:outline-none flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowRight className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
