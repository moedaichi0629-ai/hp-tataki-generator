"use client";

import { useEffect, useState } from "react";
import common from "@/styles/common.module.css";
import styles from "./detail.module.css";
import ConfirmDialog from "@/components/ConfirmDialog";
import OfficialWebsiteStatusSelect from "@/components/OfficialWebsiteStatusSelect";
import { FIELD_VERIFICATION_STATUS_OPTIONS, NOTE_TYPE_OPTIONS, NOTE_TYPE_LABELS } from "@/lib/storeStatus";
import type {
  FieldVerificationStatus,
  NoteType,
  OfficialWebsiteStatus,
  Store,
  StoreNote,
} from "@/types/store";

const EMPTY_NOTE_FORM = { title: "", body: "", noteType: "other" as NoteType };

export default function ManagementNotesTab({
  store,
  onStoreChanged,
}: {
  store: Store;
  onStoreChanged: (updated: Store) => void;
}) {
  const [officialWebsiteStatus, setOfficialWebsiteStatus] = useState(store.officialWebsiteStatus);
  const [infoVerificationStatus, setInfoVerificationStatus] = useState(store.infoVerificationStatus);
  const [isSalesTarget, setIsSalesTarget] = useState(store.isSalesTarget);
  const [memo, setMemo] = useState(store.memo ?? "");
  const [savingManagement, setSavingManagement] = useState(false);
  const [managementError, setManagementError] = useState<string | null>(null);
  const [managementSaved, setManagementSaved] = useState(false);

  const [notes, setNotes] = useState<StoreNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [noteForm, setNoteForm] = useState(EMPTY_NOTE_FORM);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StoreNote | null>(null);

  const loadNotes = async () => {
    setNotesLoading(true);
    setNotesError(null);
    try {
      const res = await fetch(`/api/stores/${store.id}/notes`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "メモの取得に失敗しました。");
      setNotes(data.notes as StoreNote[]);
    } catch (err) {
      setNotesError(err instanceof Error ? err.message : "メモの取得に失敗しました。");
    } finally {
      setNotesLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load on mount
    loadNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.id]);

  const saveManagement = async () => {
    setSavingManagement(true);
    setManagementError(null);
    setManagementSaved(false);
    try {
      const res = await fetch(`/api/stores/${store.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ officialWebsiteStatus, infoVerificationStatus, isSalesTarget, memo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "保存に失敗しました。");
      onStoreChanged(data.store as Store);
      setManagementSaved(true);
    } catch (err) {
      setManagementError(err instanceof Error ? err.message : "保存に失敗しました。");
    } finally {
      setSavingManagement(false);
    }
  };

  const startCreateNote = () => {
    setEditingNoteId(null);
    setNoteForm(EMPTY_NOTE_FORM);
    setShowNoteForm(true);
  };

  const startEditNote = (note: StoreNote) => {
    setEditingNoteId(note.id);
    setNoteForm({ title: note.title ?? "", body: note.body, noteType: note.noteType });
    setShowNoteForm(true);
  };

  const submitNote = async () => {
    if (!noteForm.body.trim()) {
      setNotesError("本文を入力してください。");
      return;
    }
    setNotesError(null);
    try {
      const url = editingNoteId ? `/api/stores/${store.id}/notes/${editingNoteId}` : `/api/stores/${store.id}/notes`;
      const res = await fetch(url, {
        method: editingNoteId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(noteForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "保存に失敗しました。");
      setShowNoteForm(false);
      setEditingNoteId(null);
      await loadNotes();
    } catch (err) {
      setNotesError(err instanceof Error ? err.message : "保存に失敗しました。");
    }
  };

  const removeNote = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    try {
      const res = await fetch(`/api/stores/${store.id}/notes/${target.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "削除に失敗しました。");
      setNotes((prev) => prev.filter((n) => n.id !== target.id));
    } catch (err) {
      setNotesError(err instanceof Error ? err.message : "削除に失敗しました。");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className={common.card}>
        <h2 className={common.sectionTitle}>管理情報</h2>
        <div className={common.formGrid}>
          <label className={common.field}>
            <span>公式サイト確認状態</span>
            <OfficialWebsiteStatusSelect
              value={officialWebsiteStatus}
              onChange={(v: OfficialWebsiteStatus) => setOfficialWebsiteStatus(v)}
            />
          </label>
          <label className={common.field}>
            <span>情報確認状態</span>
            <select
              value={infoVerificationStatus}
              onChange={(e) => setInfoVerificationStatus(e.target.value as FieldVerificationStatus)}
            >
              {FIELD_VERIFICATION_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className={common.checkboxField} style={{ alignSelf: "end" }}>
            <input type="checkbox" checked={isSalesTarget} onChange={(e) => setIsSalesTarget(e.target.checked)} />
            営業対象にする
          </label>
        </div>
        <label className={common.field}>
          <span>メモ</span>
          <textarea value={memo} onChange={(e) => setMemo(e.target.value)} />
        </label>
        {managementError && <p className={common.errorText}>{managementError}</p>}
        <div className={common.toolbar}>
          <button type="button" className={common.buttonPrimary} onClick={saveManagement} disabled={savingManagement}>
            {savingManagement ? "保存中..." : "保存する"}
          </button>
          {managementSaved && <span className={common.successText}>保存しました</span>}
        </div>
      </div>

      <div className={common.card}>
        <div className={common.toolbar} style={{ justifyContent: "space-between" }}>
          <h2 className={common.sectionTitle}>メモ一覧</h2>
          <button type="button" className={common.buttonPrimary} onClick={startCreateNote}>
            メモを追加
          </button>
        </div>

        {notesError && <p className={common.errorText}>{notesError}</p>}

        {showNoteForm && (
          <div className={common.card} style={{ background: "var(--surface-muted)" }}>
            <div className={common.formGrid}>
              <label className={common.field}>
                <span>タイトル</span>
                <input value={noteForm.title} onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })} />
              </label>
              <label className={common.field}>
                <span>メモ種別</span>
                <select
                  value={noteForm.noteType}
                  onChange={(e) => setNoteForm({ ...noteForm, noteType: e.target.value as NoteType })}
                >
                  {NOTE_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className={`${common.field} ${common.fieldFullWidth}`}>
                <span>本文</span>
                <textarea value={noteForm.body} onChange={(e) => setNoteForm({ ...noteForm, body: e.target.value })} />
              </label>
            </div>
            <div className={common.toolbar}>
              <button type="button" className={common.buttonPrimary} onClick={submitNote}>
                保存する
              </button>
              <button type="button" className={common.button} onClick={() => setShowNoteForm(false)}>
                キャンセル
              </button>
            </div>
          </div>
        )}

        {notesLoading ? (
          <p className={common.loading}>読み込み中...</p>
        ) : notes.length === 0 ? (
          <p className={common.emptyState}>まだメモがありません。</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {notes.map((note) => (
              <div key={note.id} className={styles.noteItem}>
                <div className={common.toolbar} style={{ justifyContent: "space-between" }}>
                  <strong>{note.title || "（無題）"}</strong>
                  <span className={common.helpText}>{NOTE_TYPE_LABELS[note.noteType]}</span>
                </div>
                <p style={{ fontSize: 14, whiteSpace: "pre-line" }}>{note.body}</p>
                <span className={common.helpText}>{new Date(note.createdAt).toLocaleString("ja-JP")}</span>
                <div className={common.toolbar}>
                  <button type="button" className={common.button} onClick={() => startEditNote(note)}>
                    編集
                  </button>
                  <button type="button" className={common.buttonDanger} onClick={() => setDeleteTarget(note)}>
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="メモを削除しますか？"
        message={deleteTarget ? `「${deleteTarget.title || "（無題）"}」を削除します。` : ""}
        onConfirm={removeNote}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
