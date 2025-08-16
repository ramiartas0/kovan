import { useMemo } from 'react';

interface AppInfo {
  name: string;
  version: string;
  description: string;
  fullName: string;
  versionWithName: string;
}

export const useAppInfo = (): AppInfo => {
  return useMemo(() => {
    const name = typeof __APP_NAME__ !== 'undefined' ? __APP_NAME__ : 'Kovan';
    const version = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0';
    const description = typeof __APP_DESCRIPTION__ !== 'undefined' ? __APP_DESCRIPTION__ : 'Lokal Geliştirme Ortamı';
    
    return {
      name,
      version,
      description,
      fullName: `${name} - ${description}`,
      versionWithName: `${name} v${version}`
    };
  }, []);
};
