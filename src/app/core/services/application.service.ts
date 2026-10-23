import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  MerchantApplication,
  ApplicationFilter,
  PaginatedResult,
  ApplicationMetrics,
} from '../models/application.model';

@Injectable({
  providedIn: 'root',
})
export class ApplicationService {
  private readonly http = inject(HttpClient);

  getApplications(filter: ApplicationFilter): Observable<PaginatedResult<MerchantApplication>> {
    let params = new HttpParams()
      .set('page', filter.page.toString())
      .set('pageSize', filter.pageSize.toString())
      .set('sortBy', filter.sortBy)
      .set('sortDirection', filter.sortDirection);

    if (filter.searchQuery) {
      params = params.set('searchQuery', filter.searchQuery);
    }
    if (filter.status && filter.status !== 'ALL') {
      params = params.set('status', filter.status);
    }
    if (filter.riskTier && filter.riskTier !== 'ALL') {
      params = params.set('riskTier', filter.riskTier);
    }
    if (filter.assignedTo && filter.assignedTo !== 'ALL') {
      params = params.set('assignedTo', filter.assignedTo);
    }
    if (filter.salesRepId && filter.salesRepId !== 'ALL') {
      params = params.set('salesRepId', filter.salesRepId);
    }

    return this.http.get<PaginatedResult<MerchantApplication>>('/api/applications', { params });
  }

  getApplicationById(id: string): Observable<MerchantApplication> {
    return this.http.get<MerchantApplication>(`/api/applications/${id}`);
  }

  getMetrics(): Observable<ApplicationMetrics> {
    return this.http.get<ApplicationMetrics>('/api/applications/metrics');
  }

  createApplication(appData: Partial<MerchantApplication>): Observable<MerchantApplication> {
    return this.http.post<MerchantApplication>('/api/applications', appData);
  }

  saveDraft(id: string, draftData: Partial<MerchantApplication>): Observable<any> {
    return this.http.patch(`/api/applications/${id}/draft`, draftData);
  }

  recordDecision(
    applicationId: string,
    decisionPayload: {
      decision: 'APPROVE' | 'REJECT' | 'REQUEST_INFO' | 'FLAG_RISK';
      riskTier: 'LOW' | 'MEDIUM' | 'HIGH';
      notes: string;
      conditions?: string;
      reviewerId: string;
      reviewerName: string;
    }
  ): Observable<MerchantApplication> {
    return this.http.post<MerchantApplication>(
      `/api/applications/${applicationId}/decision`,
      decisionPayload
    );
  }

  reassignApplication(
    applicationId: string,
    payload: { reviewerId: string; reviewerName: string; adminName: string }
  ): Observable<MerchantApplication> {
    return this.http.post<MerchantApplication>(
      `/api/applications/${applicationId}/reassign`,
      payload
    );
  }
}

