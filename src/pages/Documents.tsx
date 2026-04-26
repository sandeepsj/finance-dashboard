import { Link } from 'react-router-dom';
import { TopBar } from '@/components/TopBar';
import { Card } from '@/components/ui/Card';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Doc, Drive, Lock, Upload as UploadIcon } from '@/components/ui/Icon';
import { store } from '@/store/store';
import { useStoreSelector } from '@/store/hooks';
import { formatDate } from '@/lib/format';
import type { DriveSyncStatus, ParseStatus } from '@/domain/types';

const statusTone: Record<ParseStatus, BadgeTone> = {
  parsed: 'gain',
  failed: 'loss',
  pending: 'pending',
};
const statusLabel: Record<ParseStatus, string> = {
  parsed: 'Parsed',
  failed: 'Failed',
  pending: 'Pending',
};

const driveTone: Record<DriveSyncStatus, BadgeTone> = {
  'local-only': 'neutral',
  pending: 'info',
  synced: 'gain',
  failed: 'loss',
};
const driveLabel: Record<DriveSyncStatus, string> = {
  'local-only': 'Local',
  pending: 'Syncing',
  synced: 'Drive',
  failed: 'Drive ✗',
};

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

export function Documents() {
  const docs = useStoreSelector(s =>
    Object.values(s.documents).sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1)),
  );

  return (
    <div className="flex flex-col h-full min-w-0">
      <TopBar title="Documents" subtitle={`${docs.length} file${docs.length === 1 ? '' : 's'} parsed and stored`} />
      <div className="flex-1 p-6 overflow-auto flex flex-col gap-4">
        {docs.length === 0 ? (
          <Card padding={32} className="flex flex-col items-center gap-3 max-w-md mx-auto text-center">
            <div className="text-[20px] font-semibold text-ink">No documents yet</div>
            <div className="text-[13px] text-ink-muted">
              Drop your first bank statement, credit-card bill, or broker report on the Upload page. The dashboard fills in automatically as soon as a file is parsed.
            </div>
            <Link to="/upload">
              <Button variant="primary" size="sm" leadingIcon={<UploadIcon size={13} />}>
                Open upload page
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {docs.map(d => {
              const recordCount = d.derivedRecordIds?.length ?? 0;
              return (
                <Card key={d.fileHash} padding={12} className="flex flex-col gap-3 min-w-0">
                  <div className="flex items-start gap-2">
                    <div className="w-7 h-7 rounded-sm bg-surface-alt text-ink-muted flex items-center justify-center shrink-0">
                      <Doc size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-ink truncate">{d.name}</div>
                      <div className="text-[10px] font-mono text-ink-subtle mt-0.5">
                        {fmtBytes(d.sizeBytes)} · {d.parserId?.replace('parser.', '') ?? 'unknown'}
                      </div>
                    </div>
                    {d.passwordRequired && <span className="text-ink-subtle"><Lock size={12} /></span>}
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge tone={statusTone[d.parseStatus]} dot>{statusLabel[d.parseStatus]}</Badge>
                    {recordCount > 0 && (
                      <span className="text-[11px] text-ink-muted font-mono">{recordCount} records</span>
                    )}
                  </div>
                  {d.driveSyncStatus && (
                    <div className="flex items-center justify-between text-[10px] text-ink-muted">
                      <Badge tone={driveTone[d.driveSyncStatus]}>
                        <Drive size={10} />
                        <span className="ml-1">{driveLabel[d.driveSyncStatus]}</span>
                      </Badge>
                      {d.driveFileId && (
                        <span className="font-mono text-ink-subtle truncate max-w-[100px]" title={d.driveFileId}>
                          {d.driveFileId.slice(0, 8)}…
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[11px] text-ink-subtle">
                    <span>{formatDate(d.uploadedAt, { short: true })}</span>
                    <button
                      onClick={() => {
                        if (confirm(`Remove ${d.name} and all derived records?`)) {
                          store.removeDocument(d.fileHash);
                        }
                      }}
                      className="text-ink-subtle hover:text-loss"
                    >
                      Remove
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
