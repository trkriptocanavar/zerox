'use client';
import React, { useState, useEffect } from 'react';

interface TradingPanelProps {
  currentPrice: string;
  balance: number;
  symbol: string; // <--- BU SATIR EKLENDİ (Artık sembolü tanıyor)
  onOrder: (side: 'Long' | 'Short', size: number, leverage: number, type: 'Limit' | 'Market', limitPrice?: string, tp?: string, sl?: string) => void;
}

export const TradingPanel = ({ currentPrice, balance, symbol, onOrder }: TradingPanelProps) => {
  const [side, setSide] = useState<'Long' | 'Short'>('Long');
  const [orderType, setOrderType] = useState<'Limit' | 'Market'>('Limit');
  const [price, setPrice] = useState<string>(''); 
  const [size, setSize] = useState<string>('');
  const [leverage, setLeverage] = useState<number>(20);
  const [cost, setCost] = useState<number>(0);
  
  // TP/SL State
  const [tp, setTp] = useState<string>('');
  const [sl, setSl] = useState<string>('');

  // Fiyat Takibi
  useEffect(() => {
    if (orderType === 'Market') {
        setPrice(currentPrice);
    } else if (!price && currentPrice !== '0.00') {
        setPrice(currentPrice);
    }
  }, [currentPrice, orderType]);

  // Maliyet Hesapla
  useEffect(() => {
    const p = parseFloat(price) || 0;
    const s = parseFloat(size) || 0;
    if (p > 0 && s > 0) {
        setCost((p * s) / leverage);
    } else {
        setCost(0);
    }
  }, [price, size, leverage]);

  const handleSlider = (percent: number) => {
      const p = parseFloat(price) || parseFloat(currentPrice) || 0;
      if (p === 0) return;
      const maxSize = (balance * leverage) / p;
      const targetSize = maxSize * (percent / 100);
      setSize((targetSize * 0.99).toFixed(4));
  };

  const handleSubmit = () => {
      if (cost > balance) return alert("Insufficient Balance!");
      if (parseFloat(size) <= 0) return alert("Enter a valid size!");
      onOrder(side, parseFloat(size), leverage, orderType, price, tp, sl);
  };

  const themeColor = side === 'Long' ? '#10b981' : '#ef4444';
  
  // Stiller
  const containerStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#0b0e11', color: '#d1d4dc', fontFamily: 'sans-serif', borderLeft: '1px solid #2b3139' };
  const inputGroupStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' };
  const inputWrapperStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '6px', padding: '0 12px', height: '40px', transition: 'border 0.2s' };
  const inputStyle: React.CSSProperties = { backgroundColor: 'transparent', border: 'none', outline: 'none', color: 'white', width: '100%', textAlign: 'right', fontSize: '14px', fontFamily: 'monospace', fontWeight: 'bold' };
  const tabStyle = (isActive: boolean, isBuy: boolean) => ({
      flex: 1, padding: '10px', cursor: 'pointer', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '13px', transition: 'all 0.2s',
      backgroundColor: isActive ? (isBuy ? '#10b981' : '#ef4444') : 'transparent',
      color: isActive ? 'white' : '#71717a',
      boxShadow: isActive ? (isBuy ? '0 4px 12px rgba(16, 185, 129, 0.2)' : '0 4px 12px rgba(239, 68, 68, 0.2)') : 'none'
  });

  return (
    <div style={containerStyle}>
       <div style={{ padding: '12px 16px', borderBottom: '1px solid #2b3139', display: 'flex', gap: '8px' }}>
          <button style={{ flex: 1, backgroundColor: '#18181b', border: '1px solid #27272a', padding: '6px', borderRadius: '4px', color: '#a1a1aa', fontSize: '11px', cursor: 'pointer' }}>Cross</button>
          <div style={{ flex: 1, display: 'flex', backgroundColor: '#18181b', borderRadius: '4px', border: '1px solid #27272a', overflow: 'hidden' }}>
             {[10, 20, 50].map(lev => (
                 <button key={lev} onClick={() => setLeverage(lev)} style={{ flex: 1, border: 'none', background: leverage === lev ? '#27272a' : 'transparent', color: leverage === lev ? 'white' : '#71717a', fontSize: '10px', cursor: 'pointer' }}>{lev}x</button>
             ))}
          </div>
       </div>

       <div style={{ padding: '16px', flex: 1, overflowY: 'auto' }}>
          <div style={{ display: 'flex', backgroundColor: '#18181b', padding: '4px', borderRadius: '8px', marginBottom: '16px' }}>
             <button onClick={() => setSide('Long')} style={tabStyle(side === 'Long', true)}>Buy / Long</button>
             <button onClick={() => setSide('Short')} style={tabStyle(side === 'Short', false)}>Sell / Short</button>
          </div>

          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', fontSize: '12px', fontWeight: '600' }}>
             <button onClick={() => setOrderType('Limit')} style={{ border: 'none', background: 'transparent', color: orderType === 'Limit' ? '#3b82f6' : '#71717a', cursor: 'pointer' }}>Limit</button>
             <button onClick={() => setOrderType('Market')} style={{ border: 'none', background: 'transparent', color: orderType === 'Market' ? '#3b82f6' : '#71717a', cursor: 'pointer' }}>Market</button>
          </div>

          <div style={inputGroupStyle}>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <label style={{ fontSize: '11px', color: '#a1a1aa' }}>Price</label>
                {orderType === 'Limit' && <span onClick={() => setPrice(currentPrice)} style={{ fontSize: '11px', color: '#3b82f6', cursor: 'pointer', textDecoration: 'underline' }}>Last</span>}
             </div>
             <div style={{ ...inputWrapperStyle, opacity: orderType === 'Market' ? 0.5 : 1 }}>
                <input type="number" style={inputStyle} value={orderType === 'Market' ? 'Market Price' : price} onChange={(e) => setPrice(e.target.value)} disabled={orderType === 'Market'} />
                <span style={{ fontSize: '12px', color: '#71717a', marginLeft: '8px' }}>USD</span>
             </div>
          </div>

          <div style={inputGroupStyle}>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <label style={{ fontSize: '11px', color: '#a1a1aa' }}>Size</label>
                <span style={{ fontSize: '11px', color: '#a1a1aa' }}>Max: {(balance * leverage / (parseFloat(price)||1)).toFixed(2)} {symbol}</span>
             </div>
             <div style={inputWrapperStyle}>
                <input type="number" style={inputStyle} placeholder="0.00" value={size} onChange={(e) => setSize(e.target.value)} />
                <span style={{ fontSize: '12px', color: '#71717a', marginLeft: '8px' }}>{symbol}</span>
             </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
             <div style={{ flex: 1 }}>
                <label style={{ fontSize: '10px', color: '#a1a1aa', marginBottom: '4px', display: 'block' }}>Take Profit</label>
                <div style={{ ...inputWrapperStyle, height: '36px' }}>
                    <input type="number" placeholder="Optional" style={inputStyle} value={tp} onChange={e => setTp(e.target.value)} />
                </div>
             </div>
             <div style={{ flex: 1 }}>
                <label style={{ fontSize: '10px', color: '#a1a1aa', marginBottom: '4px', display: 'block' }}>Stop Loss</label>
                <div style={{ ...inputWrapperStyle, height: '36px' }}>
                    <input type="number" placeholder="Optional" style={inputStyle} value={sl} onChange={e => setSl(e.target.value)} />
                </div>
             </div>
          </div>

          <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
             {[25, 50, 75, 100].map(pct => (
                <button key={pct} onClick={() => handleSlider(pct)} style={{ flex: 1, backgroundColor: '#18181b', border: '1px solid #27272a', color: '#a1a1aa', fontSize: '10px', padding: '4px', borderRadius: '4px', cursor: 'pointer' }}>{pct}%</button>
             ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px', backgroundColor: '#18181b', borderRadius: '8px', border: '1px solid #27272a', marginBottom: '16px' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: '#a1a1aa' }}>Cost</span><span style={{ color: 'white', fontWeight: 'bold' }}>{cost.toFixed(2)} USD</span>
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: '#a1a1aa' }}>Available</span><span style={{ color: 'white' }}>{balance.toLocaleString()} USD</span>
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                 <span style={{ color: '#a1a1aa' }}>Liq. Price</span>
                 <span style={{ color: '#fb923c' }}>
                    {price ? (side === 'Long' ? (parseFloat(price) * (1 - 1/leverage)).toFixed(2) : (parseFloat(price) * (1 + 1/leverage)).toFixed(2)) : '-'}
                 </span>
             </div>
          </div>

          <button 
            onClick={handleSubmit}
            style={{ width: '100%', padding: '14px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', color: 'white', backgroundColor: themeColor, boxShadow: `0 4px 20px ${side === 'Long' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`, transition: 'transform 0.1s' }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
             {/* ARTIK HATA VERMEZ ÇÜNKÜ SYMBOL PROPS GELİYOR */}
             {side === 'Long' ? 'Buy / Long' : 'Sell / Short'} {symbol}
          </button>
       </div>
    </div>
  );
};