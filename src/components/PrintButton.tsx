import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface PrintButtonProps {
  title?: string;
  onBeforePrint?: () => void;
}

export function PrintButton({ title = "Imprimir Relatório", onBeforePrint }: PrintButtonProps) {
  const handlePrint = () => {
    if (onBeforePrint) {
      onBeforePrint();
    }
    
    // Aguardar um momento para o callback ser executado
    setTimeout(() => {
      window.print();
    }, 100);
  };

  return (
    <Button 
      onClick={handlePrint}
      variant="outline"
      className="gap-2"
    >
      <Printer className="h-4 w-4" />
      {title}
    </Button>
  );
}
