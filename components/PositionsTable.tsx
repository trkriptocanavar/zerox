'use client';
import React from 'react';

// Pozisyon veri tipi
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
}

interface PositionsTableProps {
  positions: Position[]; // Dışarıdan veri alacak
}

export const PositionsTable = ({ positions }: PositionsTableProps) => {
  const thStyle: React.CSSProperties = { padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#71717a', borderBottom: '1px solid #27272a' };
  const tdStyle: React.CSSProperties = { padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#e4e4e7', borderBottom: '1px solid #27272a' };

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
        <thead>
          <tr style={{ backgroundColor: '#09090b' }}>
            <th style={thStyle}>Symbol</th>
            <th style={thStyle}>Side</th>
            <th style={thStyle}>Size</th>
            <th style={thStyle}>Lev.</th>
            <th style={thStyle}>Entry Price</th>
            <th style={thStyle}>Mark Price</th>
            <th style={thStyle}>Liq. Price</th>
            <th style={{...thStyle, textAlign: 'right'}}>PnL (Est.)</th>
            <th style={{...thStyle, textAlign: 'right'}}>Action</th>
          </tr>
        </thead>
        <tbody>
          {positions.length === 0 ? (
            <tr>
              <td colSpan={9} style={{ padding: '32px', textAlign: 'center', color: '#71717a', fontSize: '13px' }}>
                No open positions. Go trade! 🚀
              </td>
            </tr>
          ) : (
            positions.map((pos) => (
              <tr key={pos.id} style={{ backgroundColor: 'transparent' }}>
                <td style={{...tdStyle, fontWeight: 'bold'}}>{pos.symbol}</td>
                <td style={{...tdStyle, color: pos.side === 'Long' ? '#10b981' : '#ef4444'}}>{pos.side}</td>
                <td style={tdStyle}>{pos.size}</td>
                <td style={{...tdStyle, color: '#fbbf24'}}>{pos.lev}x</td>
                <td style={tdStyle}>{pos.entry.toLocaleString()}</td>
                <td style={tdStyle}>{pos.mark.toLocaleString()}</td>
                <td style={{...tdStyle, color: '#fb923c'}}>{pos.liq.toLocaleString()}</td>
                <td style={{...tdStyle, textAlign: 'right', color: pos.pnl >= 0 ? '#10b981' : '#ef4444'}}>
                  {pos.pnl >= 0 ? '+' : ''}{pos.pnl.toFixed(2)}
                </td>
                <td style={{...tdStyle, textAlign: 'right'}}>
                  <button style={{ padding: '4px 12px', fontSize: '11px', backgroundColor: '#27272a', color: 'white', border: '1px solid #3f3f46', borderRadius: '4px', cursor: 'pointer' }}>Close</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};