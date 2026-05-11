import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as HotToaster } from "react-hot-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import IndexRouteFallback from "@/components/IndexRouteFallback";
import { pageTransition } from "@/lib/motion";
import { useAuth } from "@/hooks/useAuth";
import { preloadUiSoundSamples, PRELOAD_UI_SAMPLES } from "@/lib/sounds";
import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import NotFound from "./pages/NotFound.tsx";

const Index = lazy(() => import("./pages/Index.tsx"));

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={pageTransition}
        className="min-h-dvh w-full"
      >
        <Routes location={location}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Suspense fallback={<IndexRouteFallback />}>
                  <Index />
                </Suspense>
              </ProtectedRoute>
            }
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function SoundAssetWarmup() {
  useEffect(() => {
    if (!PRELOAD_UI_SAMPLES) return;
    preloadUiSoundSamples();
    const touchPrime = () => preloadUiSoundSamples();
    window.addEventListener("pointerdown", touchPrime, { passive: true });
    return () => window.removeEventListener("pointerdown", touchPrime);
  }, []);
  return null;
}

const App = () => (
  <TooltipProvider>
    <SoundAssetWarmup />
    <Toaster />
    <Sonner />
    <HotToaster
      position="top-center"
      containerStyle={{ top: 16 }}
      toastOptions={{
        duration: 3500,
        className:
          "!bg-card !text-card-foreground !text-sm !font-medium !border !border-border/75 dark:!border-border/50 !rounded-xl !shadow-lg dark:!shadow-2xl dark:!shadow-black/45 !px-4 !py-3 !backdrop-blur-md",
      }}
    />
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  </TooltipProvider>
);

export default App;
