import { HttpClient, HttpContext } from '@angular/common/http';
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
import { SHOW_LOADING } from '@gsf/app-config';

@Injectable()
export class TemplateApiService {
  private httpClient = inject(HttpClient);
  private readonly baseUrl = 'api/v1/manager/template';

  createNewTemplate(payload: TemplateRequest) {
    return this.httpClient.post(`${this.baseUrl}/create`, payload, {
      context: new HttpContext().set(SHOW_LOADING, true)
    });
  }

  getTemplates(payload: AdvancedSearchParams) {
    return this.httpClient.post<BaseResponse<TemplateResponse[]>>(
      `${this.baseUrl}/search`,
      payload,
      {
        context: new HttpContext().set(SHOW_LOADING, true)
      }
    );
  }

  getTemplateById(id: number) {
    return this.httpClient.get<BaseResponseWithoutPaging<TemplateResponse>>(
      `${this.baseUrl}/${id}`,
      {
        context: new HttpContext().set(SHOW_LOADING, true)
      }
    );
  }

  updateTemplate(payload: TemplateUpdateRequest) {
    return this.httpClient.post(`${this.baseUrl}/update`, payload, {
      context: new HttpContext().set(SHOW_LOADING, true)
    });
  }

  deleteTemplateById(id: number) {
    return this.httpClient.delete(`${this.baseUrl}/${id}`);
  }
}
