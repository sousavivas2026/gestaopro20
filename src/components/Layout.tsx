import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { ReactNode, useState } from "react";
import { FloatingAISearch } from "./FloatingAISearch";
import { Button } from "./ui/button";
import { Sparkles } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [showSearch, setShowSearch] = useState(false);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4">
            <SidebarTrigger />
          </header>
          <div className="p-6">{children}</div>
        </main>
      </div>
      
      {/* Botão de pesquisa inteligente flutuante */}
      {showSearch && <FloatingAISearch onClose={() => setShowSearch(false)} />}
      <Button 
        onClick={() => setShowSearch(true)}
        className="fixed bottom-4 right-4 rounded-full w-14 h-14 shadow-lg z-40"
        variant="default"
      >
        <Sparkles className="h-6 w-6" />
      </Button>
    </SidebarProvider>
  );
}
