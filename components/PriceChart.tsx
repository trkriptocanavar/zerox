'use client';
import React from 'react';
import { AdvancedRealTimeChart } from 'react-ts-tradingview-widgets';
import { Position } from './TradeBottomPanel';

interface PriceChartProps { 
    symbol: string; 
    // Eski yapı bozulmasın diye dursun ama kullanılmıyor
    interval?: string; 
    positions?: Position[];
}

export const PriceChart = ({ symbol }: PriceChartProps) => {
    // Sembolü Binance formatına çevir (ETHUSDT -> BINANCE:ETHUSDT)
    const tradingViewSymbol = `BINANCE:${symbol.replace('USDT', '')}USDT`;

    return (
        <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
            <AdvancedRealTimeChart 
                symbol={tradingViewSymbol}
                theme="dark"
                autosize
                interval="15"              // Varsayılan zaman dilimi
                timezone="Etc/UTC"
                style="1"                  // 1 = Mum grafik
                locale="en"
                toolbar_bg="#0b0e11"
                enable_publishing={false}
                hide_side_toolbar={false}  // Çizim araçları görünsün
                allow_symbol_change={false}
                container_id="tradingview_widget"
                hide_top_toolbar={false}   // Üst bar (15m, 1h vs) görünsün
                // backgroundColor ve gridLineColor geçerli prop değil, o yüzden kaldırdık
            />
        </div>
    );
};
