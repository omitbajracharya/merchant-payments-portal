export type ApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'INFO_REQUESTED'
  | 'APPROVED'
  | 'REJECTED';

export type RiskTier = 'LOW' | 'MEDIUM' | 'HIGH';

export type BusinessType =
  | 'CORPORATION'
  | 'LLC'
  | 'PARTNERSHIP'
  | 'SOLE_PROPRIETORSHIP';

export interface Address {
  street: string;
  unit?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface BeneficialOwner {
  id: string;
  fullName: string;
  title: string;
  ownershipPercentage: number;
  ssn: string; // Sensitive
  dateOfBirth: string;
  email: string;
  isPrimaryContact: boolean;
}

export interface BankingDetails {
  bankName: string;
  accountHolderName: string;
  routingNumber: string; // Sensitive (ABA 9-digit)
  accountNumber: string; // Sensitive
  accountType: 'CHECKING' | 'SAVINGS';
}

export interface ProcessingProfile {
  estimatedMonthlyVolume: number;
  averageTicketSize: number;
  maximumTicketSize: number;
  primaryCurrency: string;
  isHighRiskIndustry: boolean;
  highRiskCategory?: string;
  highRiskExplanation?: string;
  chargebackRatioHistory: string; // e.g., '<0.5%' | '0.5%-1%' | '>1%'
}

export interface RiskDecision {
  id: string;
  reviewerId: string;
  reviewerName: string;
  decision: 'APPROVE' | 'REJECT' | 'REQUEST_INFO' | 'FLAG_RISK';
  riskTier: RiskTier;
  notes: string;
  conditions?: string;
  decidedAt: string;
}

export interface ApplicationHistoryEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  previousStatus?: ApplicationStatus;
  newStatus?: ApplicationStatus;
  details?: string;
}

export interface MerchantApplication {
  id: string;
  applicationNumber: string; // e.g. APP-8421
  status: ApplicationStatus;
  riskTier: RiskTier;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  salesRepId: string;
  salesRepName: string;
  assignedReviewerId?: string;
  assignedReviewerName?: string;
  currentStep: number;

  // Step 1: Business Details
  businessDetails: {
    legalName: string;
    dbaName?: string;
    taxId: string; // Sensitive EIN (XX-XXXXXXX)
    businessType: BusinessType;
    incorporationDate: string;
    websiteUrl: string;
    phone: string;
    address: Address;
    industryCategory: string;
  };

  // Step 2: Beneficial Owners
  beneficialOwners: BeneficialOwner[];

  // Step 3: Banking & Settlement
  bankingDetails: BankingDetails;

  // Step 4: Processing Profile
  processingProfile: ProcessingProfile;

  // Step 5: Submission & Attestation
  attestation?: {
    certifiedAccurate: boolean;
    authorizedSignerName: string;
    signatureDate: string;
  };

  // Review & Decisions
  riskDecisions: RiskDecision[];
  history: ApplicationHistoryEntry[];
}

export interface ApplicationFilter {
  searchQuery?: string;
  status?: ApplicationStatus | 'ALL';
  riskTier?: RiskTier | 'ALL';
  assignedTo?: string | 'ALL';
  salesRepId?: string | 'ALL';
  page: number;
  pageSize: number;
  sortBy: 'createdAt' | 'legalName' | 'monthlyVolume' | 'riskTier' | 'status';
  sortDirection: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  items: T[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApplicationMetrics {
  totalApplications: number;
  draftCount: number;
  submittedCount: number;
  underReviewCount: number;
  approvedCount: number;
  rejectedCount: number;
  totalMonthlyVolume: number;
  highRiskCount: number;
}

