'use client';
import React, { useState } from 'react';

export interface Position {
  id: number;
  symbol: string;
  side: 'Long' | 'Short';
  size: string;
  lev: number;
  entry: number;
  mark: number;
  liq: number;
  pnl: number;
  tp?: number;
  sl?: number;
}

export interface Order {
  id: number;
  symbol: string;
  side: 'Long' | 'Short';
  size: string;
  type: 'Limit' | 'Market';
  price: number;
  filled: string;
  status: 'Open';
  leverage?: number;
}

export interface TradeHistory {
    id: number;
    symbol: string;
    side: 'Long' | 'Short';
    size: string;
    entryPrice: number;
    exitPrice: number;
    pnl: number;
    closedAt: string;
}

interface TradeBottomPanelProps {
  positions: Position[];
  orders: Order[];
  history: TradeHistory[];
  onClosePosition: (id: number) => void;
  onCancelOrder: (id: number) => void;
}

export const TradeBottomPanel = ({ positions, orders, history, onClosePosition, onCancelOrder }: TradeBottomPanelProps) => {
  const [activeTab, setActiveTab] = useState<'positions' | 'orders' | 'history'>('positions');

  // Stiller
  const thStyle: React.CSSProperties = { padding: '10px 16px', textAlign: 'left', fontSize: '11px', color: '#71717a', borderBottom: '1px solid #27272a', fontWeight: 600, textTransform: 'uppercase' };
  const tdStyle: React.CSSProperties = { padding: '10px 16px', textAlign: 'left', fontSize: '13px', color: '#e4e4e7', borderBottom: '1px solid #27272a' };
  
  const tabBtnStyle = (tabName: string) => ({
    padding: '10px 20px', fontSize: '13px', fontWeight: 'bold', 
    color: activeTab === tabName ? '#3b82f6' : '#71717a',
    borderBottom: activeTab === tabName ? '2px solid #3b82f6' : '2px solid transparent', 
    background: 'transparent', borderTop: 'none', borderLeft: 'none', borderRight: 'none', cursor: 'pointer', transition: 'all 0.2s'
  });

  // Renk Yardımcıları
  const getSideColor = (side: string) => side === 'Long' ? '#0ecb81' : '#f6465d';
  const getPnlColor = (pnl: number) => pnl >= 0 ? '#0ecb81' : '#f6465d';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#09090b' }}>
      
      {/* TAB MENÜSÜ */}
      <div style={{ display: 'flex', borderBottom: '1px solid #27272a', backgroundColor: '#18181b' }}>
         <button onClick={() => setActiveTab('positions')} style={tabBtnStyle('positions')}>Positions ({positions.length})</button>
         <button onClick={() => setActiveTab('orders')} style={tabBtnStyle('orders')}>Open Orders ({orders.length})</button>
         <button onClick={() => setActiveTab('history')} style={tabBtnStyle('history')}>History</button>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        
        {/* 1. POSITIONS TABLOSU */}
        {activeTab === 'positions' && (
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr style={{ backgroundColor: '#09090b' }}>
                <th style={thStyle}>Symbol</th><th style={thStyle}>Side</th><th style={thStyle}>Size</th><th style={thStyle}>Lev.</th><th style={thStyle}>Entry Price</th><th style={thStyle}>Mark Price</th><th style={thStyle}>Liq. Price</th><th style={{...thStyle, textAlign: 'right'}}>PnL (Est.)</th><th style={{...thStyle, textAlign: 'right'}}>Action</th>
              </tr>
            </thead>
            <tbody>
              {positions.length === 0 ? (
                <tr><td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#52525b', fontSize:'13px' }}>No open positions.</td></tr>
              ) : (
                // KEY GÜNCELLENDİ: id + index
                positions.map((pos, index) => (
                  <tr key={`${pos.id}-${index}`} style={{ backgroundColor: 'transparent', transition: 'background 0.2s' }}>
                    <td style={{...tdStyle, fontWeight: 'bold'}}>{pos.symbol}</td>
                    <td style={{...tdStyle, color: getSideColor(pos.side)}}>{pos.side}</td>
                    <td style={tdStyle}>{pos.size}</td>
                    <td style={{...tdStyle, color: '#fbbf24'}}>{pos.lev}x</td>
                    <td style={tdStyle}>${pos.entry.toLocaleString()}</td>
                    <td style={tdStyle}>${pos.mark.toLocaleString()}</td>
                    <td style={{...tdStyle, color: '#fb923c'}}>${pos.liq.toLocaleString()}</td>
                    <td style={{...tdStyle, textAlign: 'right', color: getPnlColor(pos.pnl), fontWeight: 'bold'}}>
                      {pos.pnl >= 0 ? '+' : ''}{pos.pnl.toFixed(2)}
                    </td>
                    <td style={{...tdStyle, textAlign: 'right'}}>
                      <button onClick={() => onClosePosition(pos.id)} style={{ padding: '4px 10px', fontSize: '11px', backgroundColor: '#27272a', color: 'white', border: '1px solid #3f3f46', borderRadius: '4px', cursor: 'pointer' }}>Close</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {/* 2. OPEN ORDERS TABLOSU */}
        {activeTab === 'orders' && (
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr style={{ backgroundColor: '#09090b' }}>
                <th style={thStyle}>Time</th><th style={thStyle}>Symbol</th><th style={thStyle}>Type</th><th style={thStyle}>Side</th><th style={thStyle}>Price</th><th style={thStyle}>Amount</th><th style={{...thStyle, textAlign: 'right'}}>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (<tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#52525b', fontSize:'13px' }}>No open orders.</td></tr>) : (
                // KEY GÜNCELLENDİ: id + index
                orders.map((order, index) => (
                  <tr key={`${order.id}-${index}`}>
                     <td style={tdStyle}>{new Date(order.id).toLocaleTimeString()}</td>
                     <td style={{...tdStyle, fontWeight: 'bold'}}>{order.symbol}</td>
                     <td style={tdStyle}>{order.type} <span style={{color:'#71717a', fontSize:'10px'}}>({order.leverage || 20}x)</span></td>
                     <td style={{...tdStyle, color: getSideColor(order.side)}}>{order.side}</td>
                     <td style={tdStyle}>${order.price.toLocaleString()}</td>
                     <td style={tdStyle}>{order.size}</td>
                     <td style={{...tdStyle, textAlign: 'right'}}>
                        <button onClick={() => onCancelOrder(order.id)} style={{ padding: '4px 10px', fontSize: '11px', backgroundColor: '#7f1d1d', color: '#fca5a5', border: '1px solid #991b1b', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                     </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {/* 3. HISTORY TABLOSU */}
        {activeTab === 'history' && (
             <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
             <thead>
               <tr style={{ backgroundColor: '#09090b' }}>
                 <th style={thStyle}>Time</th><th style={thStyle}>Symbol</th><th style={thStyle}>Side</th><th style={thStyle}>Size</th><th style={thStyle}>Entry</th><th style={thStyle}>Exit</th><th style={{...thStyle, textAlign: 'right'}}>Realized PnL</th>
               </tr>
             </thead>
             <tbody>
               {history.length === 0 ? (<tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#52525b', fontSize:'13px' }}>No trade history.</td></tr>) : (
                 // KEY GÜNCELLENDİ: id + index (En kritik yer burasıydı)
                 history.map((trade, index) => (
                   <tr key={`${trade.id}-${index}`}>
                      <td style={tdStyle}>{trade.closedAt}</td>
                      <td style={{...tdStyle, fontWeight: 'bold'}}>{trade.symbol}</td>
                      <td style={{...tdStyle, color: getSideColor(trade.side)}}>{trade.side}</td>
                      <td style={tdStyle}>{trade.size}</td>
                      <td style={tdStyle}>${trade.entryPrice.toLocaleString()}</td>
                      <td style={tdStyle}>${trade.exitPrice.toLocaleString()}</td>
                      <td style={{...tdStyle, textAlign: 'right', fontWeight: 'bold', color: getPnlColor(trade.pnl)}}>
                        {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)} USD
                      </td>
                   </tr>
                 ))
               )}
             </tbody>
           </table>
        )}
      </div>
    </div>
  );
};