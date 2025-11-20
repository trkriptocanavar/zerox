'use client';

import * as React from 'react';
import { RainbowKitProvider, getDefaultConfig, darkTheme } from '@rainbow-me/rainbowkit';
import { arbitrum, mainnet, sepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, http } from 'wagmi';
import '@rainbow-me/rainbowkit/styles.css';

const config = getDefaultConfig({
  appName: 'ZeroX Exchange', // ARTIK ZeroX
  projectId: '1f3e980a0e1574af688db690fd7f207d', 
  chains: [arbitrum, mainnet, sepolia],
  transports: {
    [mainnet.id]: http('https://eth.llamarpc.com'), 
    [arbitrum.id]: http('https://arb1.arbitrum.io/rpc'),
    [sepolia.id]: http('https://rpc.sepolia.org'),
  },
  ssr: true,
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme({ accentColor: '#2563eb', accentColorForeground: 'white', borderRadius: 'medium', overlayBlur: 'small' })} modalSize="compact">
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}