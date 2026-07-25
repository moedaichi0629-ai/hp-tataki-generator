import type { Store, StoreService, StoreStrengths } from "@/types/store";
import type { StoreImage } from "@/types/image";
import type { PromptAiTool, WebsiteRequirements, WebsiteSection } from "@/types/prompt";
import { renderTemplate } from "./renderTemplate";
import {
  buildActionBlock,
  buildChecklistBlock,
  buildDevWorkflowBlock,
  buildImagesBlock,
  buildProhibitionsBlock,
  buildPurposeBlock,
  buildSectionsBlock,
  buildServicesBlock,
  buildStoreInfoBlock,
  buildStrengthsBlock,
  buildTargetBlock,
  buildTechBlock,
} from "./blocks";

const DEV_WORKFLOW_TOOLS: PromptAiTool[] = ["claude_code", "cursor"];

export interface BuildPromptInput {
  store: Store;
  services: StoreService[];
  strengths: StoreStrengths | null;
  requirements: WebsiteRequirements;
  sections: WebsiteSection[];
  images: StoreImage[];
  templateBody: string;
  aiTool: PromptAiTool;
}

export function buildHpInitialCreationPrompt(input: BuildPromptInput): string {
  const { store, services, strengths, requirements, sections, images, templateBody, aiTool } = input;
  const imagesById = new Map(images.map((img) => [img.id, img]));
  const isSalesSample = requirements.websiteType === "sales_sample";

  const blocks: Record<string, string> = {
    PURPOSE_BLOCK: buildPurposeBlock(requirements),
    STORE_INFO_BLOCK: buildStoreInfoBlock(store),
    TARGET_BLOCK: buildTargetBlock(requirements),
    STRENGTHS_BLOCK: buildStrengthsBlock(strengths),
    SERVICES_BLOCK: buildServicesBlock(services),
    ACTION_BLOCK: buildActionBlock(requirements),
    SECTIONS_BLOCK: buildSectionsBlock(sections, imagesById),
    IMAGES_BLOCK: buildImagesBlock(images, isSalesSample),
    TECH_BLOCK: buildTechBlock(requirements),
    PROHIBITIONS_BLOCK: buildProhibitionsBlock(),
    CHECKLIST_BLOCK: buildChecklistBlock(requirements),
    DEV_WORKFLOW_BLOCK: DEV_WORKFLOW_TOOLS.includes(aiTool) ? buildDevWorkflowBlock() : "",
  };

  return renderTemplate(templateBody, blocks).trim() + "\n";
}
