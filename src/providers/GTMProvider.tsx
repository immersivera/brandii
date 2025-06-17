import { useEffect } from 'react';
import TagManager from 'react-gtm-module';

const GTM_ID = import.meta.env.VITE_GTM_ID || '';
const GTM_ID_DEV = import.meta.env.VITE_GTM_ID_DEV || '';

interface GTMProviderProps {
  children: React.ReactNode;
}

export const GTMProvider = ({ children }: GTMProviderProps) => {
  useEffect(() => {
    if (GTM_ID && process.env.NODE_ENV === 'production') {
      const tagManagerArgs = {
        gtmId: GTM_ID,
      };
      TagManager.initialize(tagManagerArgs);
    } else {
        const tagManagerArgs = {
            gtmId: GTM_ID_DEV,
          };
          TagManager.initialize(tagManagerArgs);
    }
  }, []);

  return <>{children}</>;
};

export default GTMProvider;
