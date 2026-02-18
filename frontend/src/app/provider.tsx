import { Suspense, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryConfig } from '@/lib/react-query';
import { Spinner } from '@/components/ui/spinner';

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: queryConfig }),
  );

  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <QueryClientProvider client={queryClient}>
        {import.meta.env.DEV && <ReactQueryDevtools />}
        {children}
      </QueryClientProvider>
    </Suspense>
  );
}
