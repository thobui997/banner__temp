import { AdvancedSearchParams, FileStorage } from '@gsf/admin/app/shared/types';

export interface TemplateRequest {
  campusId: number;
  name: string;
  ratio: number;
  jsonFile: string;
  description?: string;
  thumbnailFileId?: number;
  htmlFile?: string;
}

export interface TemplateResponse {
  campusId: number;
  description: string;
  ratio: number;
  thumbnailFileId: number;
  thumbnailFile: FileStorage;
  templateContent: TemplateContent;
  id: number;
  name: string;
  createdOn: string;
  createdBy: number;
  createdByName: string;
}

export interface TemplateContent {
  templateId: number;
  htmlFile: string;
  jsonFile: string;
}

export interface TemplateUpdateRequest {
  templateId: number;
  name: string;
  jsonFile: string;
  ratio: number;
  description?: string;
  thumbnailFileId?: number;
  htmlFile?: string;
}

export interface TemplateListRequest extends AdvancedSearchParams {
  createdByIds?: number[];
}
