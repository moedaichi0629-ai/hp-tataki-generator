"use client";

import { useEffect, useMemo, useState } from "react";
import common from "@/styles/common.module.css";
import ConfirmDialog from "@/components/ConfirmDialog";
import { SECTION_TYPE_OPTIONS, SECTION_TYPE_LABELS, RECOMMENDED_SECTION_TYPES } from "@/lib/promptOptions";
import type { SectionType, WebsiteSection } from "@/types/prompt";
import type { StoreImage } from "@/types/image";

interface EditState {
  heading: string;
  content: string;
  cta: string;
  instructions: string;
  imageIds: string[];
}

function toEditState(s: WebsiteSection): EditState {
  return {
    heading: s.heading ?? "",
    content: s.content ?? "",
    cta: s.cta ?? "",
    instructions: s.instructions ?? "",
    imageIds: s.imageIds,
  };
}

export default function SectionsManager({ storeId }: { storeId: string }) {
  const [sections, setSections] = useState<WebsiteSection[]>([]);
  const [images, setImages] = useState<StoreImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addType, setAddType] = useState<SectionType | "">("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WebsiteSection | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sectionsRes, imagesRes] = await Promise.all([
        fetch(`/api/stores/${storeId}/website-requirements/sections`),
        fetch(`/api/stores/${storeId}/images`),
      ]);
      const sectionsData = await sectionsRes.json();
      const imagesData = await imagesRes.json();
      if (!sectionsRes.ok) throw new Error(sectionsData.error ?? "セクション一覧の取得に失敗しました。");
      setSections(sectionsData.sections as WebsiteSection[]);
      if (imagesRes.ok) setImages(imagesData.images as StoreImage[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "セクション一覧の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load on mount
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const usedTypes = useMemo(() => new Set(sections.map((s) => s.sectionType)), [sections]);
  const availableOptions = SECTION_TYPE_OPTIONS.filter((o) => !usedTypes.has(o.value));

  const addSection = async (sectionType: SectionType) => {
    setError(null);
    try {
      const res = await fetch(`/api/stores/${storeId}/website-requirements/sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "セクションの追加に失敗しました。");
      setSections((prev) => [...prev, data.section as WebsiteSection]);
      setAddType("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "セクションの追加に失敗しました。");
    }
  };

  const addRecommended = async () => {
    const toAdd = RECOMMENDED_SECTION_TYPES.filter((t) => !usedTypes.has(t));
    for (const t of toAdd) {
      await addSection(t);
    }
  };

  const toggleEnabled = async (section: WebsiteSection) => {
    try {
      const res = await fetch(`/api/stores/${storeId}/website-requirements/sections/${section.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !section.enabled }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "更新に失敗しました。");
      setSections((prev) => prev.map((s) => (s.id === section.id ? (data.section as WebsiteSection) : s)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新に失敗しました。");
    }
  };

  const startEdit = (section: WebsiteSection) => {
    setExpandedId(expandedId === section.id ? null : section.id);
    setEditState(toEditState(section));
  };

  const toggleImage = (imageId: string) => {
    setEditState((prev) =>
      prev ? { ...prev, imageIds: prev.imageIds.includes(imageId) ? prev.imageIds.filter((i) => i !== imageId) : [...prev.imageIds, imageId] } : prev
    );
  };

  const saveEdit = async (section: WebsiteSection) => {
    if (!editState) return;
    setSavingId(section.id);
    setError(null);
    try {
      const res = await fetch(`/api/stores/${storeId}/website-requirements/sections/${section.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heading: editState.heading || null,
          content: editState.content || null,
          cta: editState.cta || null,
          instructions: editState.instructions || null,
          imageIds: editState.imageIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "保存に失敗しました。");
      setSections((prev) => prev.map((s) => (s.id === section.id ? (data.section as WebsiteSection) : s)));
      setExpandedId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました。");
    } finally {
      setSavingId(null);
    }
  };

  const removeSection = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    try {
      const res = await fetch(`/api/stores/${storeId}/website-requirements/sections/${target.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "削除に失敗しました。");
      setSections((prev) => prev.filter((s) => s.id !== target.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "削除に失敗しました。");
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= sections.length) return;
    const reordered = [...sections];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    setSections(reordered);
    try {
      await fetch(`/api/stores/${storeId}/website-requirements/sections/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: reordered.map((s) => s.id) }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <p className={common.loading}>読み込み中...</p>;

  return (
    <div className={common.card}>
      <div className={common.toolbar} style={{ justifyContent: "space-between" }}>
        <h2 className={common.sectionTitle}>セクション構成</h2>
        {sections.length === 0 && (
          <button type="button" className={common.button} onClick={addRecommended}>
            おすすめセクションを追加
          </button>
        )}
      </div>
      <p className={common.helpText}>
        HPに含めるセクションを追加し、表示順・見出し・掲載内容・使用画像を設定してください。おすすめは初期候補として提示するだけなので、自由に追加・削除・変更できます。
      </p>

      {error && <p className={common.errorText}>{error}</p>}

      <div className={common.toolbar}>
        <select value={addType} onChange={(e) => setAddType(e.target.value as SectionType | "")}>
          <option value="">セクションを選択して追加</option>
          {availableOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          className={common.buttonPrimary}
          disabled={!addType}
          onClick={() => addType && addSection(addType)}
        >
          追加
        </button>
      </div>

      {sections.length === 0 ? (
        <p className={common.emptyState}>まだセクションが追加されていません。</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {sections.map((section, index) => (
            <div key={section.id} style={{ border: "1px solid var(--border-color)", borderRadius: 10, padding: 12 }}>
              <div className={common.toolbar} style={{ justifyContent: "space-between" }}>
                <label className={common.checkboxField}>
                  <input type="checkbox" checked={section.enabled} onChange={() => toggleEnabled(section)} />
                  <strong>{SECTION_TYPE_LABELS[section.sectionType]}</strong>
                </label>
                <div style={{ display: "flex", gap: 6 }}>
                  <button type="button" className={common.button} onClick={() => move(index, -1)} disabled={index === 0}>
                    ↑
                  </button>
                  <button
                    type="button"
                    className={common.button}
                    onClick={() => move(index, 1)}
                    disabled={index === sections.length - 1}
                  >
                    ↓
                  </button>
                  <button type="button" className={common.button} onClick={() => startEdit(section)}>
                    {expandedId === section.id ? "閉じる" : "編集"}
                  </button>
                  <button type="button" className={common.buttonDanger} onClick={() => setDeleteTarget(section)}>
                    削除
                  </button>
                </div>
              </div>

              {expandedId === section.id && editState && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
                  <label className={common.field}>
                    <span>見出し案</span>
                    <input value={editState.heading} onChange={(e) => setEditState({ ...editState, heading: e.target.value })} />
                  </label>
                  <label className={common.field}>
                    <span>掲載内容</span>
                    <textarea value={editState.content} onChange={(e) => setEditState({ ...editState, content: e.target.value })} />
                  </label>
                  <label className={common.field}>
                    <span>CTA（行動喚起）</span>
                    <input value={editState.cta} onChange={(e) => setEditState({ ...editState, cta: e.target.value })} />
                  </label>
                  <label className={common.field}>
                    <span>補足指示</span>
                    <textarea
                      value={editState.instructions}
                      onChange={(e) => setEditState({ ...editState, instructions: e.target.value })}
                    />
                  </label>
                  <div className={common.field}>
                    <span>使用画像</span>
                    {images.length === 0 ? (
                      <p className={common.helpText}>登録済みの画像がありません。</p>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 6 }}>
                        {images.map((img) => (
                          <label key={img.id} className={common.checkboxField}>
                            <input
                              type="checkbox"
                              checked={editState.imageIds.includes(img.id)}
                              onChange={() => toggleImage(img.id)}
                            />
                            {img.name || "（無題）"}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className={common.toolbar}>
                    <button
                      type="button"
                      className={common.buttonPrimary}
                      onClick={() => saveEdit(section)}
                      disabled={savingId === section.id}
                    >
                      {savingId === section.id ? "保存中..." : "保存する"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="セクションを削除しますか？"
        message={deleteTarget ? `「${SECTION_TYPE_LABELS[deleteTarget.sectionType]}」を削除します。` : ""}
        onConfirm={removeSection}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
