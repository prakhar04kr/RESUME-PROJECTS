import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HelpBot } from "@/components/HelpBot";

import Home from "@/pages/Home";
import Schemes from "@/pages/Schemes";
import SchemeDetail from "@/pages/SchemeDetail";
import StateSchemes from "@/pages/StateSchemes";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/schemes" component={Schemes} />
          <Route path="/schemes/:id" component={SchemeDetail} />
          <Route path="/central-schemes">
            {() => <Schemes isCentralOnly={true} />}
          </Route>
          <Route path="/state-schemes" component={StateSchemes} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
      <HelpBot />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
