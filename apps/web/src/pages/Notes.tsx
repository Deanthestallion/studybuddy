import { FileText, Plus, Save, Search, Sparkles, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCreateNote, useDeleteNote, useNotes, useUpdateNote } from '../hooks/useNotes';
import {
  type GeneratedNote,
  useAiStatus,
  useGenerateNote,
  useSummarizeNote,
} from '../hooks/useAI';
import { apiError } from '../lib/api';
import type { Note } from '../lib/types';
import { Button, Card, EmptyState, Input, PageHeader, Spinner, Textarea } from '../components/ui';

/** AI note tools: write a study note from a topic, or summarize the open note. */
function NotesAiPanel({
  currentNoteId,
  onDraft,
}: {
  currentNoteId?: string;
  onDraft: (note: GeneratedNote) => void;
}) {
  const status = useAiStatus();
  const genNote = useGenerateNote();
  const summarize = useSummarizeNote();
  const [topic, setTopic] = useState('');
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [error, setError] = useState('');

  if (!status.data) return null;
  if (!status.data.enabled) {
    return (
      <div className="mb-3 rounded-lg border border-dashed border-slate-300 p-2 text-xs text-slate-500 dark:border-slate-700">
        ✨ AI note tools activate once an <code>OPENAI_API_KEY</code> is set on the server.
      </div>
    );
  }

  function writeNote() {
    if (!topic.trim()) return setError('Enter a topic to explain.');
    setError('');
    genNote.mutate(
      { topic: topic.trim(), length },
      { onSuccess: onDraft, onError: (e) => setError(apiError(e)) },
    );
  }
  function summarizeNote() {
    if (!currentNoteId) return;
    setError('');
    summarize.mutate(
      { noteId: currentNoteId },
      { onSuccess: onDraft, onError: (e) => setError(apiError(e)) },
    );
  }

  return (
    <div className="mb-3 rounded-xl border border-brand-200 bg-brand-50/60 p-3 dark:border-brand-600/30 dark:bg-brand-600/10">
      <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-brand-700 dark:text-brand-100">
        <Sparkles size={15} /> AI note tools
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Topic to explain, e.g. Mitosis"
          className="min-w-[160px] flex-1"
        />
        <select
          value={length}
          onChange={(e) => setLength(e.target.value as 'short' | 'medium' | 'long')}
          className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
        >
          <option value="short">Short</option>
          <option value="medium">Medium</option>
          <option value="long">Long</option>
        </select>
        <Button onClick={writeNote} loading={genNote.isPending}>
          <Sparkles size={15} /> Write note
        </Button>
        <Button
          variant="secondary"
          onClick={summarizeNote}
          loading={summarize.isPending}
          disabled={!currentNoteId}
          title={currentNoteId ? 'Summarize the open note' : 'Open a saved note to summarize it'}
        >
          <FileText size={15} /> Summarize this note
        </Button>
      </div>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      <p className="mt-2 text-[11px] text-slate-400">
        Output loads into the editor as a new note — review &amp; edit, then Save.
      </p>
    </div>
  );
}

export default function Notes() {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useNotes({ search: search || undefined });
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();

  const [selected, setSelected] = useState<Note | null>(null);
  const [draft, setDraft] = useState({ title: '', folder: 'General', content: '' });

  useEffect(() => {
    if (selected) setDraft({ title: selected.title, folder: selected.folder, content: selected.content });
  }, [selected]);

  function newNote() {
    setSelected(null);
    setDraft({ title: '', folder: 'General', content: '' });
  }

  function save() {
    if (!draft.title.trim()) return;
    if (selected) {
      updateNote.mutate({ id: selected.id, input: draft });
    } else {
      createNote.mutate(draft, { onSuccess: (res) => setSelected(res.data.data as Note) });
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notes"
        subtitle="Capture and search everything you learn"
        action={
          <Button onClick={newNote}>
            <Plus size={16} /> New note
          </Button>
        }
      />

      <div className="grid gap-6 md:grid-cols-[280px_1fr]">
        <Card className="h-fit">
          <div className="relative mb-3">
            <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes…"
              className="pl-9"
            />
          </div>
          {isLoading || !data ? (
            <Spinner />
          ) : data.data.length === 0 ? (
            <EmptyState title="No notes" />
          ) : (
            <ul className="space-y-1">
              {data.data.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => setSelected(n)}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                      selected?.id === n.id ? 'bg-brand-50 dark:bg-brand-600/15' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <p className="truncate font-medium">{n.title}</p>
                    <p className="truncate text-xs text-slate-500">{n.folder}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <NotesAiPanel
            currentNoteId={selected?.id}
            onDraft={(n) => {
              setSelected(null);
              setDraft((d) => ({ title: n.title, folder: d.folder || 'General', content: n.content }));
            }}
          />
          <div className="mb-3 flex flex-wrap gap-2">
            <Input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="Title"
              className="flex-1"
            />
            <Input
              value={draft.folder}
              onChange={(e) => setDraft({ ...draft, folder: e.target.value })}
              placeholder="Folder"
              className="w-40"
            />
          </div>
          <Textarea
            value={draft.content}
            onChange={(e) => setDraft({ ...draft, content: e.target.value })}
            placeholder="Start writing…"
            className="min-h-[320px]"
          />
          <div className="mt-3 flex justify-between">
            {selected ? (
              <Button variant="danger" onClick={() => { deleteNote.mutate(selected.id); newNote(); }}>
                <Trash2 size={16} /> Delete
              </Button>
            ) : (
              <span />
            )}
            <Button onClick={save} loading={createNote.isPending || updateNote.isPending}>
              <Save size={16} /> Save
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
