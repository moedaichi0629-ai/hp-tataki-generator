"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import common from "@/styles/common.module.css";
import Breadcrumbs from "@/components/Breadcrumbs";
import VerifiableField from "./VerifiableField";
import type { FieldVerificationStatus, Store, VerificationState, VerifiableStoreField } from "@/types/store";

interface FormState {
  name: string;
  industry: string;
  category: string;
  description: string;
  address: string;
  lat: string;
  lng: string;
  phoneNumber: string;
  businessHours: string;
  closedDays: string;
  priceRange: string;
  nearestStation: string;
  parkingInfo: string;
  paymentMethods: string;
  accessibilityInfo: string;
  googleMapsUrl: string;
  officialWebsiteUrl: string;
  bookingSiteUrl: string;
  instagramUrl: string;
  xUrl: string;
  facebookUrl: string;
  otherSnsUrls: string;
}

function toFormState(store: Store): FormState {
  return {
    name: store.name,
    industry: store.industry ?? "",
    category: store.category ?? "",
    description: store.description ?? "",
    address: store.address ?? "",
    lat: store.lat != null ? String(store.lat) : "",
    lng: store.lng != null ? String(store.lng) : "",
    phoneNumber: store.phoneNumber ?? "",
    businessHours: (store.businessHours ?? []).join("\n"),
    closedDays: store.closedDays ?? "",
    priceRange: store.priceRange ?? "",
    nearestStation: store.nearestStation ?? "",
    parkingInfo: store.parkingInfo ?? "",
    paymentMethods: (store.paymentMethods ?? []).join("\n"),
    accessibilityInfo: store.accessibilityInfo ?? "",
    googleMapsUrl: store.googleMapsUrl ?? "",
    officialWebsiteUrl: store.officialWebsiteUrl ?? "",
    bookingSiteUrl: store.bookingSiteUrl ?? "",
    instagramUrl: store.instagramUrl ?? "",
    xUrl: store.xUrl ?? "",
    facebookUrl: store.facebookUrl ?? "",
    otherSnsUrls: (store.otherSnsUrls ?? []).join("\n"),
  };
}

function splitLines(value: string): string[] | null {
  const lines = value
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  return lines.length > 0 ? lines : null;
}

type LoadState = { status: "loading" } | { status: "error"; message: string } | { status: "done" };

