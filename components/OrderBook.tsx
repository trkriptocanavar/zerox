'use client';
import React, { useEffect, useState, useRef } from 'react';

interface OrderBookProps { price: string; symbol: string; }

export const OrderBook = ({ price, symbol }: OrderBookProps) => {
  const [activeTab, setActiveTab] = useState<'book' | 'trades'>('book');
  const [asks, setAsks] = useState<any[]>([]);
  const [bids, setBids] = useState<any[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  
  // Dinamik satır sayısı için container
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const numPrice = parseFloat(price) || 0;
    const tickSize = numPrice > 1000 ? 0.5 : 0.0001;
    const ROW_COUNT = 16; 

    const genSide = (start: number, type: 'ask' | 'bid') => 
      Array.from({ length: ROW_COUNT }).map((_, i) => ({
          p: type === 'ask' ? start + (i * tickSize) : start - (i * tickSize),
          s: (Math.random() * (numPrice > 1000 ? 2 : 1000)).toFixed(3),
          w: Math.floor(Math.random() * 90) + 5 
      }));

    setAsks(genSide(numPrice + tickSize, 'ask').reverse());
    setBids(genSide(numPrice - tickSize, 'bid'));
  }, [price, symbol]);

  // Market Trades Simülasyonu
  useEffect(() => {
      const interval = setInterval(() => {
          const numPrice = parseFloat(price) || 0;
          if(numPrice === 0) return;
          const isBuy = Math.random() > 0.5;
          const newTrade = {
              id: Date.now(),
              p: (numPrice + (Math.random() - 0.5) * (numPrice * 0.0005)).toFixed(2),
              s: (Math.random() * (numPrice > 1000 ? 0.5 : 100)).toFixed(4),
              side: isBuy ? 'Buy' : 'Sell',
              time: new Date().toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second:"2-digit" })
          };
          setTrades(prev => [newTrade, ...prev].slice(0, 40));
      }, 500);
      return () => clearInterval(interval);
  }, [price]);

  // Stiller
  const tabStyle = (isActive: boolean) => ({ 
      flex: 1, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', 
      color: isActive ? 'white' : '#71717a', fontWeight: 'bold', fontSize: '12px',
      borderBottom: isActive ? '2px solid #3b82f6' : '1px solid #27272a', 
      backgroundColor: isActive ? '#15181d' : 'transparent' 
  });
  
  const rowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', padding: '0 12px', position: 'relative', cursor: 'pointer', height:'19px', alignItems:'center' };
  const barBase: React.CSSProperties = { position: 'absolute', top: 2, right: 0, height: '15px', zIndex: 0, opacity: 0.15, borderRadius:'2px 0 0 2px' };
  
  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#0b0e11', fontSize: '11px', fontFamily: "'Inter', monospace", userSelect: 'none', overflow: 'hidden' }}>
      
      {/* HEADER (46px - Grafik ile Eşitlendi) */}
      <div style={{ height: '46px', display: 'flex', borderBottom: '1px solid #2b3139', flexShrink: 0 }}>
          <div onClick={() => setActiveTab('book')} style={tabStyle(activeTab === 'book')}>Order Book</div>
          <div onClick={() => setActiveTab('trades')} style={tabStyle(activeTab === 'trades')}>Trades</div>
      </div>

      {activeTab === 'book' ? (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', color: '#71717a', fontSize:'10px', fontWeight:'600' }}>
                <span>Price (USD)</span><span>Size ({symbol})</span>
            </div>
            
            {/* ASKS (Satışlar) */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', overflow: 'hidden' }}>
                {asks.map((o, i) => (
                <div key={i} style={rowStyle}>
                    <div style={{ ...barBase, width: `${o.w}%`, backgroundColor: '#f6465d' }}></div>
                    <span style={{ color: '#f6465d', zIndex: 1 }}>{o.p.toFixed(2)}</span>
                    <span style={{ color: '#e4e4e7', zIndex: 1 }}>{o.s}</span>
                </div>
                ))}
            </div>
            
            {/* ORTA İNDEX */}
            <div style={{ padding: '6px 12px', borderTop: '1px solid #2b3139', borderBottom: '1px solid #2b3139', backgroundColor: '#15181d', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{display:'flex', alignItems:'center', gap:'6px'}}>
                     <span style={{ fontSize: '14px', fontWeight: 'bold', color: parseFloat(price) > 0 ? '#0ecb81' : 'white' }}>{price}</span>
                     <span style={{ fontSize: '12px', transform: 'rotate(-45deg)', color:'#0ecb81'}}>➚</span>
                </div>
                <span style={{ fontSize: '10px', color: '#848e9c' }}>Mark</span>
            </div>

            {/* BIDS (Alışlar) */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {bids.map((o, i) => (
                <div key={i} style={rowStyle}>
                     <div style={{ ...barBase, width: `${o.w}%`, backgroundColor: '#0ecb81' }}></div>
                    <span style={{ color: '#0ecb81', zIndex: 1 }}>{o.p.toFixed(2)}</span>
                    <span style={{ color: '#e4e4e7', zIndex: 1 }}>{o.s}</span>
                </div>
                ))}
            </div>
          </div>
      ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', color: '#71717a', fontSize:'10px', fontWeight:'600' }}><span>Price</span><span style={{textAlign:'right'}}>Size</span><span style={{textAlign:'right'}}>Time</span></div>
             <div style={{ flex: 1, overflowY: 'auto' }}>
                {trades.map((t) => (
                    <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 12px', borderBottom:'1px solid #161a1e' }}>
                        <span style={{ color: t.side === 'Buy' ? '#0ecb81' : '#f6465d', width:'33%' }}>{t.p}</span>
                        <span style={{ color: '#e4e4e7', width:'33%', textAlign:'right' }}>{t.s}</span>
                        <span style={{ color: '#71717a', width:'33%', textAlign:'right' }}>{t.time}</span>
                    </div>
                ))}
             </div>
          </div>
      )}
    </div>
  );
};