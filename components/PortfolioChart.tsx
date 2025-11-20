'use client';
import { createChart, ColorType, AreaSeries, IChartApi } from 'lightweight-charts';
import React, { useEffect, useRef } from 'react';

export const PortfolioChart = () => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartInstance = useRef<IChartApi | null>(null);

    useEffect(() => {
        if (!chartContainerRef.current) return;
        if (chartInstance.current) {
            chartInstance.current.remove();
            chartInstance.current = null;
        }
        const chart = createChart(chartContainerRef.current, {
            layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: '#71717a' },
            grid: { vertLines: { visible: false }, horzLines: { color: '#27272a' } },
            width: chartContainerRef.current.clientWidth, height: 300,
            rightPriceScale: { borderVisible: false }, timeScale: { borderVisible: false },
        });
        chartInstance.current = chart;

        const areaSeries = chart.addSeries(AreaSeries, { lineColor: '#3b82f6', topColor: 'rgba(59, 130, 246, 0.4)', bottomColor: 'rgba(59, 130, 246, 0)', lineWidth: 2 });
        const data = [];
        let value = 1000;
        const now = Math.floor(Date.now() / 1000) as any;
        for (let i = 30; i >= 0; i--) {
            value = value * (1 + (Math.random() - 0.45) * 0.1); 
            data.push({ time: (now - (i * 24 * 60 * 60)) as any, value: value });
        }
        areaSeries.setData(data);

        const handleResize = () => { if (chartContainerRef.current && chartInstance.current) chartInstance.current.applyOptions({ width: chartContainerRef.current.clientWidth }); };
        window.addEventListener('resize', handleResize);
        return () => { window.removeEventListener('resize', handleResize); if (chartInstance.current) { chartInstance.current.remove(); chartInstance.current = null; } };
    }, []);

    return <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />;
};