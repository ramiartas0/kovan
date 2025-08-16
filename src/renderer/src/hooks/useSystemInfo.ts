import { useState, useEffect } from 'react';

interface SystemInfo {
  platform: string;
  arch: string;
  version: string;
  nodeVersion: string;
  electronVersion: string;
}

export const useSystemInfo = () => {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSystemInfo = async () => {
      try {
        setLoading(true);
        const info = await window.kovanAPI.system.info();
        setSystemInfo(info);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Sistem bilgileri alınamadı');
      } finally {
        setLoading(false);
      }
    };

    fetchSystemInfo();
  }, []);

  return { systemInfo, loading, error };
};


