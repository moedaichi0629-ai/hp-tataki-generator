// prompt_templates.template_body 内の {{TOKEN}} を、事前に安全に生成されたMarkdown断片で置換する。
// 生の店舗データを直接テンプレート文字列へ結合することはない（値は必ずblocks.tsの関数を経由する）。
export function renderTemplate(templateBody: string, blocks: Record<string, string>): string {
  let result = templateBody;
  for (const [token, value] of Object.entries(blocks)) {
    result = result.split(`{{${token}}}`).join(value);
  }
  return result;
}
