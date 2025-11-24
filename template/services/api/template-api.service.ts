import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  TemplateRequest,
  TemplateResponse,
  TemplateUpdateRequest
} from '../../types/template.type';
import {
  AdvancedSearchParams,
  BaseResponse,
  BaseResponseWithoutPaging
} from '@gsf/admin/app/shared/types';

@Injectable()
export class TemplateApiService {
  private httpClient = inject(HttpClient);
  private readonly baseUrl = 'api/v1/manager/template';

  createNewTemplate(payload: TemplateRequest) {
    return this.httpClient.post(`${this.baseUrl}/create`, payload);
  }

  getTemplates(payload: AdvancedSearchParams) {
    return this.httpClient.post<BaseResponse<TemplateResponse[]>>(
      `${this.baseUrl}/search`,
      payload
    );
  }

  getTemplateById(id: number) {
    return this.httpClient.get<BaseResponseWithoutPaging<TemplateResponse>>(
      `${this.baseUrl}/${id}`
    );
  }

  updateTemplate(payload: TemplateUpdateRequest) {
    return this.httpClient.post(`${this.baseUrl}/update`, payload);
  }
}
