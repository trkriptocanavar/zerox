'use client';
import React, { useState, useEffect } from 'react';
// --- BİLEŞENLER ---
import { PriceChart } from "@/components/PriceChart";
import { OrderBook } from "@/components/OrderBook";
import { TradingPanel } from "@/components/TradingPanel";
import { TradeBottomPanel, Position, Order, TradeHistory } from "@/components/TradeBottomPanel"; 
import { TokenSelector } from "@/components/TokenSelector";
import { SettingsModal } from "@/components/SettingsModal"; 
import { PortfolioChart } from "@/components/PortfolioChart"; 
import { TransferModal } from "@/components/TransferModal";
// --- CÜZDAN & ARAÇLAR ---
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useSignMessage } from 'wagmi';
import { toast } from 'sonner';

// --- MOCK DATA ---
const LEADERBOARD_DATA = [
  { rank: 1, user: '0x71...9A23', points: 1540200, volume: 45200000 },
  { rank: 2, user: '0x3C...B112', points: 1200500, volume: 38100000 },
  { rank: 3, user: '0xAA...44FF', points: 980000, volume: 22500000 },
  { rank: 4, user: '0x11...2233', points: 850400, volume: 18900000 },
  { rank: 5, user: '0xBB...CCDD', points: 720100, volume: 15200000 },
];

