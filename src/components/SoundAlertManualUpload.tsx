import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function SoundAlertManualUpload() {
  const [uploadedAudios, setUploadedAudios] = useState<string[]>([]);

  useEffect(() => {
    // Carregar lista de áudios ao montar
    const existing = JSON.parse(localStorage.getItem('manual_audio_list') || '[]');
    setUploadedAudios(existing);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      toast.error("Por favor, selecione um arquivo de áudio válido");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const audioData = event.target?.result as string;
      const audioName = file.name.replace(/\.[^/.]+$/, "");
      
      // Salvar no localStorage
      localStorage.setItem(`manual_audio_${audioName}`, audioData);
      
      // Atualizar lista
      const existing = JSON.parse(localStorage.getItem('manual_audio_list') || '[]');
      const updated = [...existing, audioName];
      localStorage.setItem('manual_audio_list', JSON.stringify(updated));
      
      setUploadedAudios(updated);
      toast.success(`Áudio "${audioName}" carregado com sucesso!`);
    };

    reader.readAsDataURL(file);
  };

  const handlePlay = (audioName: string) => {
    const audioData = localStorage.getItem(`manual_audio_${audioName}`);
    if (!audioData) {
      toast.error("Áudio não encontrado");
      return;
    }

    const audio = new Audio(audioData);
    audio.play().catch(() => toast.error("Erro ao reproduzir áudio"));
  };

  const handleDelete = (audioName: string) => {
    localStorage.removeItem(`manual_audio_${audioName}`);
    
    const existing = JSON.parse(localStorage.getItem('manual_audio_list') || '[]');
    const updated = existing.filter((name: string) => name !== audioName);
    localStorage.setItem('manual_audio_list', JSON.stringify(updated));
    
    setUploadedAudios(updated);
    toast.success("Áudio removido");
  };

  const handleSetPreferred = (audioName: string) => {
    localStorage.setItem('preferred_alert_manual_audio', audioName);
    toast.success(`"${audioName}" definido como áudio preferido`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload de Áudios Personalizados
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="audio-upload">Carregar Arquivo de Áudio</Label>
          <Input
            id="audio-upload"
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="mt-2"
          />
          <p className="text-sm text-muted-foreground mt-1">
            Formatos suportados: MP3, WAV, OGG
          </p>
        </div>

        {uploadedAudios.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium">Áudios Carregados:</h3>
            {uploadedAudios.map((audioName) => (
              <div
                key={audioName}
                className="flex items-center justify-between p-2 border rounded"
              >
                <span className="text-sm">{audioName}</span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePlay(audioName)}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSetPreferred(audioName)}
                  >
                    Usar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(audioName)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}