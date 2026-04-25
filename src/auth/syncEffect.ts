// React effect: keep the store's persistence backend in sync with the
// current auth status. Signed in → composite (Drive primary + LocalStorage
// fallback). Signed out → LocalStorage only.

import { useEffect, useRef } from 'react';
import { CompositePersistence, DrivePersistence } from '@/store/drivePersistence';
import { LocalStoragePersistence } from '@/store/persistence';
import { store } from '@/store/store';
import { useAuth } from './hooks';

const localOnly = new LocalStoragePersistence();

export function useAuthSync(): void {
  const status = useAuth();
  const lastKindRef = useRef<string | null>(null);

  useEffect(() => {
    if (status.kind === lastKindRef.current) return;
    lastKindRef.current = status.kind;

    if (status.kind === 'signed-in') {
      const composite = new CompositePersistence(new DrivePersistence(), localOnly);
      void store.setPersistence(composite);
    } else if (status.kind === 'signed-out' || status.kind === 'unconfigured') {
      void store.setPersistence(localOnly);
    }
  }, [status.kind]);
}
