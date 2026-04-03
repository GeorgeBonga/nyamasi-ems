import React, { createContext, useContext, useState } from "react";

const LoaderContext = createContext<any>(null);

export const LoaderProvider = ({ children }: any) => {
  const [loading, setLoading] = useState(false);

  const showLoader = () => setLoading(true);

  const hideLoader = () => setLoading(false);

  // 🔥 Professional: ensures loader shows at least 3 seconds
  const withLoader = async (callback: () => Promise<any>) => {
    try {
      setLoading(true);
      const start = Date.now();

      const result = await callback();

      const elapsed = Date.now() - start;
      const remaining = 3000 - elapsed;

      if (remaining > 0) {
        await new Promise((res) => setTimeout(res, remaining));
      }

      return result;
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoaderContext.Provider value={{ loading, showLoader, hideLoader, withLoader }}>
      {children}
    </LoaderContext.Provider>
  );
};

export const useLoader = () => useContext(LoaderContext);