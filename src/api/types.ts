/** Shared response shapes for the Carrinho Esperto backend. */

/** GET /api/me */
export interface CurrentUserResponse {
  /** false for an anonymous trial caller (still authorized, just no identity). */
  authenticated: boolean;
  subject: string | null;
  username: string | null;
}

// ── Fiscal ────────────────────────────────────────────────────────────────

export interface FiscalItemResponse {
  id: string;
  lineNumber: number;
  rawDescription: string;
  gtin: string | null;
  gtinTaxable: string | null;
  supplierItemCode: string | null;
  quantity: string;
  unit: string;
  unitPrice: string;
  totalPrice: string;
  discount: string | null;
  ncm: string | null;
  cest: string | null;
}

export interface FiscalPaymentResponse {
  id: string;
  lineNumber: number;
  method: string;
  methodDescription: string | null;
  amount: string;
}

export interface FiscalIssuerResponse {
  cnpj: string;
  legalName: string | null;
  tradeName: string | null;
  address: string | null;
}

export interface FiscalDocumentResponse {
  id: string;
  accessKey: string;
  documentNumber: number | null;
  series: number | null;
  issuedAt: string;
  issuer: FiscalIssuerResponse;
  totalAmount: string;
  totalItemsAmount: string | null;
  totalDiscount: string | null;
  createdAt: string;
  items: FiscalItemResponse[];
  payments: FiscalPaymentResponse[];
}

export interface FiscalDocumentSummaryResponse {
  id: string;
  accessKey: string;
  documentNumber: number | null;
  series: number | null;
  issuedAt: string;
  issuerCnpj: string;
  issuerTradeName: string | null;
  totalAmount: string;
  itemCount: number;
  createdAt: string;
}

// ── Resolution ────────────────────────────────────────────────────────────

export type ResolutionStatus = 'RESOLVED' | 'PROBABLE' | 'AMBIGUOUS' | 'UNRESOLVED';

export interface DocumentItemResolution {
  fiscalItemId: string;
  status: ResolutionStatus | null;
  canonicalProductId: string | null;
  canonicalProductName: string | null;
  method: string | null;
  updatedAt: string | null;
}

// ── Dashboard ─────────────────────────────────────────────────────────────

export interface DashboardSummary {
  totalSpent: string;
  receiptCount: number;
  itemCount: number;
  resolvedItemCount: number;
  unresolvedItemCount: number;
}

export interface MonthlySpending {
  month: string;
  total: string;
  receiptCount: number;
}

export interface IssuerSpending {
  issuerCnpj: string;
  issuerName: string;
  total: string;
  receiptCount: number;
}

export interface DashboardSpending {
  byMonth: MonthlySpending[];
  byIssuer: IssuerSpending[];
}

// ── Basket insight (M006.1) ───────────────────────────────────────────────

export type BasketSeal = 'EQUILIBRADO' | 'ATENCAO' | 'MUITOS_SUPERFLUOS' | 'SEM_DADOS';

export interface BasketCategoryBreakdown {
  category: string;
  label: string;
  itemCount: number;
  totalValue: string;
  valueShare: string;
  superfluous: boolean;
}

export interface BasketInsightResponse {
  documentId: string;
  seal: BasketSeal;
  sealLabel: string;
  categories: BasketCategoryBreakdown[];
  superfluousShare: string;
  basicShare: string;
  unclassifiedShare: string;
  messages: string[];
}

// ── Anonymous trial (M006.1) ──────────────────────────────────────────────

export interface AnonymousSessionResponse {
  token: string;
}

// ── Catalog ───────────────────────────────────────────────────────────────

export interface CatalogProduct {
  id: string;
  canonicalName: string;
  brandId: string | null;
  manufacturerId: string | null;
  categoryId: string | null;
  subcategoryId: string | null;
  productFamilyId: string | null;
  gtin: string | null;
  packageQuantity: string | null;
  packageUnit: string | null;
  packagingType: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Admin ─────────────────────────────────────────────────────────────────

export interface AdminDashboard {
  fiscalDocuments: number;
  fiscalItems: number;
  resolvedItems: number;
  unresolvedItems: number;
  catalogProducts: number;
  users: number;
}

export interface AdminFiscalDocumentRow {
  id: string;
  ownerUserId: string;
  accessKey: string;
  issuedAt: string;
  issuerCnpj: string;
  issuerName: string;
  totalAmount: string;
  itemCount: number;
  createdAt: string;
}

export interface AdminFiscalItemRow {
  id: string;
  fiscalDocumentId: string;
  accessKey: string;
  rawDescription: string;
  supplierItemCode: string | null;
  gtin: string | null;
  gtinTaxable: string | null;
  quantity: string;
  unit: string;
  unitPrice: string;
  totalPrice: string;
  resolutionStatus: ResolutionStatus | null;
  canonicalProductId: string | null;
}

export interface AdminResolutionRow {
  id: string;
  fiscalItemId: string;
  fiscalRawDescription: string;
  status: ResolutionStatus;
  method: string | null;
  canonicalProductId: string | null;
  canonicalProductName: string | null;
  evidenceCount: number;
  createdAt: string;
  updatedAt: string;
}
