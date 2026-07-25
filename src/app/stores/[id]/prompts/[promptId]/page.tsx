"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import common from "@/styles/common.module.css";
import Breadcrumbs from "@/components/Breadcrumbs";
import ConfirmDialog from "@/components/ConfirmDialog";
import { PROMPT_AI_TOOL_OPTIONS, PROMPT_TYPE_LABELS } from "@/lib/promptOptions";
import type { GeneratedPrompt, PromptAiTool } from "@/types/prompt";
import type { Store } from "@/types/store";
import type { StoreImage } from "@/types/image";

type LoadState = { status: "loading" } | { status: "error"; message: string } | { status: "done" };

export default function PromptEditorPage({ params }: { params: Promise<{ id: string; promptId: string }> }) {
  const { id, promptId } = use(params);
  const router = useRouter();

  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });
  const [prompt, setPrompt] = useState<GeneratedPrompt | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [latestImageUpdatedAt, setLatestImageUpdatedAt] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [aiTool, setAiTool] = useState<PromptAiTool>("raddyai");
  const [customAiTool, setCustomAiTool] = useState("");
  const [content, setContent] = useState("");
  const [memo, setMemo] = useState("");
  const [isUsed, setIsUsed] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  const [regenerateOpen, setRegenerateOpen] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [regenerateWithPolish, setRegenerateWithPolish] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const load = async () => {
    try {
      const [promptRes, storeRes, imagesRes] = await Promise.all([
        fetch(`/api/stores/${id}/prompts/${promptId}`),
        fetch(`/api/stores/${id}`),
        fetch(`/api/stores/${id}/images`),
      ]);
      const [promptJson, storeJson, imagesJson] = await Promise.all([promptRes.json(), storeRes.json(), imagesRes.json()]);

      if (!promptRes.ok) throw new Error(promptJson.error ?? "プロンプトの取得に失敗しました。");

      const p = promptJson.prompt as GeneratedPrompt;
      setPrompt(p);
      setTitle(p.title);
      setAiTool(p.aiTool);
      setCustomAiTool(p.customAiTool ?? "");
      setContent(p.content);
      setMemo(p.memo ?? "");
      setIsUsed(p.isUsed);

      if (storeRes.ok) setStore(storeJson.store as Store);
      if (imagesRes.ok) {
        const images = (imagesJson.images ?? []) as StoreImage[];
        const latest = images.reduce<string | null>((max, img) => {
          if (!max || new Date(img.updatedAt) > new Date(max)) return img.updatedAt;
          return max;
        }, null);
        setLatestImageUpdatedAt(latest);
      }

      setLoadState({ status: "done" });
    } catch (err) {
      setLoadState({ status: "error", message: err instanceof Error ? err.message : "プロンプトの取得に失敗しました。" });
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load on mount
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, promptId]);

  const isStale =
    prompt &&
    store &&
    ((prompt.storeUpdatedAtSnapshot && new Date(store.updatedAt) > new Date(prompt.storeUpdatedAtSnapshot)) ||
      (prompt.imagesUpdatedAtSnapshot && latestImageUpdatedAt && new Date(latestImageUpdatedAt) > new Date(prompt.imagesUpdatedAtSnapshot)));

  const save = async () => {
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/stores/${id}/prompts/${promptId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          aiTool,
          customAiTool: aiTool === "other" ? customAiTool : null,
          content,
          isUsed,
          memo,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "保存に失敗しました。");
      setPrompt(json.prompt as GeneratedPrompt);
      setSaved(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopyMessage("プロンプトをコピーしました。");
    } catch {
      setCopyMessage("コピーに失敗しました。手動で選択してコピーしてください。");
    }
    setTimeout(() => setCopyMessage(null), 3000);
  };

  const regenerate = async () => {
    setRegenerateOpen(false);
    setRegenerating(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/stores/${id}/prompts/${promptId}/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usePolish: regenerateWithPolish }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "再生成に失敗しました。");
      const p = json.prompt as GeneratedPrompt;
      setPrompt(p);
      setContent(p.content);
      setAiTool(p.aiTool);
      setCustomAiTool(p.customAiTool ?? "");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "再生成に失敗しました。");
    } finally {
      setRegenerating(false);
    }
  };

  const remove = async () => {
    setDeleteOpen(false);
    try {
      const res = await fetch(`/api/stores/${id}/prompts/${promptId}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "削除に失敗しました。");
      router.push(`/stores/${id}`);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "削除に失敗しました。");
    }
  };

  if (loadState.status === "loading") return <p className={common.loading}>読み込み中...</p>;
  if (loadState.status === "error" || !prompt) {
    return <p className={common.errorText}>{loadState.status === "error" ? loadState.message : "プロンプトが見つかりませんでした。"}</p>;
  }

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "ダッシュボード", href: "/" },
          { label: "店舗一覧", href: "/stores" },
          { label: store?.name ?? "店舗", href: `/stores/${id}` },
          { label: "プロンプト編集" },
        ]}
      />
      <div className={common.pageHeader}>
        <h1 className={common.pageTitle}>プロンプト編集</h1>
      </div>

      {isStale && (
        <p className={common.errorText} style={{ marginBottom: 16 }}>
          店舗情報が更新されています。このプロンプトは最新情報を反映していない可能性があります。
        </p>
      )}

      <div className={common.card} style={{ marginBottom: 20 }}>
        <div className={common.formGrid}>
          <label className={common.field}>
            <span>タイトル</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className={common.field}>
            <span>使用AIツール</span>
            <select value={aiTool} onChange={(e) => setAiTool(e.target.value as PromptAiTool)}>
              {PROMPT_AI_TOOL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          {aiTool === "other" && (
            <label className={common.field}>
              <span>ツール名</span>
              <input value={customAiTool} onChange={(e) => setCustomAiTool(e.target.value)} />
            </label>
          )}
          <label className={common.field}>
            <span>プロンプト種類</span>
            <input value={PROMPT_TYPE_LABELS[prompt.promptType]} disabled />
          </label>
        </div>
        <label className={common.checkboxField}>
          <input type="checkbox" checked={isUsed} onChange={(e) => setIsUsed(e.target.checked)} />
          使用済み
        </label>
        <label className={common.field}>
          <span>メモ</span>
          <textarea value={memo} onChange={(e) => setMemo(e.target.value)} />
        </label>
      </div>

      <div className={common.card}>
        <div className={common.toolbar} style={{ justifyContent: "space-between" }}>
          <h2 className={common.sectionTitle}>プロンプト本文</h2>
          <div className={common.toolbar}>
            <button type="button" className={common.button} onClick={copyToClipboard}>
              全文コピー
            </button>
            <label className={common.checkboxField}>
              <input type="checkbox" checked={regenerateWithPolish} onChange={(e) => setRegenerateWithPolish(e.target.checked)} />
              AIで整える
            </label>
            <button type="button" className={common.button} onClick={() => setRegenerateOpen(true)} disabled={regenerating}>
              {regenerating ? "再生成中..." : "再生成"}
            </button>
          </div>
        </div>

        {copyMessage && <p className={common.successText}>{copyMessage}</p>}

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{ minHeight: 420, fontFamily: "monospace", fontSize: 13 }}
        />

        {saveError && <p className={common.errorText}>{saveError}</p>}

        <div className={common.toolbar}>
          <button type="button" className={common.buttonPrimary} onClick={save} disabled={saving}>
            {saving ? "保存中..." : "保存する"}
          </button>
          {saved && <span className={common.successText}>保存しました</span>}
          <button type="button" className={common.buttonDanger} onClick={() => setDeleteOpen(true)}>
            削除
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={regenerateOpen}
        title="プロンプトを再生成しますか？"
        message="再生成すると、現在編集している内容が上書きされます。続行しますか？"
        confirmLabel="再生成する"
        onConfirm={regenerate}
        onCancel={() => setRegenerateOpen(false)}
      />
      <ConfirmDialog
        open={deleteOpen}
        title="プロンプトを削除しますか？"
        message={`「${prompt.title}」を削除します。この操作は取り消せません。`}
        onConfirm={remove}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
