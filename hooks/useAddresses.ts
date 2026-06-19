import { useEffect, useState } from 'react';

import { type WalletAddresses, getAddresses } from '@/lib/wallet/wallet';

/** Loads the derived wallet addresses from SecureStore once. */
export function useAddresses(): WalletAddresses | null {
  const [addrs, setAddrs] = useState<WalletAddresses | null>(null);
  useEffect(() => {
    let active = true;
    void getAddresses().then((a) => {
      if (active) setAddrs(a);
    });
    return () => {
      active = false;
    };
  }, []);
  return addrs;
}
