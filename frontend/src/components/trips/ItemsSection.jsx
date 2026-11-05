import React, { useState } from 'react';
import { Plus, RotateCw } from 'lucide-react';
import Button from '../ui/Button';
import { Alert, Card, Spinner } from '../ui/Feedback';
import { ConfirmDialog, Modal } from '../ui/Modal';

/**
 * Shared shell for a trip sub-resource list: header, add/edit modal,
 * delete confirmation, loading / error / empty states.
 */
export default function ItemsSection({
  title,
  icon: Icon,
  description,
  addLabel,
  noun,
  state,
  renderItem,
  renderForm,
  emptyText,
}) {
  const { items, loading, error, reload, create, update, remove } = state;
  const [editing, setEditing] = useState(null); // null | 'new' | item
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const closeForm = () => setEditing(null);

  const handleSubmit = async (body) => {
    if (editing === 'new') await create(body);
    else await update(editing.id, body);
    closeForm();
  };

  const confirmDelete = async () => {
    setDeleteBusy(true);
    setDeleteError('');
    try {
      await remove(deleting.id);
      setDeleting(null);
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-start gap-3">
          <span className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5" />
          </span>
          <div>
            <h2 className="font-semibold text-slate-900">{title}</h2>
            <p className="text-sm text-slate-500">{description}</p>
          </div>
        </div>
        <Button size="sm" icon={Plus} onClick={() => setEditing('new')} className="flex-shrink-0">
          <span className="hidden sm:inline">{addLabel}</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <Alert action={<Button size="sm" variant="secondary" icon={RotateCw} onClick={reload}>Retry</Button>}>{error}</Alert>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-8 border border-dashed border-slate-200 rounded-xl">{emptyText}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id}>
              {renderItem(item, { items, onEdit: () => setEditing(item), onDelete: () => setDeleting(item) })}
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={editing !== null}
        title={editing === 'new' ? addLabel : `Edit ${noun}`}
        onClose={closeForm}
      >
        {editing !== null &&
          renderForm({
            item: editing === 'new' ? null : editing,
            onSubmit: handleSubmit,
            onCancel: closeForm,
          })}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title={`Delete ${noun}?`}
        message={`This ${noun} will be removed from the trip. This cannot be undone.`}
        loading={deleteBusy}
        error={deleteError}
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleting(null);
          setDeleteError('');
        }}
      />
    </Card>
  );
}
