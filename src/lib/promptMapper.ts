import type {
  GeneratedPromptInsertRow,
  GeneratedPromptRow,
  GeneratedPromptUpdateRow,
  PromptTemplateRow,
  WebsiteRequirementsRow,
  WebsiteRequirementsUpsertRow,
  WebsiteSectionInsertRow,
  WebsiteSectionRow,
  WebsiteSectionUpdateRow,
} from "@/types/supabaseSchema";
import type {
  DeliveryFormat,
  DeploymentMethod,
  GeneratedPrompt,
  GeneratedPromptUpdate,
  PrimaryAction,
  PromptAiTool,
  PromptGenerationMethod,
  PromptTemplate,
  PromptType,
  SectionType,
  SupportedDevice,
  TechnologyChoice,
  UpdateFriendliness,
  WebsitePurpose,
  WebsiteRequirements,
  WebsiteRequirementsUpdate,
  WebsiteSection,
  WebsiteSectionInsert,
  WebsiteSectionUpdate,
  WebsiteType,
} from "@/types/prompt";

export function rowToWebsiteRequirements(row: WebsiteRequirementsRow): WebsiteRequirements {
  return {
    id: row.id,
    storeId: row.store_id,
    purposes: (row.purposes ?? []) as WebsitePurpose[],
    websiteType: row.website_type as WebsiteType | null,
    targetAudience: row.target_audience,
    mainMessage: row.main_message,
    keyStrengthsNote: row.key_strengths_note,
    primaryAction: row.primary_action as PrimaryAction | null,
    contactMethod: row.contact_method,
    reservationMethod: row.reservation_method,
    excludedInformation: row.excluded_information,
    notes: row.notes,
    supplementaryInstructions: row.supplementary_instructions,
    technology: row.technology as TechnologyChoice | null,
    technologyOther: row.technology_other,
    deploymentMethod: row.deployment_method as DeploymentMethod | null,
    deploymentMethodOther: row.deployment_method_other,
    supportedDevices: (row.supported_devices ?? []) as SupportedDevice[],
    seoEnabled: row.seo_enabled,
    accessibilityEnabled: row.accessibility_enabled,
    mapEnabled: row.map_enabled,
    snsEnabled: row.sns_enabled,
    formEnabled: row.form_enabled,
    animationEnabled: row.animation_enabled,
    updateFriendliness: row.update_friendliness as UpdateFriendliness | null,
    externalIntegrations: row.external_integrations,
    deliveryFormat: row.delivery_format as DeliveryFormat | null,
    deliveryFormatOther: row.delivery_format_other,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function websiteRequirementsUpdateToRow(
  storeId: string,
  input: WebsiteRequirementsUpdate
): WebsiteRequirementsUpsertRow {
  return {
    store_id: storeId,
    purposes: input.purposes,
    website_type: input.websiteType,
    target_audience: input.targetAudience,
    main_message: input.mainMessage,
    key_strengths_note: input.keyStrengthsNote,
    primary_action: input.primaryAction,
    contact_method: input.contactMethod,
    reservation_method: input.reservationMethod,
    excluded_information: input.excludedInformation,
    notes: input.notes,
    supplementary_instructions: input.supplementaryInstructions,
    technology: input.technology,
    technology_other: input.technologyOther,
    deployment_method: input.deploymentMethod,
    deployment_method_other: input.deploymentMethodOther,
    supported_devices: input.supportedDevices,
    seo_enabled: input.seoEnabled,
    accessibility_enabled: input.accessibilityEnabled,
    map_enabled: input.mapEnabled,
    sns_enabled: input.snsEnabled,
    form_enabled: input.formEnabled,
    animation_enabled: input.animationEnabled,
    update_friendliness: input.updateFriendliness,
    external_integrations: input.externalIntegrations,
    delivery_format: input.deliveryFormat,
    delivery_format_other: input.deliveryFormatOther,
  };
}

export function rowToWebsiteSection(row: WebsiteSectionRow): WebsiteSection {
  return {
    id: row.id,
    websiteRequirementId: row.website_requirement_id,
    sectionType: row.section_type as SectionType,
    enabled: row.enabled,
    displayOrder: row.display_order,
    heading: row.heading,
    content: row.content,
    imageIds: row.image_ids ?? [],
    cta: row.cta,
    instructions: row.instructions,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function websiteSectionInsertToRow(
  websiteRequirementId: string,
  input: WebsiteSectionInsert
): WebsiteSectionInsertRow {
  return {
    website_requirement_id: websiteRequirementId,
    section_type: input.sectionType,
    heading: input.heading,
    content: input.content,
    image_ids: input.imageIds,
    cta: input.cta,
    instructions: input.instructions,
    display_order: input.displayOrder,
  };
}

export function websiteSectionUpdateToRow(input: WebsiteSectionUpdate): WebsiteSectionUpdateRow {
  return {
    enabled: input.enabled,
    display_order: input.displayOrder,
    heading: input.heading,
    content: input.content,
    image_ids: input.imageIds,
    cta: input.cta,
    instructions: input.instructions,
  };
}

export function rowToPromptTemplate(row: PromptTemplateRow): PromptTemplate {
  return {
    id: row.id,
    aiTool: row.ai_tool as PromptAiTool,
    promptType: row.prompt_type as PromptType,
    version: row.version,
    templateBody: row.template_body,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function rowToGeneratedPrompt(row: GeneratedPromptRow): GeneratedPrompt {
  return {
    id: row.id,
    storeId: row.store_id,
    websiteRequirementId: row.website_requirement_id,
    title: row.title,
    promptType: row.prompt_type as PromptType,
    aiTool: row.ai_tool as PromptAiTool,
    customAiTool: row.custom_ai_tool,
    content: row.content,
    storeUpdatedAtSnapshot: row.store_updated_at_snapshot,
    imagesUpdatedAtSnapshot: row.images_updated_at_snapshot,
    templateVersion: row.template_version,
    generationMethod: row.generation_method as PromptGenerationMethod,
    isUsed: row.is_used,
    memo: row.memo,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function generatedPromptInsertToRow(input: {
  storeId: string;
  websiteRequirementId: string | null;
  title: string;
  promptType: PromptType;
  aiTool: PromptAiTool;
  customAiTool: string | null;
  content: string;
  storeUpdatedAtSnapshot: string | null;
  imagesUpdatedAtSnapshot: string | null;
  templateVersion: number | null;
  generationMethod: PromptGenerationMethod;
}): GeneratedPromptInsertRow {
  return {
    store_id: input.storeId,
    website_requirement_id: input.websiteRequirementId,
    title: input.title,
    prompt_type: input.promptType,
    ai_tool: input.aiTool,
    custom_ai_tool: input.customAiTool,
    content: input.content,
    store_updated_at_snapshot: input.storeUpdatedAtSnapshot,
    images_updated_at_snapshot: input.imagesUpdatedAtSnapshot,
    template_version: input.templateVersion,
    generation_method: input.generationMethod,
  };
}

export function generatedPromptUpdateToRow(input: GeneratedPromptUpdate): GeneratedPromptUpdateRow {
  return {
    title: input.title,
    ai_tool: input.aiTool,
    custom_ai_tool: input.customAiTool,
    content: input.content,
    is_used: input.isUsed,
    memo: input.memo,
  };
}
