import { HttpInterceptorFn, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { of, throwError, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import {
  MerchantApplication,
  ApplicationFilter,
  PaginatedResult,
  ApplicationMetrics,
} from '../models/application.model';

// In-memory data store with realistic synthetic merchant data (Zero real customer data)
let INITIAL_APPLICATIONS: MerchantApplication[] = [
  {
    id: 'app_1001',
    applicationNumber: 'APP-1001',
    status: 'UNDER_REVIEW',
    riskTier: 'LOW',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    submittedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    salesRepId: 'usr_sales_01',
    salesRepName: 'Sarah Jenkins',
    assignedReviewerId: 'usr_reviewer_02',
    assignedReviewerName: 'Marcus Vance',
    currentStep: 5,
    businessDetails: {
      legalName: 'Apex Mountain Goods LLC',
      dbaName: 'Apex Outdoor Gear',
      taxId: '82-4910293',
      businessType: 'LLC',
      incorporationDate: '2019-04-12',
      websiteUrl: 'https://apexoutdoorgear-demo.com',
      phone: '(415) 882-9011',
      address: {
        street: '142 Market Street',
        unit: 'Suite 400',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94105',
        country: 'US',
      },
      industryCategory: 'Retail - Outdoor Sporting Goods',
    },
    beneficialOwners: [
      {
        id: 'owner_1',
        fullName: 'David Sterling',
        title: 'Managing Director & CEO',
        ownershipPercentage: 60,
        ssn: '984-21-4829',
        dateOfBirth: '1982-08-14',
        email: 'david@apexoutdoorgear-demo.com',
        isPrimaryContact: true,
      },
      {
        id: 'owner_2',
        fullName: 'Rachel Sterling',
        title: 'COO',
        ownershipPercentage: 40,
        ssn: '984-21-9912',
        dateOfBirth: '1985-03-22',
        email: 'rachel@apexoutdoorgear-demo.com',
        isPrimaryContact: false,
      },
    ],
    bankingDetails: {
      bankName: 'Silicon Valley National Bank',
      accountHolderName: 'Apex Mountain Goods LLC',
      routingNumber: '121000358', // Valid ABA routing
      accountNumber: '882049182390',
      accountType: 'CHECKING',
    },
    processingProfile: {
      estimatedMonthlyVolume: 120000,
      averageTicketSize: 85,
      maximumTicketSize: 850,
      primaryCurrency: 'USD',
      isHighRiskIndustry: false,
      chargebackRatioHistory: '<0.5%',
    },
    attestation: {
      certifiedAccurate: true,
      authorizedSignerName: 'David Sterling',
      signatureDate: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    riskDecisions: [],
    history: [
      {
        id: 'hist_1',
        timestamp: new Date(Date.now() - 3 * 86400000).toISOString(),
        userId: 'usr_sales_01',
        userName: 'Sarah Jenkins',
        action: 'Application Submitted',
        newStatus: 'SUBMITTED',
      },
      {
        id: 'hist_2',
        timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
        userId: 'usr_admin_03',
        userName: 'Elena Rostova',
        action: 'Assigned to Reviewer',
        previousStatus: 'SUBMITTED',
        newStatus: 'UNDER_REVIEW',
        details: 'Assigned to Marcus Vance for initial underwriting review',
      },
    ],
  },
  {
    id: 'app_1002',
    applicationNumber: 'APP-1002',
    status: 'SUBMITTED',
    riskTier: 'MEDIUM',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    submittedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    salesRepId: 'usr_sales_01',
    salesRepName: 'Sarah Jenkins',
    currentStep: 5,
    businessDetails: {
      legalName: 'Nova Artisan Coffee Roasters Inc',
      dbaName: 'Nova Coffee',
      taxId: '47-3829104',
      businessType: 'CORPORATION',
      incorporationDate: '2021-09-01',
      websiteUrl: 'https://novacoffee-demo.org',
      phone: '(206) 555-0143',
      address: {
        street: '88 Pike Place',
        city: 'Seattle',
        state: 'WA',
        postalCode: '98101',
        country: 'US',
      },
      industryCategory: 'Food & Beverage',
    },
    beneficialOwners: [
      {
        id: 'owner_3',
        fullName: 'Mateo Rossi',
        title: 'Founder & Master Roaster',
        ownershipPercentage: 75,
        ssn: '439-01-3820',
        dateOfBirth: '1989-11-05',
        email: 'mateo@novacoffee-demo.org',
        isPrimaryContact: true,
      },
      {
        id: 'owner_4',
        fullName: 'Chloe Vance',
        title: 'VP Operations',
        ownershipPercentage: 25,
        ssn: '439-01-7781',
        dateOfBirth: '1992-06-18',
        email: 'chloe@novacoffee-demo.org',
        isPrimaryContact: false,
      },
    ],
    bankingDetails: {
      bankName: 'Northwest Community Credit Union',
      accountHolderName: 'Nova Artisan Coffee Roasters Inc',
      routingNumber: '011000015',
      accountNumber: '441092837119',
      accountType: 'CHECKING',
    },
    processingProfile: {
      estimatedMonthlyVolume: 45000,
      averageTicketSize: 28,
      maximumTicketSize: 250,
      primaryCurrency: 'USD',
      isHighRiskIndustry: false,
      chargebackRatioHistory: '<0.5%',
    },
    attestation: {
      certifiedAccurate: true,
      authorizedSignerName: 'Mateo Rossi',
      signatureDate: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    riskDecisions: [],
    history: [
      {
        id: 'hist_3',
        timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
        userId: 'usr_sales_01',
        userName: 'Sarah Jenkins',
        action: 'Application Submitted',
        newStatus: 'SUBMITTED',
      },
    ],
  },
  {
    id: 'app_1003',
    applicationNumber: 'APP-1003',
    status: 'APPROVED',
    riskTier: 'LOW',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    submittedAt: new Date(Date.now() - 9 * 86400000).toISOString(),
    salesRepId: 'usr_sales_01',
    salesRepName: 'Sarah Jenkins',
    assignedReviewerId: 'usr_reviewer_02',
    assignedReviewerName: 'Marcus Vance',
    currentStep: 5,
    businessDetails: {
      legalName: 'CloudScale Infrastructure Corp',
      dbaName: 'CloudScale API',
      taxId: '36-9281726',
      businessType: 'CORPORATION',
      incorporationDate: '2017-02-15',
      websiteUrl: 'https://cloudscale-demo.io',
      phone: '(312) 555-8900',
      address: {
        street: '222 W Adams St',
        unit: '24th Floor',
        city: 'Chicago',
        state: 'IL',
        postalCode: '60606',
        country: 'US',
      },
      industryCategory: 'B2B SaaS / Software',
    },
    beneficialOwners: [
      {
        id: 'owner_5',
        fullName: 'Alexander Wright',
        title: 'CEO & Co-Founder',
        ownershipPercentage: 55,
        ssn: '210-99-4401',
        dateOfBirth: '1980-04-10',
        email: 'alex@cloudscale-demo.io',
        isPrimaryContact: true,
      },
      {
        id: 'owner_6',
        fullName: 'Samantha Li',
        title: 'CTO & Co-Founder',
        ownershipPercentage: 45,
        ssn: '210-99-8812',
        dateOfBirth: '1984-07-29',
        email: 'sam@cloudscale-demo.io',
        isPrimaryContact: false,
      },
    ],
    bankingDetails: {
      bankName: 'JPMorgan Chase Bank, N.A.',
      accountHolderName: 'CloudScale Infrastructure Corp',
      routingNumber: '121000358',
      accountNumber: '992019482710',
      accountType: 'CHECKING',
    },
    processingProfile: {
      estimatedMonthlyVolume: 350000,
      averageTicketSize: 450,
      maximumTicketSize: 5000,
      primaryCurrency: 'USD',
      isHighRiskIndustry: false,
      chargebackRatioHistory: '<0.5%',
    },
    attestation: {
      certifiedAccurate: true,
      authorizedSignerName: 'Alexander Wright',
      signatureDate: new Date(Date.now() - 9 * 86400000).toISOString(),
    },
    riskDecisions: [
      {
        id: 'dec_1',
        reviewerId: 'usr_reviewer_02',
        reviewerName: 'Marcus Vance',
        decision: 'APPROVE',
        riskTier: 'LOW',
        notes: 'Low chargeback history, enterprise SaaS subscription model, verified bank credentials.',
        conditions: 'Standard standard 2-day rolling settlement schedule.',
        decidedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
      },
    ],
    history: [
      {
        id: 'hist_4',
        timestamp: new Date(Date.now() - 4 * 86400000).toISOString(),
        userId: 'usr_reviewer_02',
        userName: 'Marcus Vance',
        action: 'Application Approved',
        previousStatus: 'UNDER_REVIEW',
        newStatus: 'APPROVED',
        details: 'Approved with standard conditions',
      },
    ],
  },
  {
    id: 'app_1004',
    applicationNumber: 'APP-1004',
    status: 'INFO_REQUESTED',
    riskTier: 'HIGH',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    submittedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    salesRepId: 'usr_sales_01',
    salesRepName: 'Sarah Jenkins',
    assignedReviewerId: 'usr_reviewer_02',
    assignedReviewerName: 'Marcus Vance',
    currentStep: 5,
    businessDetails: {
      legalName: 'Vanguard Digital Assets Holdings',
      dbaName: 'Vanguard Exchange Services',
      taxId: '54-1928374',
      businessType: 'LLC',
      incorporationDate: '2023-01-20',
      websiteUrl: 'https://vanguardcrypto-demo.net',
      phone: '(305) 991-2300',
      address: {
        street: '1100 Brickell Bay Dr',
        city: 'Miami',
        state: 'FL',
        postalCode: '33131',
        country: 'US',
      },
      industryCategory: 'Digital Assets / Web3',
    },
    beneficialOwners: [
      {
        id: 'owner_7',
        fullName: 'Dmitri Volkov',
        title: 'Managing Partner',
        ownershipPercentage: 100,
        ssn: '772-11-9043',
        dateOfBirth: '1991-02-14',
        email: 'dmitri@vanguardcrypto-demo.net',
        isPrimaryContact: true,
      },
    ],
    bankingDetails: {
      bankName: 'Signature Commercial Trust',
      accountHolderName: 'Vanguard Digital Assets Holdings',
      routingNumber: '011000015',
      accountNumber: '110294827491',
      accountType: 'CHECKING',
    },
    processingProfile: {
      estimatedMonthlyVolume: 900000,
      averageTicketSize: 1200,
      maximumTicketSize: 25000,
      primaryCurrency: 'USD',
      isHighRiskIndustry: true,
      highRiskCategory: 'Crypto / Virtual Currency',
      highRiskExplanation: 'OTC crypto brokerage desk with strict AML/KYC checks in place.',
      chargebackRatioHistory: '0.5%-1%',
    },
    attestation: {
      certifiedAccurate: true,
      authorizedSignerName: 'Dmitri Volkov',
      signatureDate: new Date(Date.now() - 4 * 86400000).toISOString(),
    },
    riskDecisions: [
      {
        id: 'dec_2',
        reviewerId: 'usr_reviewer_02',
        reviewerName: 'Marcus Vance',
        decision: 'REQUEST_INFO',
        riskTier: 'HIGH',
        notes: 'High-volume digital asset broker requires 3 months of bank statements and proof of FinCEN MSB registration before approval.',
        decidedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      },
    ],
    history: [
      {
        id: 'hist_5',
        timestamp: new Date(Date.now() - 1 * 86400000).toISOString(),
        userId: 'usr_reviewer_02',
        userName: 'Marcus Vance',
        action: 'Information Requested',
        previousStatus: 'UNDER_REVIEW',
        newStatus: 'INFO_REQUESTED',
        details: 'Requested FinCEN MSB registration documentation',
      },
    ],
  },
  {
    id: 'app_1005',
    applicationNumber: 'APP-1005',
    status: 'DRAFT',
    riskTier: 'LOW',
    createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 60000).toISOString(),
    salesRepId: 'usr_sales_01',
    salesRepName: 'Sarah Jenkins',
    currentStep: 3,
    businessDetails: {
      legalName: 'Bluefin Sustainable Seafood Co',
      dbaName: 'Bluefin Direct',
      taxId: '20-9481920',
      businessType: 'LLC',
      incorporationDate: '2020-05-18',
      websiteUrl: 'https://bluefinseafood-demo.com',
      phone: '(508) 555-4921',
      address: {
        street: '45 Commercial Wharf',
        city: 'Boston',
        state: 'MA',
        postalCode: '02110',
        country: 'US',
      },
      industryCategory: 'E-commerce Specialty Food',
    },
    beneficialOwners: [
      {
        id: 'owner_8',
        fullName: 'Captain Gregory Hayes',
        title: 'Founder & Fleet Master',
        ownershipPercentage: 80,
        ssn: '019-48-2910',
        dateOfBirth: '1976-12-03',
        email: 'greg@bluefinseafood-demo.com',
        isPrimaryContact: true,
      },
      {
        id: 'owner_9',
        fullName: 'Brenda Hayes',
        title: 'CFO',
        ownershipPercentage: 20,
        ssn: '019-48-8821',
        dateOfBirth: '1979-09-15',
        email: 'brenda@bluefinseafood-demo.com',
        isPrimaryContact: false,
      },
    ],
    bankingDetails: {
      bankName: 'Eastern Harbor Bank',
      accountHolderName: 'Bluefin Sustainable Seafood Co',
      routingNumber: '011000015',
      accountNumber: '77291048123',
      accountType: 'CHECKING',
    },
    processingProfile: {
      estimatedMonthlyVolume: 65000,
      averageTicketSize: 140,
      maximumTicketSize: 600,
      primaryCurrency: 'USD',
      isHighRiskIndustry: false,
      chargebackRatioHistory: '<0.5%',
    },
    riskDecisions: [],
    history: [
      {
        id: 'hist_6',
        timestamp: new Date(Date.now() - 6 * 3600000).toISOString(),
        userId: 'usr_sales_01',
        userName: 'Sarah Jenkins',
        action: 'Draft Created',
        newStatus: 'DRAFT',
      },
    ],
  },
  {
    id: 'app_1006',
    applicationNumber: 'APP-1006',
    status: 'REJECTED',
    riskTier: 'HIGH',
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 86400000).toISOString(),
    submittedAt: new Date(Date.now() - 13 * 86400000).toISOString(),
    salesRepId: 'usr_sales_01',
    salesRepName: 'Sarah Jenkins',
    assignedReviewerId: 'usr_reviewer_02',
    assignedReviewerName: 'Marcus Vance',
    currentStep: 5,
    businessDetails: {
      legalName: 'Apex Health Nutra Labs Ltd',
      dbaName: 'Miracle Keto Drops',
      taxId: '88-1029384',
      businessType: 'CORPORATION',
      incorporationDate: '2024-01-05',
      websiteUrl: 'https://miracleketodrops-demo.com',
      phone: '(800) 555-0992',
      address: {
        street: '700 Las Vegas Blvd S',
        city: 'Las Vegas',
        state: 'NV',
        postalCode: '89101',
        country: 'US',
      },
      industryCategory: 'Nutraceuticals / Free Trial',
    },
    beneficialOwners: [
      {
        id: 'owner_10',
        fullName: 'Victor Thorne',
        title: 'Director',
        ownershipPercentage: 100,
        ssn: '592-30-1928',
        dateOfBirth: '1987-01-19',
        email: 'victor@miracleketo-demo.com',
        isPrimaryContact: true,
      },
    ],
    bankingDetails: {
      bankName: 'Nevada State Desert Bank',
      accountHolderName: 'Apex Health Nutra Labs Ltd',
      routingNumber: '121000358',
      accountNumber: '9940182741',
      accountType: 'CHECKING',
    },
    processingProfile: {
      estimatedMonthlyVolume: 500000,
      averageTicketSize: 69,
      maximumTicketSize: 200,
      primaryCurrency: 'USD',
      isHighRiskIndustry: true,
      highRiskCategory: 'Nutraceuticals / Continuity Billing',
      highRiskExplanation: 'Continuity recurring billing with negative option sales.',
      chargebackRatioHistory: '>1%',
    },
    riskDecisions: [
      {
        id: 'dec_3',
        reviewerId: 'usr_reviewer_02',
        reviewerName: 'Marcus Vance',
        decision: 'REJECT',
        riskTier: 'HIGH',
        notes: 'Excessive historical chargeback ratio (>2.4%), MATCH list match detected on beneficial owner, unacceptable continuity model without cardholder disclosure.',
        decidedAt: new Date(Date.now() - 12 * 86400000).toISOString(),
      },
    ],
    history: [
      {
        id: 'hist_7',
        timestamp: new Date(Date.now() - 12 * 86400000).toISOString(),
        userId: 'usr_reviewer_02',
        userName: 'Marcus Vance',
        action: 'Application Rejected',
        previousStatus: 'UNDER_REVIEW',
        newStatus: 'REJECTED',
        details: 'Underwriting declined due to high chargeback risk and MATCH list flag',
      },
    ],
  },
];

// Helper to simulate network latency with RxJS
const withLatency = <T>(data: T, delayMs: number = 300) => {
  return timer(delayMs).pipe(switchMap(() => of(new HttpResponse({ status: 200, body: data }))));
};

// Flag to simulate 401 unauthorized burst (for reviewer testing)
let forceTokenExpired = false;

export const setSimulateTokenExpired = (expired: boolean) => {
  forceTokenExpired = expired;
};

export const getSimulateTokenExpired = () => forceTokenExpired;

export const mockBackendInterceptor: HttpInterceptorFn = (req, next) => {
  // Pass through if not /api/*
  if (!req.url.startsWith('/api/')) {
    return next(req);
  }

  // 1. Check for simulated 401 Token Expiration (Demonstrates concurrent 401 & token refresh)
  if (forceTokenExpired && !req.url.includes('/api/auth/refresh')) {
    // If request already has refreshed token, let it through and reset flag!
    const authHeader = req.headers.get('Authorization');
    if (authHeader && authHeader.includes('refreshed')) {
      forceTokenExpired = false;
    } else {
      return timer(150).pipe(
        switchMap(() =>
          throwError(
            () =>
              new HttpErrorResponse({
                status: 401,
                statusText: 'Unauthorized - Simulated Token Expired',
                error: { message: 'Access token expired or revoked. Please refresh.' },
              })
          )
        )
      );
    }
  }

  // 2. Auth Endpoints
  if (req.url === '/api/auth/refresh' && req.method === 'POST') {
    const newToken = `mock_jwt_access_token_refreshed_${Date.now()}`;
    forceTokenExpired = false; // Reset expiration
    return timer(400).pipe(
      switchMap(() =>
        of(
          new HttpResponse({
            status: 200,
            body: {
              accessToken: newToken,
              refreshToken: `mock_jwt_refresh_token_${Date.now()}`,
              expiresIn: 3600,
            },
          })
        )
      )
    );
  }

  // 3. Metrics Endpoint
  if (req.url === '/api/applications/metrics' && req.method === 'GET') {
    const metrics: ApplicationMetrics = {
      totalApplications: INITIAL_APPLICATIONS.length,
      draftCount: INITIAL_APPLICATIONS.filter((a) => a.status === 'DRAFT').length,
      submittedCount: INITIAL_APPLICATIONS.filter((a) => a.status === 'SUBMITTED').length,
      underReviewCount: INITIAL_APPLICATIONS.filter((a) => a.status === 'UNDER_REVIEW').length,
      approvedCount: INITIAL_APPLICATIONS.filter((a) => a.status === 'APPROVED').length,
      rejectedCount: INITIAL_APPLICATIONS.filter((a) => a.status === 'REJECTED').length,
      highRiskCount: INITIAL_APPLICATIONS.filter((a) => a.riskTier === 'HIGH').length,
      totalMonthlyVolume: INITIAL_APPLICATIONS.reduce(
        (sum, a) => sum + (a.processingProfile?.estimatedMonthlyVolume || 0),
        0
      ),
    };
    return withLatency(metrics, 250);
  }

  // 4. Paginated Applications List with Filters & Sorting
  if (req.url.startsWith('/api/applications') && req.method === 'GET' && !req.url.match(/\/api\/applications\/[^?]+/)) {
    const url = new URL(req.urlWithParams, 'http://localhost');
    const search = url.searchParams.get('searchQuery')?.toLowerCase() || '';
    const status = url.searchParams.get('status') || 'ALL';
    const riskTier = url.searchParams.get('riskTier') || 'ALL';
    const assignedTo = url.searchParams.get('assignedTo') || 'ALL';
    const salesRepId = url.searchParams.get('salesRepId') || 'ALL';
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const pageSize = parseInt(url.searchParams.get('pageSize') || '5', 10);
    const sortBy = url.searchParams.get('sortBy') || 'createdAt';
    const sortDirection = url.searchParams.get('sortDirection') || 'desc';

    let filtered = [...INITIAL_APPLICATIONS];

    // Filter by search
    if (search) {
      filtered = filtered.filter(
        (app) =>
          app.applicationNumber.toLowerCase().includes(search) ||
          app.businessDetails.legalName.toLowerCase().includes(search) ||
          (app.businessDetails.dbaName && app.businessDetails.dbaName.toLowerCase().includes(search)) ||
          app.salesRepName.toLowerCase().includes(search)
      );
    }

    // Filter by salesRepId (For SALES role view)
    if (salesRepId !== 'ALL') {
      filtered = filtered.filter((app) => app.salesRepId === salesRepId);
    }

    // Filter by status
    if (status !== 'ALL') {
      filtered = filtered.filter((app) => app.status === status);
    }

    // Filter by risk tier
    if (riskTier !== 'ALL') {
      filtered = filtered.filter((app) => app.riskTier === riskTier);
    }

    // Filter by assigned reviewer
    if (assignedTo === 'UNASSIGNED') {
      filtered = filtered.filter((app) => !app.assignedReviewerId || app.assignedReviewerId === '');
    } else if (assignedTo !== 'ALL') {
      filtered = filtered.filter((app) => app.assignedReviewerId === assignedTo);
    }

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'legalName') {
        comparison = a.businessDetails.legalName.localeCompare(b.businessDetails.legalName);
      } else if (sortBy === 'monthlyVolume') {
        comparison = (a.processingProfile.estimatedMonthlyVolume || 0) - (b.processingProfile.estimatedMonthlyVolume || 0);
      } else if (sortBy === 'riskTier') {
        const riskWeights = { LOW: 1, MEDIUM: 2, HIGH: 3 };
        comparison = riskWeights[a.riskTier] - riskWeights[b.riskTier];
      } else if (sortBy === 'status') {
        comparison = a.status.localeCompare(b.status);
      } else {
        // default createdAt
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    const startIndex = (page - 1) * pageSize;
    const paginatedItems = filtered.slice(startIndex, startIndex + pageSize);

    const result: PaginatedResult<MerchantApplication> = {
      items: paginatedItems,
      totalItems,
      page,
      pageSize,
      totalPages,
    };

    return withLatency(result, 300);
  }

  // 5. Single Application Detail
  const appDetailMatch = req.url.match(/^\/api\/applications\/([^/?]+)$/);
  if (appDetailMatch && req.method === 'GET') {
    const id = appDetailMatch[1];
    const found = INITIAL_APPLICATIONS.find((a) => a.id === id || a.applicationNumber === id);
    if (!found) {
      return timer(200).pipe(
        switchMap(() =>
          throwError(
            () =>
              new HttpErrorResponse({
                status: 404,
                statusText: 'Not Found',
                error: { message: `Application ${id} not found` },
              })
          )
        )
      );
    }
    return withLatency(found, 200);
  }

  // 6. Draft Auto-Save Endpoint (PATCH /api/applications/:id/draft or POST /api/applications/draft)
  if (req.url.includes('/draft') && (req.method === 'PATCH' || req.method === 'POST')) {
    const body = req.body as Partial<MerchantApplication>;
    const id = req.url.split('/')[3];
    let app = INITIAL_APPLICATIONS.find((a) => a.id === id);

    if (app) {
      Object.assign(app, body, { updatedAt: new Date().toISOString() });
    } else {
      // Create new draft
      const newDraftId = `app_${Date.now()}`;
      app = {
        id: newDraftId,
        applicationNumber: `APP-${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'DRAFT',
        riskTier: 'LOW',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        salesRepId: 'usr_sales_01',
        salesRepName: 'Sarah Jenkins',
        currentStep: 1,
        riskDecisions: [],
        history: [
          {
            id: `hist_${Date.now()}`,
            timestamp: new Date().toISOString(),
            userId: 'usr_sales_01',
            userName: 'Sarah Jenkins',
            action: 'Draft Auto-Saved',
          },
        ],
        ...body,
      } as MerchantApplication;
      INITIAL_APPLICATIONS.unshift(app);
    }

    return withLatency({ success: true, application: app, savedAt: new Date().toISOString() }, 200);
  }

  // 7. Full Application Submission (POST /api/applications or PUT /api/applications/:id)
  if (req.url === '/api/applications' && req.method === 'POST') {
    const body = req.body as Partial<MerchantApplication>;
    const newId = `app_${Date.now()}`;
    const newApp: MerchantApplication = {
      ...body,
      id: newId,
      applicationNumber: `APP-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'SUBMITTED',
      riskTier: body.processingProfile?.isHighRiskIndustry ? 'HIGH' : 'LOW',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      submittedAt: new Date().toISOString(),
      salesRepId: body.salesRepId || 'usr_sales_01',
      salesRepName: body.salesRepName || 'Sarah Jenkins',
      riskDecisions: [],
      history: [
        {
          id: `hist_${Date.now()}`,
          timestamp: new Date().toISOString(),
          userId: body.salesRepId || 'usr_sales_01',
          userName: body.salesRepName || 'Sarah Jenkins',
          action: 'Application Submitted',
          newStatus: 'SUBMITTED',
        },
      ],
    } as MerchantApplication;

    INITIAL_APPLICATIONS.unshift(newApp);
    return withLatency(newApp, 400);
  }

  // 8. Record Reviewer Decision (POST /api/applications/:id/decision)
  if (req.url.includes('/decision') && req.method === 'POST') {
    const id = req.url.split('/')[3];
    const body = req.body as {
      decision: 'APPROVE' | 'REJECT' | 'REQUEST_INFO' | 'FLAG_RISK';
      riskTier: 'LOW' | 'MEDIUM' | 'HIGH';
      notes: string;
      conditions?: string;
      reviewerId: string;
      reviewerName: string;
    };

    const app = INITIAL_APPLICATIONS.find((a) => a.id === id);
    if (!app) {
      return throwError(() => new HttpErrorResponse({ status: 404, statusText: 'Not Found' }));
    }

    const previousStatus = app.status;
    let newStatus = app.status;
    if (body.decision === 'APPROVE') newStatus = 'APPROVED';
    if (body.decision === 'REJECT') newStatus = 'REJECTED';
    if (body.decision === 'REQUEST_INFO') newStatus = 'INFO_REQUESTED';
    if (body.decision === 'FLAG_RISK') newStatus = 'UNDER_REVIEW';

    app.status = newStatus;
    app.riskTier = body.riskTier;
    app.updatedAt = new Date().toISOString();

    const decisionRecord = {
      id: `dec_${Date.now()}`,
      reviewerId: body.reviewerId,
      reviewerName: body.reviewerName,
      decision: body.decision,
      riskTier: body.riskTier,
      notes: body.notes,
      conditions: body.conditions,
      decidedAt: new Date().toISOString(),
    };

    app.riskDecisions.unshift(decisionRecord);
    app.history.unshift({
      id: `hist_${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: body.reviewerId,
      userName: body.reviewerName,
      action: `Decision Recorded: ${body.decision}`,
      previousStatus,
      newStatus,
      details: body.notes,
    });

    return withLatency(app, 350);
  }

  // 9. Reassign Application (POST /api/applications/:id/reassign)
  if (req.url.includes('/reassign') && req.method === 'POST') {
    const id = req.url.split('/')[3];
    const body = req.body as { reviewerId: string; reviewerName: string; adminName: string };
    const app = INITIAL_APPLICATIONS.find((a) => a.id === id);
    if (app) {
      app.assignedReviewerId = body.reviewerId;
      app.assignedReviewerName = body.reviewerName;
      if (app.status === 'SUBMITTED') {
        app.status = 'UNDER_REVIEW';
      }
      app.updatedAt = new Date().toISOString();
      app.history.unshift({
        id: `hist_${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: 'usr_admin_03',
        userName: body.adminName,
        action: `Reassigned to ${body.reviewerName}`,
        details: `Assigned for risk underwriting`,
      });
      return withLatency(app, 250);
    }
  }

  // 10. Sensitive Reveal Audit Endpoint (POST /api/audit/sensitive-reveal)
  if (req.url === '/api/audit/sensitive-reveal' && req.method === 'POST') {
    return withLatency({ logged: true, recordedAt: new Date().toISOString() }, 150);
  }

  return next(req);
};

