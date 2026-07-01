import { useNotes } from '../hooks/useNotes';
import { Input } from './ui';

export interface AiSourceValue {
  source: 'topic' | 'note';
  topic: string;
  noteId: string;
}

export const emptySource: AiSourceValue = { source: 'topic', topic: '', noteId: '' };

/** Source selector shared by the AI quiz + flashcard generators. */
export function AiSourcePicker({
  value,
  onChange,
}: {
  value: AiSourceValue;
  onChange: (v: AiSourceValue) => void;
}) {
  const { data: notes } = useNotes();
  return (
    <div className="space-y-2">
      <div className="flex gap-1 rounded-lg bg-slate-100 p-1 text-xs dark:bg-slate-800">
        {(['topic', 'note'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange({ ...value, source: s })}
            className={`flex-1 rounded px-2 py-1 ${
              value.source === s ? 'bg-white shadow dark:bg-slate-700' : 'text-slate-500'
            }`}
          >
            {s === 'topic' ? 'From a topic' : 'From a note'}
          </button>
        ))}
      </div>
      {value.source === 'topic' ? (
        <Input
          value={value.topic}
          onChange={(e) => onChange({ ...value, topic: e.target.value })}
          placeholder="e.g. Photosynthesis, causes of WWI…"
        />
      ) : (
        <select
          value={value.noteId}
          onChange={(e) => onChange({ ...value, noteId: e.target.value })}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
        >
          <option value="">Select a note…</option>
          {notes?.data.map((n) => (
            <option key={n.id} value={n.id}>
              {n.title}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

/** Build the request payload; returns null if the source is incomplete. */
export function sourcePayload(v: AiSourceValue): { source: 'topic' | 'note'; topic?: string; noteId?: string } | null {
  if (v.source === 'topic') return v.topic.trim() ? { source: 'topic', topic: v.topic.trim() } : null;
  return v.noteId ? { source: 'note', noteId: v.noteId } : null;
}
