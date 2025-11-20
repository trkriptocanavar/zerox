'use client';
import React, { useState } from 'react';

interface TransferModalProps {
  isOpen: boolean; onClose: () => void; type: 'Deposit' | 'Withdraw'; balance: number; walletBalance: number; onConfirm: (amount: number) => void;
}

export const TransferModal = ({ isOpen, onClose, type, balance, walletBalance, onConfirm }: TransferModalProps) => {
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  if (!isOpen) return null;

  const handleConfirm = () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) return alert("Invalid amount");
    if (type === 'Deposit' && val > walletBalance) return alert("Insufficient Wallet Balance!");
    if (type === 'Withdraw' && val > balance) return alert("Insufficient Exchange Balance!");
    setIsLoading(true);
    setTimeout(() => { onConfirm(val); setIsLoading(false); setAmount(''); onClose(); }, 1000);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 200, display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={onClose}>
      <div style={{ width: '400px', backgroundColor: '#18181b', borderRadius: '16px', border: '1px solid #27272a', padding: '24px' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ color: 'white', marginBottom: '20px' }}>{type} USDC</h2>
        <input type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ width: '100%', padding: '12px', backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '8px', color: 'white', fontSize: '18px', marginBottom: '20px' }} />
        <button onClick={handleConfirm} disabled={isLoading} style={{ width: '100%', padding: '14px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', opacity: isLoading?0.7:1 }}>{isLoading ? 'Processing...' : 'Confirm'}</button>
      </div>
    </div>
  );
};