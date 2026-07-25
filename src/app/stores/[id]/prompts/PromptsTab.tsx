"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import common from "@/styles/common.module.css";
import ConfirmDialog from "@/components/ConfirmDialog";
import { checkPromptReadiness } from "@/lib/promptReadiness";
import { PROMPT_AI_TOOL_OPTIONS, PROMPT_AI_TOOL_LABELS, PROMPT_TYPE_LABELS } from "@/lib/promptOptions";
import type { Store, StoreService, StoreStrengths } from "@/types/store";
import type { StoreImage } from "@/types/image";
import type { GeneratedPrompt, PromptAiTool, WebsiteRequirements, WebsiteSection } from "@/types/prompt";

interface LoadedData {
  store: Store;
  services: StoreService[];
  strengths: StoreStrengths | null;
  requirements: WebsiteRequirements;
  sections: WebsiteSection[];
  images: StoreImage[];
}

function isPromptStale(prompt: GeneratedPrompt, data: LoadedData): boolean {
  const latestImage = data.images.reduce<string | null>((max, img) => {
    if (!max || new Date(img.updatedAt) > new Date(max)) return img.updatedAt;
    return max;
  }, null);
  const storeStale = prompt.storeUpdatedAtSnapshot
    ? new Date(data.store.updatedAt) > new Date(prompt.storeUpdatedAtSnapshot)
    : false;
  const imagesStale = prompt.imagesUpdatedAtSnapshot && latestImage
    ? new Date(latestImage) > new Date(prompt.imagesUpdatedAtSnapshot)
    : false;
  return storeStale || imagesStale;
}

