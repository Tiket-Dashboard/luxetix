import { useState, useRef, useCallback } from "react";
import { Upload, X, Image as ImageIcon, Loader2, Check, RectangleHorizontal, Square, RectangleVertical, Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useImageUpload } from "@/hooks/useImageUpload";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

export type AspectRatioType = 'auto' | '1:1' | '16:9' | '4:3' | '2:3' | '3:4';

interface AspectRatioOption {
  value: AspectRatioType;
  label: string;
  icon: React.ReactNode;
  description: string;
  ratio?: number; // height/width ratio
}

const ASPECT_RATIO_OPTIONS: AspectRatioOption[] = [
  { 
    value: 'auto', 
    label: 'Auto', 
    icon: <Maximize className="w-4 h-4" />,
    description: 'Sesuai gambar asli'
  },
  { 
    value: '1:1', 
    label: 'Square', 
    icon: <Square className="w-4 h-4" />,
    description: 'Kotak (1:1)',
    ratio: 1
  },
  { 
    value: '16:9', 
    label: 'Wide', 
    icon: <RectangleHorizontal className="w-4 h-4" />,
    description: 'Layar lebar (16:9)',
    ratio: 9/16
  },
  { 
    value: '4:3', 
    label: 'Standard', 
    icon: <RectangleHorizontal className="w-4 h-4" />,
    description: 'Standar (4:3)',
    ratio: 3/4
  },
  { 
    value: '2:3', 
    label: 'Portrait', 
    icon: <RectangleVertical className="w-4 h-4" />,
    description: 'Potret (2:3)',
    ratio: 3/2
  },
  { 
    value: '3:4', 
    label: 'Tall', 
    icon: <RectangleVertical className="w-4 h-4" />,
    description: 'Tinggi (3:4)',
    ratio: 4/3
  },
];

interface ImageUploadWithAspectRatioProps {
  imageUrl: string;
  aspectRatio: AspectRatioType;
  onImageChange: (url: string) => void;
  onAspectRatioChange: (ratio: AspectRatioType) => void;
  folder?: string;
}

const ImageUploadWithAspectRatio = ({ 
  imageUrl, 
  aspectRatio,
  onImageChange, 
  onAspectRatioChange,
  folder = "concerts" 
}: ImageUploadWithAspectRatioProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadImage, isUploading, progress } = useImageUpload();
  const [previewUrl, setPreviewUrl] = useState<string>(imageUrl);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to storage
    const url = await uploadImage(file, folder);
    if (url) {
      onImageChange(url);
      setPreviewUrl(url);
    } else {
      // Reset preview on failure
      setPreviewUrl(imageUrl);
    }
  };

  const handleRemove = () => {
    onImageChange("");
    setPreviewUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getPreviewAspectRatioClass = useCallback(() => {
    switch (aspectRatio) {
      case '1:1': return 'aspect-square';
      case '16:9': return 'aspect-video';
      case '4:3': return 'aspect-[4/3]';
      case '2:3': return 'aspect-[2/3]';
      case '3:4': return 'aspect-[3/4]';
      default: return 'aspect-video'; // auto defaults to 16:9 for preview
    }
  }, [aspectRatio]);

  const selectedOption = ASPECT_RATIO_OPTIONS.find(opt => opt.value === aspectRatio);

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Aspect Ratio Selector */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Rasio Gambar Poster</Label>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {ASPECT_RATIO_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onAspectRatioChange(option.value)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 p-3 rounded-lg border-2 transition-all",
                "hover:border-primary/50 hover:bg-secondary/50",
                aspectRatio === option.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground"
              )}
            >
              {option.icon}
              <span className="text-xs font-medium">{option.label}</span>
            </button>
          ))}
        </div>
        {selectedOption && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Check className="w-3 h-3 text-primary" />
            {selectedOption.description}
          </p>
        )}
      </div>

      {/* Image Preview */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Gambar Poster</Label>
        
        {previewUrl ? (
          <div className="relative group">
            <div className={cn(
              "relative overflow-hidden rounded-xl border border-border bg-secondary/30",
              getPreviewAspectRatioClass()
            )}>
              <img
                src={previewUrl}
                alt="Preview"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Upload className="w-4 h-4 mr-1" />
                Ganti
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleRemove}
                disabled={isUploading}
              >
                <X className="w-4 h-4 mr-1" />
                Hapus
              </Button>
            </div>
            {isUploading && (
              <div className="absolute inset-0 bg-background/80 rounded-xl flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <Progress value={progress} className="w-3/4" />
                <span className="text-sm text-muted-foreground">Mengupload...</span>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className={cn(
              "w-full border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-3",
              "hover:border-primary/50 hover:bg-secondary/30 transition-colors cursor-pointer",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              getPreviewAspectRatioClass()
            )}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-10 h-10 text-muted-foreground animate-spin" />
                <Progress value={progress} className="w-3/4" />
                <span className="text-sm text-muted-foreground">Mengupload...</span>
              </>
            ) : (
              <>
                <ImageIcon className="w-10 h-10 text-muted-foreground" />
                <div className="text-center">
                  <span className="text-primary font-medium">Klik untuk upload</span>
                  <p className="text-sm text-muted-foreground">PNG, JPG hingga 5MB</p>
                </div>
              </>
            )}
          </button>
        )}
      </div>

      {/* Aspect Ratio Preview Cards */}
      {previewUrl && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Preview di berbagai tampilan:</Label>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {/* Card Preview */}
            <div className="flex-shrink-0 w-32">
              <div className="text-xs text-muted-foreground mb-1">Card</div>
              <div className={cn(
                "relative overflow-hidden rounded-lg border border-border/50",
                getPreviewAspectRatioClass()
              )}>
                <img
                  src={previewUrl}
                  alt="Card preview"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            </div>
            
            {/* Detail Page Preview */}
            <div className="flex-shrink-0 w-48">
              <div className="text-xs text-muted-foreground mb-1">Halaman Detail</div>
              <div className={cn(
                "relative overflow-hidden rounded-lg border border-border/50",
                getPreviewAspectRatioClass()
              )}>
                <img
                  src={previewUrl}
                  alt="Detail preview"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Thumbnail Preview */}
            <div className="flex-shrink-0">
              <div className="text-xs text-muted-foreground mb-1">Thumbnail</div>
              <div className="relative w-16 h-16 overflow-hidden rounded-lg border border-border/50">
                <img
                  src={previewUrl}
                  alt="Thumbnail preview"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploadWithAspectRatio;
