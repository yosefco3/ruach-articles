export type ArticleAttachment = {
  id: number;
  fileName: string;
  fileUrl: string;
  fileSize: number;
};

const AUDIO_EXT = /\.(mp3|m4a|aac|ogg|oga|wav|flac|opus)(\?.*)?$/i;

/** Audio attachments get an inline player above the download card. */
export function isAudioAttachment(file: Pick<ArticleAttachment, "fileName" | "fileUrl">): boolean {
  return AUDIO_EXT.test(file.fileName) || AUDIO_EXT.test(file.fileUrl);
}

/** "1.2 MB" above a megabyte, "830.5 KB" below — the old card always said KB. */
export function formatAttachmentSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function DownloadCard({ file }: { file: ArticleAttachment }) {
  return (
    <a
      href={file.fileUrl}
      download={file.fileName}
      className="flex items-center gap-3 p-3 bg-secondary/50 hover:bg-secondary rounded-lg transition-colors group"
    >
      <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded flex items-center justify-center group-hover:bg-primary/20 transition-colors">
        <svg aria-hidden="true" focusable="false" className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
          {file.fileName}
        </p>
        <p className="text-xs text-muted-foreground">{formatAttachmentSize(file.fileSize)}</p>
      </div>
      <svg aria-hidden="true" focusable="false" className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </a>
  );
}

export default function ArticleAttachments({ attachments }: { attachments: ArticleAttachment[] }) {
  if (attachments.length === 0) return null;
  const audio = attachments.filter(isAudioAttachment);
  const others = attachments.filter((f) => !isAudioAttachment(f));

  return (
    <section className="mb-10">
      <h2 className="font-display font-bold text-lg text-foreground mb-4">קבצים מצורפים</h2>
      {audio.length > 0 && (
        <div className="space-y-4 mb-4">
          {audio.map((file) => (
            <div key={file.id} className="p-4 bg-secondary/50 rounded-lg">
              <p className="text-sm font-medium text-foreground mb-2">{file.fileName}</p>
              {/* preload="none": the page must not pull a 20MB file for every reader */}
              <audio controls preload="none" src={file.fileUrl} className="w-full">
                <a href={file.fileUrl} download={file.fileName}>{file.fileName}</a>
              </audio>
              <p className="text-xs text-muted-foreground mt-2">
                <a href={file.fileUrl} download={file.fileName} className="hover:text-primary transition-colors">
                  {`הורדה (${formatAttachmentSize(file.fileSize)})`}
                </a>
              </p>
            </div>
          ))}
        </div>
      )}
      {others.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {others.map((file) => (
            <DownloadCard key={file.id} file={file} />
          ))}
        </div>
      )}
    </section>
  );
}
