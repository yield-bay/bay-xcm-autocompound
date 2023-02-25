"use client";
import { ReactNode, useEffect, useState } from "react";

// Wrapper to disable SSR for wrapped component
// Runs on client side
const ClientOnly = ({ children }: { children: ReactNode }) => {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) return null;

  return <>{children}</>;
};

export default ClientOnly;