export default function Home() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  // --- UI STATE ---
  const [activeTab, setActiveTab] = useState('Trade'); 
  const [symbol, setSymbol] = useState('ETH'); 
  const [displayName, setDisplayName] = useState('ETH-USD');
  const [currentPrice, setCurrentPrice] = useState<string>('0.00'); 
  
  // MODALLAR
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [transferModal, setTransferModal] = useState<{ isOpen: boolean; type: 'Deposit' | 'Withdraw' }>({ isOpen: false, type: 'Deposit' });
  
  // SİSTEM
  const [isMinting, setIsMinting] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // MOBİL & GRAFİK
  const [mobileView, setMobileView] = useState<'Chart' | 'Book' | 'Trade'>('Chart');
  const [isMobile, setIsMobile] = useState(false);
  const [interval, setInterval] = useState('15m'); 

  // AYARLAR
  const [slippage, setSlippage] = useState(0.5);
  const [isPrivacyMode, setPrivacyMode] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);

  // --- DATA STATE (PERSISTENT) ---
  const [usdcBalance, setUsdcBalance] = useState(0); 
  const [walletUsdc, setWalletUsdc] = useState(5000); 
  const [positions, setPositions] = useState<Position[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [history, setHistory] = useState<TradeHistory[]>([]);
  const [userPoints, setUserPoints] = useState(0);
  const [userVolume, setUserVolume] = useState(0);

  useEffect(() => {
      const checkMobile = () => setIsMobile(window.innerWidth < 1024);
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // LOAD
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const load = (key: string, setter: any, isJson = false) => {
        const item = localStorage.getItem(key);
        if (item) setter(isJson ? JSON.parse(item) : parseFloat(item));
      };
      load('usdcBalance', setUsdcBalance);
      load('walletUsdc', setWalletUsdc);
      load('positions', setPositions, true);
      load('orders', setOrders, true);
      load('history', setHistory, true);
      load('userPoints', setUserPoints);
      load('userVolume', setUserVolume);
      setIsLoaded(true);
    }
  }, []);

  // SAVE
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('usdcBalance', usdcBalance.toString());
      localStorage.setItem('walletUsdc', walletUsdc.toString());
      localStorage.setItem('positions', JSON.stringify(positions));
      localStorage.setItem('orders', JSON.stringify(orders));
      localStorage.setItem('history', JSON.stringify(history));
      localStorage.setItem('userPoints', userPoints.toString());
      localStorage.setItem('userVolume', userVolume.toString());
    }
  }, [usdcBalance, walletUsdc, positions, orders, history, userPoints, userVolume, isLoaded]);

  // HESAPLAMALAR
  const totalUnrealizedPnL = positions.reduce((acc, pos) => acc + pos.pnl, 0);
  const totalEquity = usdcBalance + totalUnrealizedPnL;
  const marginUsage = positions.reduce((acc, pos) => acc + ((pos.entry * parseFloat(pos.size.split(' ')[0]))/pos.lev), 0);
  const marginPercent = totalEquity > 0 ? (marginUsage / totalEquity) * 100 : 0;

  // ENGINE & WEBSOCKET
  useEffect(() => {
     const ws = new WebSocket('wss://api.hyperliquid.xyz/ws');
     ws.onopen = () => ws.send(JSON.stringify({ "method": "subscribe", "subscription": { "type": "allMids" } }));
     
     ws.onmessage = (event) => {
         try {
             const msg = JSON.parse(event.data);
             if (msg.channel === 'allMids') {
                 const newPriceStr = msg.data.mids[symbol];
                 if (newPriceStr) {
                    const newPrice = parseFloat(newPriceStr);
                    setCurrentPrice(newPrice.toFixed(2));
                    
                    // TITLE GÜNCELLEME (ZeroX)
                    document.title = isPrivacyMode ? 'ZeroX' : `$${newPrice.toFixed(2)} ${symbol} | ZeroX`;
                    
                    setPositions(prev => {
                        const nextPositions: Position[] = [];
                        let liquidationOccurred = false;
                        let triggerOccurred = false;

                        prev.forEach(pos => {
                            const sizeNum = parseFloat(pos.size.split(' ')[0]);
                            const rawPnL = pos.side === 'Long' 
                                ? (newPrice - pos.entry) * sizeNum 
                                : (pos.entry - newPrice) * sizeNum;
                            
                            let closedType = null;
                            if (pos.tp && ((pos.side === 'Long' && newPrice >= pos.tp) || (pos.side === 'Short' && newPrice <= pos.tp))) closedType = 'Take Profit';
                            if (pos.sl && ((pos.side === 'Long' && newPrice <= pos.sl) || (pos.side === 'Short' && newPrice >= pos.sl))) closedType = 'Stop Loss';
                            if ((pos.side === 'Long' && newPrice <= pos.liq) || (pos.side === 'Short' && newPrice >= pos.liq)) closedType = 'LIQUIDATION';

                            if (closedType) {
                                const margin = (pos.entry * sizeNum) / pos.lev;
                                if (closedType !== 'LIQUIDATION') {
                                    setUsdcBalance(b => b + margin + rawPnL);
                                    triggerOccurred = true;
                                } else {
                                    liquidationOccurred = true;
                                }

                                const newHistory: TradeHistory = {
                                    id: Date.now() + Math.floor(Math.random() * 100000), 
                                    symbol: pos.symbol, side: pos.side, size: pos.size,
                                    entryPrice: pos.entry, exitPrice: newPrice, pnl: closedType === 'LIQUIDATION' ? -margin : rawPnL,
                                    closedAt: new Date().toLocaleTimeString() + ` (${closedType})`
                                };
                                setHistory(h => [newHistory, ...h]);
                            } else {
                                nextPositions.push({ ...pos, mark: newPrice, pnl: rawPnL });
                            }
                        });
                        
                        if (liquidationOccurred) toast.error("Position Liquidated!");
                        if (triggerOccurred && audioEnabled) toast.success("TP/SL Executed");
                        
                        return nextPositions;
                    });

                    // LİMİT EMİR KONTROLÜ
                    setOrders(prev => {
                        const remainingOrders: Order[] = [];
                        let filledCount = 0;
                        prev.forEach(order => {
                            let filled = false;
                            if (order.side === 'Long' && newPrice <= order.price) filled = true;
                            if (order.side === 'Short' && newPrice >= order.price) filled = true;

                            if (filled) {
                                filledCount++;
                                const leverage = order.leverage || 20;
                                const sizeNum = parseFloat(order.size.split(' ')[0]);
                                const cost = (order.price * sizeNum) / leverage;
                                const liqPrice = order.side === 'Long' ? order.price * (1 - 1/leverage) : order.price * (1 + 1/leverage);

                                const newPos: Position = {
                                    id: Date.now() + Math.random(), symbol: order.symbol, side: order.side, size: order.size, lev: leverage,
                                    entry: order.price, mark: newPrice, liq: liqPrice, pnl: -cost * 0.001
                                };
                                setPositions(p => [newPos, ...p]);
                            } else {
                                remainingOrders.push(order);
                            }
                        });
                        if (filledCount > 0 && audioEnabled) toast.success(`${filledCount} Limit Order(s) Filled!`);
                        return remainingOrders;
                    });
                 }
             }
         } catch (e) {}
     };
     return () => { if (ws.readyState === 1) ws.close(); };
  }, [symbol, isPrivacyMode, audioEnabled]);

  // --- ACTIONS ---
  const handleTransfer = (amount: number) => {
      if (transferModal.type === 'Deposit') {
          setWalletUsdc(prev => prev - amount);
          setUsdcBalance(prev => prev + amount);
          toast.success(`Deposited ${amount} USDC`);
      } else {
          setUsdcBalance(prev => prev - amount);
          setWalletUsdc(prev => prev + amount);
          toast.success(`Withdrew ${amount} USDC`);
      }
  };

  const handleFaucetClaim = async () => {
    if (!isConnected) return toast.error("Wallet not connected");
    setIsMinting(true);
    try {
        await signMessageAsync({ message: `ZeroX Faucet\nRequest: 1,000 USDC\nWallet: ${address}` });
        setTimeout(() => {
            setWalletUsdc(prev => prev + 1000);
            toast.success("Faucet Successful", { description: "1,000 USDC added to Wallet (Deposit via Portfolio)" });
            setIsMinting(false);
        }, 1500);
    } catch (error) { setIsMinting(false); toast.error("Request Cancelled"); }
  };

  const handleOrder = (side: 'Long' | 'Short', size: number, leverage: number, type: 'Limit' | 'Market', limitPrice?: string, tp?: string, sl?: string) => {
      if (!isConnected) return toast.error("Connect Wallet first!");
      const execPrice = type === 'Market' ? parseFloat(currentPrice) : parseFloat(limitPrice || currentPrice);
      const cost = (execPrice * size) / leverage;

      if (cost > usdcBalance) return toast.error("Insufficient Exchange Balance", { description: "Please Deposit funds in Portfolio." });

      setUsdcBalance(prev => prev - cost);
      setUserPoints(prev => prev + Math.floor(execPrice * size));
      setUserVolume(prev => prev + (execPrice * size));

      const tpVal = tp ? parseFloat(tp) : undefined;
      const slVal = sl ? parseFloat(sl) : undefined;

      if (type === 'Market') {
          const liqPrice = side === 'Long' 
            ? execPrice * (1 - 1/leverage) + (execPrice * 0.005) 
            : execPrice * (1 + 1/leverage) - (execPrice * 0.005);

          const newPos: Position = {
              id: Date.now(), symbol: displayName, side: side, size: size.toFixed(3) + " " + symbol, lev: leverage,
              entry: execPrice, mark: execPrice, liq: liqPrice, pnl: -cost * 0.001, tp: tpVal, sl: slVal
          };
          setPositions(prev => [newPos, ...prev]);
          if(audioEnabled) toast.success(`${side} Order Filled`);
      } else {
          const newOrder: Order = { 
              id: Date.now(), symbol: displayName, side: side, size: size.toFixed(3) + " " + symbol, 
              price: execPrice, type: 'Limit', status: 'Open', filled: '0%', leverage: leverage 
          };
          setOrders(prev => [newOrder, ...prev]);
          toast.info("Limit Order Placed");
      }
  };

  const handleClosePosition = (id: number) => {
      const pos = positions.find(p => p.id === id); if (!pos) return;
      const sizeNum = parseFloat(pos.size.split(' ')[0]);
      const margin = (pos.entry * sizeNum) / pos.lev;
      setUsdcBalance(prev => prev + margin + pos.pnl);
      setHistory(prev => [{ id: Date.now(), symbol: pos.symbol, side: pos.side, size: pos.size, entryPrice: pos.entry, exitPrice: pos.mark, pnl: pos.pnl, closedAt: new Date().toLocaleTimeString() }, ...prev]);
      setPositions(prev => prev.filter(p => p.id !== id));
      if(audioEnabled) toast.success("Position Closed");
  };

  const handleCancelOrder = (id: number) => {
      const order = orders.find(o => o.id === id); if (!order) return;
      const sizeNum = parseFloat(order.size.split(' ')[0]);
      const leverage = (order as any).leverage || 20;
      const refund = (order.price * sizeNum) / leverage;
      setUsdcBalance(prev => prev + refund);
      setOrders(prev => prev.filter(o => o.id !== id));
      toast.info("Order Cancelled", { description: `$${refund.toFixed(2)} refunded.` });
  };

  const handleTokenSelect = (newSymbol: string, price: string) => { setSymbol(newSymbol); setDisplayName(newSymbol + '-USD'); setCurrentPrice(price); toast.dismiss(); toast.message(`Asset: ${newSymbol}`); };
  const formatPrice = (p: string) => { const num = parseFloat(p); return isNaN(num) ? p : num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  
  const navItemStyle = (tabName: string) => ({
    padding: '0 16px', height: '100%', display: 'flex', alignItems: 'center', fontSize: '14px', fontWeight: '600',
    color: activeTab === tabName ? '#e4e4e7' : '#71717a', borderBottom: activeTab === tabName ? '2px solid #3b82f6' : '2px solid transparent',
    cursor: 'pointer', transition: 'all 0.2s'
  });
  
  const timeBtnStyle = (t: string) => ({ 
    padding: '2px 8px', fontSize: '11px', fontWeight: '600', color: interval === t ? '#3b82f6' : '#71717a', background: 'transparent', border: 'none', cursor: 'pointer' 
  });

  if (!isLoaded) return <div style={{height:'100vh', background:'#0b0e11', color:'white', display:'flex', justifyContent:'center', alignItems:'center'}}>Loading ZeroX...</div>;

  return (
    <main style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: '#0b0e11', color: '#e4e4e7', fontFamily: 'sans-serif' }}>
      
      {/* MODALLAR */}
      <TokenSelector isOpen={isSelectorOpen} onClose={() => setIsSelectorOpen(false)} onSelect={handleTokenSelect} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} slippage={slippage} setSlippage={setSlippage} isPrivacyMode={isPrivacyMode} setPrivacyMode={setPrivacyMode} audioEnabled={audioEnabled} setAudioEnabled={setAudioEnabled} />
      <TransferModal isOpen={transferModal.isOpen} onClose={() => setTransferModal({ ...transferModal, isOpen: false })} type={transferModal.type} balance={usdcBalance} walletBalance={walletUsdc} onConfirm={handleTransfer} />

      {/* HEADER */}
      <header style={{ height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', borderBottom: '1px solid #2b3139', backgroundColor: '#0b0e11', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', height: '100%', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => setActiveTab('Trade')}>
            {/* YENİ LOGO */}
            <div style={{ width: '24px', height: '24px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white', fontSize: '12px' }}>Z</div>
            <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#e4e4e7' }}>Zero<span style={{ color: '#3b82f6' }}>X</span></span>
          </div>
          <nav style={{ display: 'flex', height: '100%' }}>{['Trade', 'Portfolio', 'Points', 'Faucet', 'Earn'].map((item) => (<div key={item} style={navItemStyle(item)} onClick={() => setActiveTab(item)}>{item} {item === 'Points' && '🔥'}</div>))}</nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => setIsSettingsOpen(true)} style={{ background: 'transparent', border: 'none', color: '#71717a', fontSize: '16px', cursor: 'pointer', padding:'4px' }}>⚙️</button>
          {isConnected && <div style={{ fontSize: '12px', fontWeight: '600', color: '#e4e4e7' }}>{isPrivacyMode ? '****' : `${usdcBalance.toLocaleString()} USDC`}</div>}
          <ConnectButton showBalance={false} chainStatus="icon" accountStatus="avatar" />
        </div>
      </header>

      {/* 1. TRADE SAYFASI */}
      <div style={{ display: activeTab === 'Trade' ? 'flex' : 'none', flex: 1, overflow: 'hidden' }}>
        
        {isMobile && <div style={{position:'absolute', bottom:0, left:0, width:'100%', height:50, background:'#18181b', zIndex:50, display:'flex', borderTop:'1px solid #27272a'}}>{['Chart','Trade','Book'].map(v=><button key={v} onClick={()=>setMobileView(v as any)} style={{flex:1, background:'transparent', border:'none', color:mobileView===v?'#3b82f6':'#71717a', fontWeight:'bold'}}>{v}</button>)}</div>}

        <div style={{ display: (!isMobile || mobileView !== 'Trade') ? 'flex' : 'none', flexDirection: 'column', flex: 1, minWidth: 0 }}>
           <div style={{ flex: 65, display: 'flex', borderBottom: '1px solid #2b3139', minHeight: 0 }}>
               <div style={{ display: (!isMobile || mobileView === 'Chart') ? 'flex' : 'none', flex: 1, flexDirection: 'column', borderRight: '1px solid #2b3139', minWidth: 0 }}>
                    <div style={{ height: '46px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', borderBottom: '1px solid #2b3139' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div onClick={() => setIsSelectorOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}><span style={{ fontWeight: 'bold', fontSize: '15px', color: 'white' }}>{displayName}</span><span style={{ fontSize: '10px', color: '#71717a' }}>▼</span></div>
                            <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#0ecb81', fontFamily: 'monospace' }}>${formatPrice(currentPrice)}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '0' }}>{['1m', '15m', '1h', '4h'].map(t => (<button key={t} onClick={() => setInterval(t)} style={timeBtnStyle(t)}>{t.toUpperCase()}</button>))}</div>
                    </div>
                    <div style={{ flex: 1, width: '100%', padding: '0' }}><PriceChart symbol={symbol} interval={interval} positions={positions} /></div>
               </div>
               <div style={{ display: (!isMobile || mobileView === 'Book') ? 'flex' : 'none', width: isMobile ? '100%' : '280px', flexDirection: 'column', flexShrink: 0 }}>
                    <OrderBook price={currentPrice} symbol={symbol} />
               </div>
           </div>
           <div style={{ flex: 35, backgroundColor: '#0b0e11', display: 'flex', flexDirection: 'column', minHeight: 0, marginBottom: isMobile ? 50 : 0 }}>
              <TradeBottomPanel positions={positions} orders={orders} history={history} onClosePosition={handleClosePosition} onCancelOrder={handleCancelOrder} />
           </div>
        </div>
        <div style={{ display: (!isMobile || mobileView === 'Trade') ? 'flex' : 'none', width: isMobile ? '100%' : '320px', borderLeft: '1px solid #2b3139', flexDirection: 'column', flexShrink: 0, backgroundColor: '#0b0e11' }}>
           <TradingPanel currentPrice={currentPrice} balance={usdcBalance} symbol={symbol} onOrder={handleOrder} />
        </div>
      </div>

      {/* 2. PORTFOLIO */}
      {activeTab === 'Portfolio' && (
        <div style={{ flex: 1, padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto', backgroundColor: '#0b0e11' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                <div style={{ backgroundColor: '#18181b', padding: '24px', borderRadius: '12px', border: '1px solid #27272a' }}><div style={{ color: '#a1a1aa', fontSize: '12px', marginBottom: '8px' }}>TOTAL EQUITY</div><div style={{ fontSize: '28px', fontWeight: 'bold', color: 'white' }}>{isPrivacyMode ? '****' : `$${totalEquity.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}</div></div>
                <div style={{ backgroundColor: '#18181b', padding: '24px', borderRadius: '12px', border: '1px solid #27272a' }}><div style={{ color: '#a1a1aa', fontSize: '12px', marginBottom: '8px' }}>UNREALIZED PNL</div><div style={{ fontSize: '28px', fontWeight: 'bold', color: totalUnrealizedPnL >= 0 ? '#0ecb81' : '#ef4444' }}>{isPrivacyMode ? '****' : `${totalUnrealizedPnL >= 0 ? '+' : ''}${totalUnrealizedPnL.toFixed(2)}`}</div></div>
                <div style={{ backgroundColor: '#18181b', padding: '24px', borderRadius: '12px', border: '1px solid #27272a' }}><div style={{ color: '#a1a1aa', fontSize: '12px', marginBottom: '8px' }}>EXCHANGE BALANCE</div><div style={{ fontSize: '28px', fontWeight: 'bold', color: 'white' }}>{isPrivacyMode ? '****' : `$${usdcBalance.toLocaleString()}`}</div></div>
                <div style={{ backgroundColor: '#18181b', padding: '24px', borderRadius: '12px', border: '1px solid #27272a' }}><div style={{ color: '#a1a1aa', fontSize: '12px', marginBottom: '8px' }}>WALLET BALANCE</div><div style={{ fontSize: '28px', fontWeight: 'bold', color: 'white' }}>{isPrivacyMode ? '****' : `$${walletUsdc.toLocaleString()}`}</div></div>
            </div>
            <div style={{width:'100%', height:'300px', backgroundColor:'#18181b', borderRadius:'12px', border:'1px solid #27272a', padding:'20px', overflow:'hidden'}}><h3 style={{color:'white', marginBottom:'10px'}}>PnL History</h3><PortfolioChart /></div>
            <div style={{ backgroundColor: '#18181b', borderRadius: '12px', border: '1px solid #27272a', padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'white', marginBottom: '16px' }}>Assets</h3>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid #27272a' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><div style={{ width: '32px', height: '32px', backgroundColor: '#2775ca', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white' }}>$</div><div><div style={{ fontWeight: 'bold', color: 'white' }}>USDC</div><div style={{ fontSize: '12px', color: '#a1a1aa' }}>Arbitrum Sepolia</div></div></div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button onClick={() => setTransferModal({isOpen: true, type: 'Deposit'})} style={{ padding: '6px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Deposit</button>
                        <button onClick={() => setTransferModal({isOpen: true, type: 'Withdraw'})} style={{ padding: '6px 16px', backgroundColor: '#27272a', color: 'white', border: '1px solid #3f3f46', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Withdraw</button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* 3. POINTS */}
      {activeTab === 'Points' && (
        <div style={{ flex: 1, padding: '40px', display: 'flex', flexDirection: 'column', gap: '32px', alignItems: 'center', overflowY: 'auto', backgroundColor: '#0b0e11', backgroundImage: 'radial-gradient(circle at top center, #1e293b 0%, #0b0e11 50%)' }}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#1e1b4b', padding: '6px 12px', borderRadius: '20px', border: '1px solid #4338ca', color: '#818cf8', fontSize: '12px', fontWeight: 'bold', marginBottom: '16px' }}><span>⏰</span> EPOCH 1 ENDS IN 4D 12H</div>
                <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>Trading Rewards</h1>
            </div>
            <div style={{ display: 'flex', gap: '24px', width: '100%', maxWidth: '900px' }}>
                <div style={{ flex: 1, backgroundColor: '#18181b', padding: '24px', borderRadius: '16px', border: '1px solid #27272a', textAlign: 'center' }}><div style={{ color: '#a1a1aa', fontSize: '12px' }}>YOUR POINTS</div><div style={{ fontSize: '40px', fontWeight: 'bold', color: '#fbbf24' }}>{userPoints.toLocaleString()}</div></div>
                <div style={{ flex: 1, backgroundColor: '#18181b', padding: '24px', borderRadius: '16px', border: '1px solid #27272a', textAlign: 'center' }}><div style={{ color: '#a1a1aa', fontSize: '12px' }}>VOLUME</div><div style={{ fontSize: '40px', fontWeight: 'bold', color: 'white' }}>${userVolume.toLocaleString()}</div></div>
            </div>
            <div style={{ width: '100%', maxWidth: '900px', backgroundColor: '#18181b', borderRadius: '16px', border: '1px solid #27272a', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr style={{ backgroundColor: '#1f2937', fontSize: '12px', color: '#9ca3af', textAlign: 'left' }}><th style={{ padding: '16px' }}>Rank</th><th style={{ padding: '16px' }}>Trader</th><th style={{ padding: '16px', textAlign: 'right' }}>Volume</th><th style={{ padding: '16px', textAlign: 'right' }}>Points</th></tr></thead>
                    <tbody>
                        {LEADERBOARD_DATA.map((row, i) => (<tr key={i} style={{ borderBottom: '1px solid #27272a' }}><td style={{ padding: '16px', fontWeight: 'bold', color: i < 3 ? '#fbbf24' : '#9ca3af' }}>#{row.rank}</td><td style={{ padding: '16px', fontFamily: 'monospace', color: 'white' }}>{row.user}</td><td style={{ padding: '16px', textAlign: 'right', color: '#e4e4e7' }}>${row.volume.toLocaleString()}</td><td style={{ padding: '16px', textAlign: 'right', color: '#fbbf24', fontWeight: 'bold' }}>{row.points.toLocaleString()}</td></tr>))}
                        {isConnected && (<tr style={{ backgroundColor: '#1e1b4b', borderTop: '2px solid #4338ca' }}><td style={{ padding: '16px', fontWeight: 'bold', color: '#818cf8' }}>YOU</td><td style={{ padding: '16px', fontFamily: 'monospace', color: 'white' }}>{address?.slice(0,6)}...{address?.slice(-4)}</td><td style={{ padding: '16px', textAlign: 'right', color: '#e4e4e7' }}>${userVolume.toLocaleString()}</td><td style={{ padding: '16px', textAlign: 'right', color: '#fbbf24', fontWeight: 'bold' }}>{userPoints.toLocaleString()}</td></tr>)}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {/* 4. FAUCET */}
      {activeTab === 'Faucet' && (
         <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundImage: 'radial-gradient(circle at center, #1e1e24 0%, #0b0e11 100%)' }}>
            <div style={{ padding: '40px', border: '1px solid #27272a', borderRadius: '16px', backgroundColor: '#18181b', width:'100%', maxWidth:'450px', textAlign:'center' }}>
               <h2 style={{color:'white', fontSize:'24px', fontWeight:'bold', marginBottom:'20px'}}>Testnet Faucet</h2>
               <p style={{color:'#a1a1aa', marginBottom:'24px'}}>Mint free USDC to your wallet.</p>
               <button onClick={handleFaucetClaim} disabled={isMinting} style={{width:'100%', padding:'16px', background: isMinting ? '#27272a' : '#3b82f6', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'bold'}}>{isMinting?'Minting...':'Mint 1,000 USDC to Wallet'}</button>
            </div>
         </div>
      )}

      {/* 5. EARN */}
      {activeTab === 'Earn' && (
         <div style={{ flex: 1, padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', overflowY: 'auto', backgroundColor: '#0b0e11', backgroundImage: 'linear-gradient(to bottom, #111827, #0b0e11)' }}>
             <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: 'white' }}>Referral Program</h1>
             <div style={{ marginTop: '40px', padding: '30px', border: '1px solid #27272a', borderRadius: '12px', backgroundColor: '#18181b', width: '100%', maxWidth: '600px' }}>
                 <div style={{ color: '#a1a1aa', fontSize: '12px', marginBottom: '8px' }}>YOUR REFERRAL CODE</div>
                 <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', letterSpacing: '2px', marginBottom: '20px' }}>
                     ZEROX-{address ? address.slice(2,6).toUpperCase() : 'GUEST'}
                 </div>
                 <button onClick={() => { navigator.clipboard.writeText(`ZEROX-${address ? address.slice(2,6).toUpperCase() : 'GUEST'}`); toast.success("Code Copied!"); }} style={{ width: '100%', padding: '12px', backgroundColor: '#27272a', color: 'white', border: '1px solid #3f3f46', borderRadius: '8px', cursor: 'pointer' }}>Copy Code</button>
             </div>
         </div>
      )}

    </main>
  );
}