export default function PromptsTab({ storeId }: { storeId: string }) {
  const router = useRouter();
  const [data, setData] = useState<LoadedData | null>(null);
  const [prompts, setPrompts] = useState<GeneratedPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [aiTool, setAiTool] = useState<PromptAiTool>("raddyai");
  const [customAiTool, setCustomAiTool] = useState("");
  const [usePolish, setUsePolish] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<GeneratedPrompt | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [storeRes, servicesRes, strengthsRes, requirementsRes, sectionsRes, imagesRes, promptsRes] = await Promise.all([
        fetch(`/api/stores/${storeId}`),
        fetch(`/api/stores/${storeId}/services`),
        fetch(`/api/stores/${storeId}/strengths`),
        fetch(`/api/stores/${storeId}/website-requirements`),
        fetch(`/api/stores/${storeId}/website-requirements/sections`),
        fetch(`/api/stores/${storeId}/images`),
        fetch(`/api/stores/${storeId}/prompts`),
      ]);
      const [storeJson, servicesJson, strengthsJson, requirementsJson, sectionsJson, imagesJson, promptsJson] = await Promise.all([
        storeRes.json(),
        servicesRes.json(),
        strengthsRes.json(),
        requirementsRes.json(),
        sectionsRes.json(),
        imagesRes.json(),
        promptsRes.json(),
      ]);

      if (!storeRes.ok) throw new Error(storeJson.error ?? "店舗情報の取得に失敗しました。");

      setData({
        store: storeJson.store as Store,
        services: (servicesJson.services ?? []) as StoreService[],
        strengths: (strengthsJson.strengths ?? null) as StoreStrengths | null,
        requirements: requirementsJson.requirements as WebsiteRequirements,
        sections: (sectionsJson.sections ?? []) as WebsiteSection[],
        images: (imagesJson.images ?? []) as StoreImage[],
      });
      setPrompts((promptsJson.prompts ?? []) as GeneratedPrompt[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "データの取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load on mount
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const readiness = data
    ? checkPromptReadiness({
        store: data.store,
        requirements: data.requirements,
        sections: data.sections,
        images: data.images,
        services: data.services,
        strengths: data.strengths,
        aiTool,
      })
    : null;

  const generate = async () => {
    if (aiTool === "other" && !customAiTool.trim()) {
      setGenError("「その他」を選択した場合はツール名を入力してください。");
      return;
    }
    setGenerating(true);
    setGenError(null);
    try {
      const res = await fetch(`/api/stores/${storeId}/prompts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aiTool,
          customAiTool: aiTool === "other" ? customAiTool : null,
          promptType: "hp_initial_creation",
          usePolish,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "プロンプトの生成に失敗しました。");
      router.push(`/stores/${storeId}/prompts/${json.prompt.id}`);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "プロンプトの生成に失敗しました。");
    } finally {
      setGenerating(false);
    }
  };

  const duplicate = async (prompt: GeneratedPrompt) => {
    try {
      const res = await fetch(`/api/stores/${storeId}/prompts/${prompt.id}/duplicate`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "複製に失敗しました。");
      setPrompts((prev) => [json.prompt as GeneratedPrompt, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "複製に失敗しました。");
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    try {
      const res = await fetch(`/api/stores/${storeId}/prompts/${target.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "削除に失敗しました。");
      setPrompts((prev) => prev.filter((p) => p.id !== target.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "削除に失敗しました。");
    }
  };

  if (loading || !data) return <p className={common.loading}>読み込み中...</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {error && <p className={common.errorText}>{error}</p>}

      <div className={common.card}>
        <h2 className={common.sectionTitle}>プロンプトを生成</h2>
        <div className={common.formGrid}>
          <label className={common.field}>
            <span>使用するAIツール</span>
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
        </div>
        <label className={common.checkboxField}>
          <input type="checkbox" checked={usePolish} onChange={(e) => setUsePolish(e.target.checked)} />
          AIで文章を整える（事実は変更しません。OpenAI APIキーが必要です）
        </label>

        {readiness && readiness.errors.length > 0 && (
          <div className={common.card} style={{ background: "var(--surface-muted)" }}>
            <p className={common.errorText} style={{ marginBottom: 6 }}>
              以下を先に入力してください（生成できません）
            </p>
            {readiness.errors.map((e) => (
              <p key={e} className={common.helpText}>
                ・{e}
              </p>
            ))}
          </div>
        )}
        {readiness && readiness.errors.length === 0 && readiness.warnings.length > 0 && (
          <div className={common.card} style={{ background: "var(--surface-muted)" }}>
            <p className={common.helpText} style={{ marginBottom: 6, color: "var(--warning)" }}>
              生成は可能ですが、以下の確認をおすすめします
            </p>
            {readiness.warnings.map((w) => (
              <p key={w} className={common.helpText}>
                ・{w}
              </p>
            ))}
          </div>
        )}

        {genError && <p className={common.errorText}>{genError}</p>}

        <div className={common.toolbar}>
          <button
            type="button"
            className={common.buttonPrimary}
            onClick={generate}
            disabled={generating || !readiness?.canGenerate}
          >
            {generating ? "生成中..." : "プロンプトを生成する"}
          </button>
        </div>
      </div>

      <div className={common.card}>
        <h2 className={common.sectionTitle}>この店舗のプロンプト履歴</h2>
        {prompts.length === 0 ? (
          <p className={common.emptyState}>まだプロンプトが生成されていません。</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {prompts.map((prompt) => {
              const stale = isPromptStale(prompt, data);
              return (
                <div key={prompt.id} style={{ border: "1px solid var(--border-color)", borderRadius: 10, padding: 12 }}>
                  <div className={common.toolbar} style={{ justifyContent: "space-between" }}>
                    <Link href={`/stores/${storeId}/prompts/${prompt.id}`} style={{ fontWeight: 600, color: "var(--accent)" }}>
                      {prompt.title}
                    </Link>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button type="button" className={common.button} onClick={() => duplicate(prompt)}>
                        複製
                      </button>
                      <button type="button" className={common.buttonDanger} onClick={() => setDeleteTarget(prompt)}>
                        削除
                      </button>
                    </div>
                  </div>
                  <div className={common.toolbar} style={{ marginTop: 6 }}>
                    <span className={common.helpText}>
                      {PROMPT_TYPE_LABELS[prompt.promptType]} / {prompt.aiTool === "other" ? prompt.customAiTool : PROMPT_AI_TOOL_LABELS[prompt.aiTool]}
                    </span>
                    <span className={common.helpText}>作成: {new Date(prompt.createdAt).toLocaleDateString("ja-JP")}</span>
                    {prompt.isUsed && <span className={common.successText}>使用済み</span>}
                    {stale && <span className={common.errorText}>店舗情報が更新されています</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="プロンプトを削除しますか？"
        message={deleteTarget ? `「${deleteTarget.title}」を削除します。` : ""}
        onConfirm={remove}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
