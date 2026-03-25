import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Camera, Upload, X } from "lucide-react";
import { toast } from "sonner";

interface VanPhotoUploadProps {
  userId: string;
  currentPhotoUrl: string | null;
  onPhotoUpdated: (url: string) => void;
}

const VanPhotoUpload = ({ userId, currentPhotoUrl, onPhotoUpdated }: VanPhotoUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentPhotoUrl);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    setUploading(true);

    try {
      const ext = file.name.split(".").pop();
      const path = `${userId}/van-photo.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("van-photos")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("van-photos")
        .getPublicUrl(path);

      const photoUrl = `${publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ van_photo_url: photoUrl })
        .eq("id", userId);

      if (updateError) throw updateError;

      setPreview(photoUrl);
      onPhotoUpdated(photoUrl);
      toast.success("Van photo uploaded! 📸");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = async () => {
    setUploading(true);
    try {
      await supabase
        .from("profiles")
        .update({ van_photo_url: null })
        .eq("id", userId);

      setPreview(null);
      onPhotoUpdated("");
      toast.info("Photo removed");
    } catch (err: any) {
      toast.error(err.message || "Failed to remove");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-display text-xl font-bold text-foreground">
          Van Photo
        </h2>
        <span className="bg-accent/20 text-accent-foreground font-display text-xs font-semibold px-2.5 py-1 rounded-full">
          £1.50 one-off
        </span>
      </div>
      <p className="text-muted-foreground font-body text-sm mb-4">
        Upload a photo of your ice cream van. It'll be shown to customers on the live map.
      </p>

      {preview ? (
        <div className="relative rounded-lg overflow-hidden mb-4">
          <img src={preview} alt="Your van" className="w-full h-48 object-cover" />
          <button
            onClick={removePhoto}
            disabled={uploading}
            className="absolute top-2 right-2 bg-foreground/70 text-background rounded-full p-1.5 hover:bg-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => fileRef.current?.click()}
          className="w-full h-48 rounded-lg border-2 border-dashed border-border bg-muted/50 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 transition-colors mb-4"
        >
          <Camera className="w-8 h-8 text-muted-foreground" />
          <span className="text-muted-foreground font-body text-sm">Click to upload a photo</span>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />

      <Button
        variant="hero"
        size="sm"
        className="w-full"
        disabled={uploading}
        onClick={() => fileRef.current?.click()}
      >
        {uploading ? "Uploading…" : (
          <>
            <Upload className="w-4 h-4" /> {preview ? "Change Photo — £1.50" : "Upload Photo — £1.50"}
          </>
        )}
      </Button>
    </div>
  );
};

export default VanPhotoUpload;
