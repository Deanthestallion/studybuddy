import { Plus, Save, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCreateNote, useDeleteNote, useNotes, useUpdateNote } from '../hooks/useNotes';
import type { Note } from '../lib/types';
import { Button, Card, EmptyState, Input, PageHeader, Spinner, Textarea } from '../components/ui';

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
