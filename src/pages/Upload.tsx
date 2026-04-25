import { useState } from 'react';
import { TopBar } from '@/components/TopBar';
import { Card } from '@/components/ui/Card';
import { DropZone } from '@/components/upload/DropZone';
import { UploadFileCard } from '@/components/upload/UploadFileCard';
import { listRegisteredParsers } from '@/lib/runUpload';

interface PendingFile {
  id: string;
  file: File;
}

export function Upload() {
  const [pending, setPending] = useState<PendingFile[]>([]);
  const parsers = listRegisteredParsers();

  const onFiles = (files: File[]) => {
    const next = files.map((f, i) => ({ id: `${Date.now()}-${i}-${f.name}`, file: f }));
    setPending(prev => [...prev, ...next]);
  };

  return (
    <div className="flex flex-col h-full min-w-0">
      <TopBar
        title="Upload"
        subtitle="Statements, broker reports, and bills · auto-detected and parsed"
      />
      <div className="flex-1 p-6 overflow-auto flex flex-col gap-4 max-w-4xl w-full">
        <DropZone onFiles={onFiles} />

        {pending.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-[0.04em]">
              {pending.length} pending file{pending.length === 1 ? '' : 's'}
            </div>
            {pending.map(p => (
              <UploadFileCard
                key={p.id}
                file={p.file}
                onRemove={() => setPending(prev => prev.filter(x => x.id !== p.id))}
              />
            ))}
          </div>
        )}

        <Card padding={16} className="flex flex-col gap-2">
          <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-[0.04em]">
            Supported formats
          </div>
          <div className="text-[13px] text-ink">
            {parsers.length} parser{parsers.length === 1 ? '' : 's'} registered. New formats are added one file at a time — see <span className="font-mono">src/parsers/README.md</span>.
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2">
            {parsers.map(p => (
              <div key={p.id} className="flex items-center gap-2 text-[12px]">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                <span className="text-ink">{p.displayName}</span>
                <span className="text-ink-subtle font-mono ml-auto">{p.id.replace('parser.', '')}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card padding={16} className="flex flex-col gap-2 bg-accent-soft border-accent-soft">
          <div className="text-[11px] font-semibold text-accent-ink uppercase tracking-[0.04em]">
            Privacy
          </div>
          <div className="text-[13px] text-accent-ink leading-relaxed">
            Files are read in your browser and parsed in-memory. Records are stored in your browser's local storage today;
            once you sign in to Google Drive, raw files and parsed JSON sync to a folder in your own Drive that only this dashboard can access (<span className="font-mono">drive.file</span> scope). Nothing leaves your machine until then.
          </div>
        </Card>
      </div>
    </div>
  );
}
