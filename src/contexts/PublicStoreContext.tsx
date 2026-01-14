import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface PublicCompany {
  id: string;
  name: string;
  public_slug: string;
  whatsapp_number: string | null;
  public_store_enabled: boolean;
  address: string | null;
  phone: string | null;
  email: string | null;
  store_banner_url: string | null;
  business_type: string | null;
}

interface PublicStoreContextType {
  company: PublicCompany | null;
  isLoading: boolean;
  error: 'not_found' | 'disabled' | null;
}

const PublicStoreContext = createContext<PublicStoreContextType | undefined>(undefined);

export const usePublicStore = () => {
  const context = useContext(PublicStoreContext);
  if (context === undefined) {
    throw new Error('usePublicStore must be used within a PublicStoreProvider');
  }
  return context;
};

interface PublicStoreProviderProps {
  children: ReactNode;
}

export const PublicStoreProvider: React.FC<PublicStoreProviderProps> = ({ children }) => {
  const { slug } = useParams<{ slug: string }>();
  const [company, setCompany] = useState<PublicCompany | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<'not_found' | 'disabled' | null>(null);

  useEffect(() => {
    const fetchCompany = async () => {
      if (!slug) {
        setError('not_found');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('companies')
          .select(`
            id,
            name,
            public_slug,
            whatsapp_number,
            public_store_enabled,
            address,
            phone,
            email,
            store_banner_url,
            business_type
          `)
          .eq('public_slug', slug)
          .eq('is_active', true)
          .maybeSingle();

        if (fetchError) {
          console.error('Error fetching company:', fetchError);
          setError('not_found');
          return;
        }

        if (!data) {
          setError('not_found');
          return;
        }

        if (!data.public_store_enabled) {
          setError('disabled');
          return;
        }

        setCompany(data as PublicCompany);
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('not_found');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompany();
  }, [slug]);

  return (
    <PublicStoreContext.Provider value={{ company, isLoading, error }}>
      {children}
    </PublicStoreContext.Provider>
  );
};
