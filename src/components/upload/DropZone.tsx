import { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Upload as UploadIcon, Drive } from '@/components/ui/Icon';
import { cn } from '@/lib/cn';

interface DropZoneProps {
  onFiles: (files: File[]) => void;
}

export function DropZone({ onFiles }: DropZoneProps) {
  const [active, setActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setActive(true);
  }, []);
  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setActive(false);
  }, []);
  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setActive(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length) onFiles(files);
    },
    [onFiles],
  );

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        'border-[1.5px] border-dashed rounded-md p-10 flex flex-col items-center gap-3 text-center transition-colors',
        active ? 'border-accent bg-accent-soft' : 'border-border-strong bg-surface-alt',
      )}
    >
      <div className="w-12 h-12 rounded-full bg-accent-soft text-accent-ink flex items-center justify-center">
        <UploadIcon size={22} />
      </div>
      <div className="text-[15px] font-semibold text-ink">Drop bank, credit-card, or broker statements here</div>
      <div className="text-xs text-ink-muted max-w-md">
        PDF, XLSX, or CSV. Files are read in your browser — they never leave your machine until you sign in to Google Drive.
      </div>
      <div className="flex gap-2 mt-1">
        <Button variant="secondary" size="sm" leadingIcon={<UploadIcon size={13} />} onClick={() => inputRef.current?.click()}>
          Choose files
        </Button>
        <Button variant="ghost" size="sm" leadingIcon={<Drive size={13} />} disabled>
          Pick from Drive
        </Button>
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.xlsx,.xls,.csv,.txt"
        className="hidden"
        onChange={e => {
          const files = e.target.files ? Array.from(e.target.files) : [];
          if (files.length) onFiles(files);
          e.target.value = '';
        }}
      />
    </div>
  );
}
