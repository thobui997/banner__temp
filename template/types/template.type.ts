import { FileStorage } from '@gsf/admin/app/shared/types';

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
  id: number;
  campusId: number;
  name: string;
  description: string;
  ratio: number;
  thumbnailFileId: number;
  thumbnailFile: FileStorage;
  templateContent: TemplateContent;
}

export interface TemplateContent {
  templateId: number;
  htmlFile: string;
  jsonFile: string;
}