export default function StoreEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });
  const [form, setForm] = useState<FormState | null>(null);
  const [initialSnapshot, setInitialSnapshot] = useState<string>("");
  const [verificationState, setVerificationState] = useState<VerificationState>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/stores/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "店舗情報の取得に失敗しました。");
        if (!cancelled) {
          const store = data.store as Store;
          const formState = toFormState(store);
          setForm(formState);
          setInitialSnapshot(JSON.stringify(formState));
          setVerificationState(store.verificationState ?? {});
          setLoadState({ status: "done" });
        }
      } catch (err) {
        if (!cancelled) {
          setLoadState({
            status: "error",
            message: err instanceof Error ? err.message : "店舗情報の取得に失敗しました。",
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const isDirty = form !== null && JSON.stringify(form) !== initialSnapshot;

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const updateVerification = (field: VerifiableStoreField, status: FieldVerificationStatus) => {
    setVerificationState((prev) => ({ ...prev, [field]: status }));
  };

  const handleBack = () => {
    if (isDirty && !window.confirm("保存していない変更があります。編集を中止して戻りますか？")) {
      return;
    }
    router.push(`/stores/${id}`);
  };

  const handleSubmit = async () => {
    if (!form) return;
    setSaving(true);
    setError(null);

    const lat = form.lat.trim() ? Number(form.lat) : null;
    const lng = form.lng.trim() ? Number(form.lng) : null;
    if (form.lat.trim() && Number.isNaN(lat as number)) {
      setError("緯度は数値で入力してください。");
      setSaving(false);
      return;
    }
    if (form.lng.trim() && Number.isNaN(lng as number)) {
      setError("経度は数値で入力してください。");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(`/api/stores/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          industry: form.industry || null,
          category: form.category || null,
          description: form.description || null,
          address: form.address || null,
          lat,
          lng,
          phoneNumber: form.phoneNumber || null,
          businessHours: splitLines(form.businessHours),
          closedDays: form.closedDays || null,
          priceRange: form.priceRange || null,
          nearestStation: form.nearestStation || null,
          parkingInfo: form.parkingInfo || null,
          paymentMethods: splitLines(form.paymentMethods),
          accessibilityInfo: form.accessibilityInfo || null,
          googleMapsUrl: form.googleMapsUrl || null,
          officialWebsiteUrl: form.officialWebsiteUrl || null,
          bookingSiteUrl: form.bookingSiteUrl || null,
          instagramUrl: form.instagramUrl || null,
          xUrl: form.xUrl || null,
          facebookUrl: form.facebookUrl || null,
          otherSnsUrls: splitLines(form.otherSnsUrls),
          verificationState,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "保存に失敗しました。");

      setInitialSnapshot(JSON.stringify(form));
      router.push(`/stores/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  };

  if (loadState.status === "loading") return <p className={common.loading}>読み込み中...</p>;
  if (loadState.status === "error" || !form) {
    return <p className={common.errorText}>{loadState.status === "error" ? loadState.message : "店舗が見つかりませんでした。"}</p>;
  }

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "ダッシュボード", href: "/" },
          { label: "店舗一覧", href: "/stores" },
          { label: form.name || "店舗", href: `/stores/${id}` },
          { label: "編集" },
        ]}
      />
      <div className={common.pageHeader}>
        <h1 className={common.pageTitle}>店舗情報編集</h1>
      </div>

      {error && <p className={common.errorText}>{error}</p>}

      <div className={common.card} style={{ marginBottom: 20 }}>
        <h2 className={common.sectionTitle}>基本情報</h2>
        <div className={common.formGrid}>
          <VerifiableField
            label="店舗名"
            field="name"
            value={form.name}
            status={verificationState.name ?? "unconfirmed"}
            onValueChange={(v) => updateField("name", v)}
            onStatusChange={updateVerification}
          />
          <VerifiableField
            label="業種"
            field="industry"
            value={form.industry}
            status={verificationState.industry ?? "unconfirmed"}
            onValueChange={(v) => updateField("industry", v)}
            onStatusChange={updateVerification}
          />
          <VerifiableField
            label="カテゴリ"
            field="category"
            value={form.category}
            status={verificationState.category ?? "unconfirmed"}
            onValueChange={(v) => updateField("category", v)}
            onStatusChange={updateVerification}
          />
          <VerifiableField
            label="住所"
            field="address"
            value={form.address}
            status={verificationState.address ?? "unconfirmed"}
            onValueChange={(v) => updateField("address", v)}
            onStatusChange={updateVerification}
          />
          <VerifiableField
            label="電話番号"
            field="phoneNumber"
            value={form.phoneNumber}
            status={verificationState.phoneNumber ?? "unconfirmed"}
            onValueChange={(v) => updateField("phoneNumber", v)}
            onStatusChange={updateVerification}
          />
          <VerifiableField
            label="定休日"
            field="closedDays"
            value={form.closedDays}
            status={verificationState.closedDays ?? "unconfirmed"}
            onValueChange={(v) => updateField("closedDays", v)}
            onStatusChange={updateVerification}
          />
          <VerifiableField
            label="価格帯"
            field="priceRange"
            value={form.priceRange}
            status={verificationState.priceRange ?? "unconfirmed"}
            onValueChange={(v) => updateField("priceRange", v)}
            onStatusChange={updateVerification}
          />
          <VerifiableField
            label="最寄駅"
            field="nearestStation"
            value={form.nearestStation}
            status={verificationState.nearestStation ?? "unconfirmed"}
            onValueChange={(v) => updateField("nearestStation", v)}
            onStatusChange={updateVerification}
          />
          <VerifiableField
            label="駐車場情報"
            field="parkingInfo"
            value={form.parkingInfo}
            status={verificationState.parkingInfo ?? "unconfirmed"}
            onValueChange={(v) => updateField("parkingInfo", v)}
            onStatusChange={updateVerification}
          />
          <label className={common.field}>
            <span>緯度</span>
            <input value={form.lat} onChange={(e) => updateField("lat", e.target.value)} placeholder="-90〜90" />
          </label>
          <label className={common.field}>
            <span>経度</span>
            <input value={form.lng} onChange={(e) => updateField("lng", e.target.value)} placeholder="-180〜180" />
          </label>
        </div>

        <div className={common.formGrid}>
          <VerifiableField
            label="店舗説明"
            field="description"
            value={form.description}
            status={verificationState.description ?? "unconfirmed"}
            onValueChange={(v) => updateField("description", v)}
            onStatusChange={updateVerification}
            multiline
          />
          <VerifiableField
            label="営業時間（1行に1件）"
            field="businessHours"
            value={form.businessHours}
            status={verificationState.businessHours ?? "unconfirmed"}
            onValueChange={(v) => updateField("businessHours", v)}
            onStatusChange={updateVerification}
            multiline
          />
          <VerifiableField
            label="支払い方法（1行に1件）"
            field="paymentMethods"
            value={form.paymentMethods}
            status={verificationState.paymentMethods ?? "unconfirmed"}
            onValueChange={(v) => updateField("paymentMethods", v)}
            onStatusChange={updateVerification}
            multiline
          />
          <VerifiableField
            label="バリアフリー情報"
            field="accessibilityInfo"
            value={form.accessibilityInfo}
            status={verificationState.accessibilityInfo ?? "unconfirmed"}
            onValueChange={(v) => updateField("accessibilityInfo", v)}
            onStatusChange={updateVerification}
            multiline
          />
        </div>
      </div>

      <div className={common.card} style={{ marginBottom: 20 }}>
        <h2 className={common.sectionTitle}>外部リンク</h2>
        <div className={common.formGrid}>
          <label className={common.field}>
            <span>GoogleマップURL</span>
            <input value={form.googleMapsUrl} onChange={(e) => updateField("googleMapsUrl", e.target.value)} />
          </label>
          <label className={common.field}>
            <span>公式サイトURL</span>
            <input value={form.officialWebsiteUrl} onChange={(e) => updateField("officialWebsiteUrl", e.target.value)} />
          </label>
          <label className={common.field}>
            <span>予約サイトURL</span>
            <input value={form.bookingSiteUrl} onChange={(e) => updateField("bookingSiteUrl", e.target.value)} />
          </label>
          <label className={common.field}>
            <span>Instagram URL</span>
            <input value={form.instagramUrl} onChange={(e) => updateField("instagramUrl", e.target.value)} />
          </label>
          <label className={common.field}>
            <span>X URL</span>
            <input value={form.xUrl} onChange={(e) => updateField("xUrl", e.target.value)} />
          </label>
          <label className={common.field}>
            <span>Facebook URL</span>
            <input value={form.facebookUrl} onChange={(e) => updateField("facebookUrl", e.target.value)} />
          </label>
          <label className={`${common.field} ${common.fieldFullWidth}`}>
            <span>その他SNS URL（1行に1件）</span>
            <textarea value={form.otherSnsUrls} onChange={(e) => updateField("otherSnsUrls", e.target.value)} />
          </label>
        </div>
      </div>

      <div className={common.toolbar}>
        <button type="button" className={common.buttonPrimary} onClick={handleSubmit} disabled={saving}>
          {saving ? "保存中..." : "保存する"}
        </button>
        <button type="button" className={common.button} onClick={handleBack}>
          詳細画面に戻る
        </button>
      </div>
    </div>
  );
}
