import type {
  SocialImageReferenceInsertRow,
  SocialImageReferenceRow,
  SocialImageReferenceUpdateRow,
  StoreImageInsertRow,
  StoreImageRow,
  StoreImageUpdateRow,
} from "@/types/supabaseSchema";
import type {
  ImageUsageType,
  SocialImageReference,
  SocialImageReferenceInsert,
  SocialImageReferenceUpdate,
  StoreImage,
  StoreImageInsert,
  StoreImageUpdate,
} from "@/types/image";

export function rowToStoreImage(row: StoreImageRow): StoreImage {
  return {
    id: row.id,
    storeId: row.store_id,
    name: row.name,
    imageType: row.image_type,
    sourceType: row.source_type,
    googlePhotoResourceName: row.google_photo_resource_name,
    storageUrl: row.storage_url,
    externalUrl: row.external_url,
    snsPostUrl: row.sns_post_url,
    authorName: row.author_name,
    googleMapsUri: row.google_maps_uri,
    width: row.width,
    height: row.height,
    fileSize: row.file_size,
    mimeType: row.mime_type,
    isSelected: row.is_selected,
    usageTypes: (row.usage_types ?? []) as ImageUsageType[],
    permissionStatus: row.permission_status,
    displayOrder: row.display_order,
    memo: row.memo,
    fetchedAt: row.fetched_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function storeImageInsertToRow(storeId: string, input: StoreImageInsert): StoreImageInsertRow {
  return {
    store_id: storeId,
    name: input.name,
    image_type: input.imageType,
    source_type: input.sourceType,
    google_photo_resource_name: input.googlePhotoResourceName,
    storage_url: input.storageUrl,
    external_url: input.externalUrl,
    sns_post_url: input.snsPostUrl,
    author_name: input.authorName,
    google_maps_uri: input.googleMapsUri,
    width: input.width,
    height: input.height,
    file_size: input.fileSize,
    mime_type: input.mimeType,
    is_selected: input.isSelected,
    usage_types: input.usageTypes,
    permission_status: input.permissionStatus,
    display_order: input.displayOrder,
    memo: input.memo,
    fetched_at: input.fetchedAt,
  };
}

export function storeImageUpdateToRow(input: StoreImageUpdate): StoreImageUpdateRow {
  return {
    name: input.name,
    image_type: input.imageType,
    is_selected: input.isSelected,
    usage_types: input.usageTypes,
    permission_status: input.permissionStatus,
    display_order: input.displayOrder,
    memo: input.memo,
  };
}

export function rowToSocialImageReference(row: SocialImageReferenceRow): SocialImageReference {
  return {
    id: row.id,
    storeId: row.store_id,
    snsType: row.sns_type,
    postUrl: row.post_url,
    description: row.description,
    plannedUse: row.planned_use,
    confirmationStatus: row.confirmation_status,
    memo: row.memo,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function socialImageReferenceInsertToRow(
  storeId: string,
  input: SocialImageReferenceInsert
): SocialImageReferenceInsertRow {
  return {
    store_id: storeId,
    sns_type: input.snsType,
    post_url: input.postUrl,
    description: input.description,
    planned_use: input.plannedUse,
    confirmation_status: input.confirmationStatus,
    memo: input.memo,
  };
}

export function socialImageReferenceUpdateToRow(
  input: SocialImageReferenceUpdate
): SocialImageReferenceUpdateRow {
  return {
    sns_type: input.snsType,
    post_url: input.postUrl,
    description: input.description,
    planned_use: input.plannedUse,
    confirmation_status: input.confirmationStatus,
    memo: input.memo,
  };
}
