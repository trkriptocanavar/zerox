'use client';
import React from 'react';
import { AdvancedRealTimeChart } from 'react-ts-tradingview-widgets';
import { Position } from './TradeBottomPanel';

interface PriceChartProps { 
    symbol: string; 
    // Interval artık grafiğin kendi içinde yönetiliyor, prop olarak almaya gerek yok ama
    // eski yapı bozulmasın diye tip tanımında tutabiliriz, kullanmasak bile.
    interval?: string; 
    positions?: Position[]; // Widget üzerine pozisyon çizmek zor olduğu için şimdilik görselden kaldırıyoruz
}

export const PriceChart = ({ symbol }: PriceChartProps) => {
    // Sembolü Binance formatına çevir (ETH -> BINANCE:ETHUSDT)
    const tradingViewSymbol = `BINANCE:${symbol.replace('USDT', '')}USDT`;

    return (
        <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
            <AdvancedRealTimeChart 
                symbol={tradingViewSymbol}
                theme="dark"
                autosize
                interval="15" // Varsayılan zaman dilimi
                timezone="Etc/UTC"
                style="1" // 1 = Mum Grafik
                locale="en"
                toolbar_bg="#0b0e11"
                enable_publishing={false}
                hide_side_toolbar={false} // Çizim araçları görünsün
                allow_symbol_change={false} // Kullanıcı değiştiremesin, biz değiştirelim
                container_id="tradingview_widget"
                // Renkleri HyperDex temasına uyduralım
                backgroundColor="#0b0e11"
                gridLineColor="#1e2329"
                hide_top_toolbar={false} // Üst bar (15m 1h indicators) görünsün
            />
        </div>
    );
};