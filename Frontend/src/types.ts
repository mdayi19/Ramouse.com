export type OrderStatus =
  | 'pending'
  | 'quoted'
  | 'payment_pending'
  | 'processing'
  | 'ready_for_pickup'
  | 'provider_received'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  // Legacy Arabic Statuses (for backward compatibility)
  | 'قيد المراجعة'
  | 'بانتظار تأكيد الدفع'
  | 'جاري التجهيز'
  | 'جاهز للاستلام'
  | 'تم الاستلام من المزود'
  | 'تم الشحن للعميل'
  | 'قيد التوصيل'
  | 'تم التوصيل'
  | 'تم الاستلام من الشركة'
  | 'ملغي';

export const ORDER_STATUS_LABELS: Record<string, string> = {
  'pending': 'قيد المراجعة',
  'quoted': 'تم استلام عروض',
  'payment_pending': 'بانتظار تأكيد الدفع',
  'processing': 'جاري التجهيز',
  'ready_for_pickup': 'جاهز للاستلام',
  'provider_received': 'تم الاستلام من المزود',
  'shipped': 'تم الشحن للعميل',
  'out_for_delivery': 'قيد التوصيل',
  'delivered': 'تم التوصيل',
  'completed': 'تم الاستلام من الشركة',
  'cancelled': 'ملغي',
  // Legacy mappings
  'قيد المراجعة': 'قيد المراجعة',
  'بانتظار تأكيد الدفع': 'بانتظار تأكيد الدفع',
  'جاري التجهيز': 'جاري التجهيز',
  'جاهز للاستلام': 'جاهز للاستلام',
  'تم الاستلام من المزود': 'تم الاستلام من المزود',
  'تم الشحن للعميل': 'تم الشحن للعميل',
  'قيد التوصيل': 'قيد التوصيل',
  'تم التوصيل': 'تم التوصيل',
  'تم الاستلام من الشركة': 'تم الاستلام من الشركة',
  'ملغي': 'ملغي'
};

export const ORDER_STATUS_FLOW = {
  shipping: ['pending', 'payment_pending', 'processing', 'provider_received', 'shipped', 'out_for_delivery', 'delivered'],
  pickup: ['pending', 'payment_pending', 'processing', 'ready_for_pickup', 'completed']
};

export type PartStatus = 'new' | 'used';
export type WithdrawalStatus = 'Pending' | 'Approved' | 'Rejected';
export type TransactionType = 'deposit' | 'manual_deposit' | 'withdrawal';
export type PartSizeCategory = 'xs' | 's' | 'm' | 'l' | 'vl' | '';
export type FlashProductRequestStatus = 'pending' | 'payment_verification' | 'preparing' | 'shipped' | 'delivered' | 'rejected' | 'cancelled' | 'approved';
export type EngineType = 'petrol' | 'diesel' | 'electric' | 'hybrid';
export type TransmissionType = 'manual' | 'auto';

export interface ProviderPaymentInfo {
  methodId: string;
  methodName: string;
  details: string;
  isPrimary?: boolean;
}

// User payment info uses same structure as provider payment info
export type UserPaymentInfo = ProviderPaymentInfo;

export interface Provider {
  user_id?: number;
  id: string;
  phone: string;
  name: string;
  password: string;
  assignedCategories: string[];
  isActive: boolean;
  uniqueId: string;
  walletBalance: number;
  lastLoginTimestamp?: string;
  inactivityWarningSent?: boolean;
  averageRating?: number;
  paymentInfo?: ProviderPaymentInfo[];
  notificationSettings?: Partial<NotificationSettings>;
  flashPurchases?: FlashProductPurchase[];
}

export interface Customer {
  user_id?: number;
  id: string;
  phone: string;
  name: string;
  password?: string;
  address?: string;
  isActive: boolean;
  walletBalance?: number;
  paymentInfo?: UserPaymentInfo[];
  garage?: Vehicle[];
  notificationSettings?: Partial<NotificationSettings>;
}

export interface OrderFormData {
  category: string;
  brand: string;
  brandManual: string;
  model: string;
  year: string;
  vin: string;
  engineType: string;
  transmission: string;
  additionalDetails: string;
  partTypes: string[];
  partDescription: string;
  partNumber: string;
  images: File[];
  video?: File | null;
  voiceNote?: Blob | null;
  contactMethod: string;
  city: string;
  customerName?: string;
  customerAddress?: string;
  customerPhone?: string;
}

export interface StoredFormData extends Omit<OrderFormData, 'images' | 'video' | 'voiceNote'> {
  images: string[];
  video?: string;
  voiceNote?: string;
}

export interface PartType {
  id: string;
  name: string;
  icon?: string;
}

export interface Brand {
  id: string;
  name: string;
  logo?: string;
}

export interface Category {
  id: string;
  name: string;
  flag: string;
  brands: string[];
  telegramBotToken?: string;
  telegramChannelId?: string;
  telegramNotificationsEnabled?: boolean;
}

export interface StoreSubCategory {
  id: string;
  name: string;
  icon?: string;
}

export interface StoreCategory {
  id: string;
  name: string;
  icon: string;
  subcategories?: StoreSubCategory[];
  isFeatured?: boolean;
}

export interface StoreBanner {
  id: string;
  title: string;
  imageUrl: string;
  link?: string;
  isActive: boolean;
}

export interface FlashProductBuyerRequest {
  id: string;
  productId: string;
  buyerId: string;
  buyerType: 'technician' | 'customer' | 'provider' | 'tow_truck';
  buyerName: string;
  buyerUniqueId: string;
  quantity: number;
  requestDate: string;
  status: FlashProductRequestStatus;
  adminNotes?: string;
  decisionDate?: string;
  deliveryMethod?: 'shipping' | 'pickup';
  shippingAddress?: string;
  contactPhone?: string;
  paymentMethodId?: string;
  paymentMethodName?: string;
  paymentReceiptUrl?: string;
  productPrice?: number;
  shippingCost?: number;
  totalPrice?: number;
}

export interface Review {
  id: number;
  reviewable_type: string; // 'App\\Models\\Technician' or 'App\\Models\\TowTruck'
  reviewable_id: string;
  user_id: number;
  customer_name: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  provider_response?: string | null;
  responded_at?: string | null;
  moderated_by?: number | null;
  moderated_at?: string | null;
  moderation_notes?: string | null;
  created_at: string;
  updated_at: string;
  // Related models (when populated)
  user?: any;
  moderator?: any;
  reviewable?: any;
}

// Type aliases for backward compatibility
export type TechnicianReview = Review;
export type TowTruckReview = Review;

export interface OrderReview {
  id: string;
  rating: number;
  comment: string;
  timestamp: string;
}

export interface Quote {
  id: string; // Database primary key from backend
  providerId: string;
  providerName: string;
  providerUniqueId: string;
  price: number;
  partStatus: PartStatus;
  partSizeCategory?: PartSizeCategory;
  notes?: string;
  timestamp: string;
  viewedByCustomer?: boolean;
  media?: {
    images?: string[];
    video?: string;
    voiceNote?: string;
  };
}

export type NotificationType =
  | 'ORDER_STATUS_CHANGED'
  | 'PAYMENT_REJECTED'
  | 'STALE_ORDER_CUSTOMER'
  | 'NEW_ANNOUNCEMENT_CUSTOMER'
  | 'NEW_ORDER_FOR_PROVIDER'
  | 'FIRST_QUOTE_RECEIVED'
  | 'QUOTE_EXPIRING_SOON'
  | 'QUOTE_VIEWED_BY_CUSTOMER'
  | 'OFFER_ACCEPTED_PROVIDER_WIN'
  | 'OFFER_ACCEPTED_PROVIDER_LOSS'
  | 'ORDER_CANCELLED'
  | 'WITHDRAWAL_REQUEST_CONFIRMATION'
  | 'WITHDRAWAL_PROCESSED_APPROVED'
  | 'WITHDRAWAL_PROCESSED_REJECTED'
  | 'FUNDS_DEPOSITED'
  | 'PROVIDER_INACTIVITY_WARNING'
  | 'NEW_ANNOUNCEMENT_PROVIDER'
  | 'FLASH_PRODUCT_REQUEST_APPROVED'
  | 'FLASH_PRODUCT_REQUEST_REJECTED'
  | 'TECHNICIAN_VERIFIED'
  | 'NEW_ANNOUNCEMENT_TECHNICIAN'
  | 'TOW_TRUCK_VERIFIED'
  | 'NEW_ANNOUNCEMENT_TOW_TRUCK'
  | 'HIGH_VALUE_TRANSACTION'
  | 'STALE_ORDER_ADMIN'
  | 'PROVIDER_INACTIVITY_ADMIN'
  | 'WITHDRAWAL_REQUEST_ADMIN'
  | 'NEW_PROVIDER_REQUEST'
  | 'NEW_TECHNICIAN_REQUEST'
  | 'NEW_TOW_TRUCK_REQUEST'
  | 'NEW_FLASH_PRODUCT_REQUEST'
  | 'REFUND_PROCESSED'
  | 'MANUAL_DEPOSIT_PROCESSED'
  // New order lifecycle notifications
  | 'ORDER_CREATED_CUSTOMER'
  | 'ORDER_CREATED_ADMIN'
  | 'ORDER_READY_FOR_PICKUP'
  | 'PROVIDER_RECEIVED_ORDER'
  | 'ORDER_SHIPPED'
  | 'ORDER_OUT_FOR_DELIVERY'
  | 'ORDER_DELIVERED'
  | 'ORDER_COMPLETED_CUSTOMER'
  | 'ORDER_COMPLETED_PROVIDER'
  | 'ORDER_COMPLETED_ADMIN'
  | 'ORDER_CANCELLED_CUSTOMER'
  | 'ORDER_CANCELLED_PROVIDER'
  | 'ORDER_CANCELLED_ADMIN'
  | 'SHIPPING_NOTES_UPDATED'
  | 'NEW_REVIEW_PROVIDER'
  | 'NEW_REVIEW_ADMIN'
  | 'PAYMENT_UPLOADED_ADMIN'
  | 'PAYMENT_REUPLOADED_ADMIN'
  | 'quote_received'
  | 'DEPOSIT_REQUEST'
  | 'WITHDRAWAL_REQUEST'
  | 'new_store_order';

export interface Notification {
  id: string;
  timestamp: string;
  read: boolean;
  title: string;
  message: string;
  type: NotificationType;
  context?: Record<string, any>;
  link?: {
    view: string;
    params?: Record<string, any>;
  };
}

export type NotificationSettings = {
  [key in NotificationType]: boolean;
};

export interface ShippingPriceTiers {
  xs: number;
  s: number;
  m: number;
  l: number;
  vl: number;
  xs_remote?: number;
  s_remote?: number;
  m_remote?: number;
  l_remote?: number;
  vl_remote?: number;
}

export interface ShippingPriceByCity extends ShippingPriceTiers {
  city: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  details: string;
  iconUrl?: string;
  isActive: boolean;
}

export interface MessagingAPI {
  id: string;
  name: string;
  apiUrl: string;
  appKey: string;
  authKey: string;
  isActive: boolean;
}



export interface WithdrawalRequest {
  id: string;
  providerId: string;
  providerName: string;
  providerUniqueId: string;
  amount: number;
  status: WithdrawalStatus;
  requestTimestamp: string;
  decisionTimestamp?: string;
  adminNotes?: string;
  paymentMethodId: string;
  paymentMethodName: string;
  receiptUrl?: string;
}

export interface Transaction {
  id: string;
  providerId: string;
  type: TransactionType;
  amount: number;
  timestamp: string;
  description: string;
  relatedOrderId?: string;
  relatedWithdrawalId?: string;
  balanceAfter: number;
}

export interface AnnouncementPost {
  id: string;
  timestamp: string;
  title: string;
  message: string;
  imageUrl?: string;
  target: 'all' | 'customers' | 'providers' | 'technicians' | 'tow_trucks';
}

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface MessageTemplate {
  template: string;
  enabled: boolean;
}

export interface SeoSettings {
  title: string;
  description: string;
  keywords: string;
  canonicalUrl: string;
  themeColor: string;
  ogType: string;
  ogUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterCard: string;
  twitterUrl: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  jsonLd: string;
}



export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  imageUrl: string;
  author: string;
  publishedAt: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface GalleryItem {
  id?: string;
  type: 'image' | 'video';
  data?: string;
  path?: string;
  url?: string;
  uploaded_at?: string;
  caption?: string;
}

export interface TechnicianSpecialty {
  id: string;
  name: string;
  icon: string;
}

export interface StoreProductReview {
  id: string;
  buyerId: string;
  buyerName: string;
  buyerType: 'customer' | 'technician' | 'provider' | 'tow_truck';
  rating: number;
  comment: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface FlashProductPurchase {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  purchaseDate: string;
  deliveryMethod?: 'shipping' | 'pickup';
  shippingCost?: number;
  totalPrice?: number;
  status?: FlashProductRequestStatus;
}

export interface AdminFlashProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  media: GalleryItem[];
  targetAudience: 'technicians' | 'customers' | 'all' | 'providers' | 'tow_trucks';
  specialty?: string;
  totalStock: number;
  purchaseLimitPerBuyer: number;
  expiresAt: string;
  createdAt: string;
  isFlash: boolean;
  allowedPaymentMethods?: string[];
  storeCategoryId?: string;
  storeSubcategoryId?: string;
  shippingSize?: PartSizeCategory;
  staticShippingCost?: number | null;
  reviews?: StoreProductReview[];
  averageRating?: number;
}

export interface LimitSettings {
  // Customer Limits
  maxActiveOrders?: number;
  maxImagesPerOrder?: number;

  // Security Limits
  maxVerificationAttempts?: number;
  verificationWindowMinutes?: number;

  // Rate Limiting
  apiRateLimitPerMinute?: number;
  apiRateLimitDecaySeconds?: number;

  // Order Lifecycle
  maxQuotesPerOrder?: number;
  quoteValidityDays?: number;
  orderAutoCancelDays?: number;

  // Provider Limits
  maxImagesPerQuote?: number;
  maxActiveBidsPerProvider?: number;
  providerInactivityDeactivationDays?: number;

  // Financial Limits
  minWithdrawalAmount?: number;
  maxWithdrawalAmount?: number;
  maxWithdrawalRequestsPerPeriod?: number;
  withdrawalRequestsPeriodDays?: number;
  withdrawalCooldownHours?: number;
  highValueTransactionThreshold?: number;
  minDepositAmount?: number;
  maxDepositAmount?: number;
  maxWalletBalance?: number;

  userMinWithdrawalAmount?: number;
  userMaxWithdrawalAmount?: number;
  userWithdrawalCooldownHours?: number;
  userMaxWithdrawalRequestsPerPeriod?: number;



  // Shipping Settings
  shippingPriceTiers?: ShippingPriceTiers;
  shippingPrices: ShippingPriceByCity[];

  // File Upload Limits
  maxImageSizeMB: number;
  maxVideoSizeMB: number;
  maxVoiceNoteSizeMB: number;

  // International License Settings
  international_license_settings?: {
    syrian_price: number;
    non_syrian_price: number;
    license_duration: string;
    informations: string;
    allowed_payment_methods?: string[];
    is_active?: boolean;
  };
}

export interface ShippingPriceByCity extends ShippingPriceTiers {
  city: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  details: string;
  iconUrl?: string;
  isActive: boolean;
}

export interface MessagingAPI {
  id: string;
  name: string;
  apiUrl: string;
  appKey: string;
  authKey: string;
  isActive: boolean;
}

export interface MessageTemplate {
  template: string;
  enabled: boolean;
}

export interface SeoSettings {
  title: string;
  description: string;
  keywords: string;
  canonicalUrl: string;
  themeColor: string;
  ogType: string;
  ogUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterCard: string;
  twitterUrl: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  jsonLd: string;
}



export interface Settings {
  logoUrl: string;
  appName: string;
  adminPhone: string;
  adminPassword: string;
  facebookUrl: string;
  instagramUrl: string;
  twitterUrl: string;
  whatsappUrl: string;
  telegramUrl: string;
  youtubeUrl: string;
  linkedinUrl: string;
  ceoName: string;
  ceoMessage: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  mainDomain: string;
  paymentMethods: PaymentMethod[];
  storePaymentMethods: PaymentMethod[];
  storeBanners?: StoreBanner[];
  limitSettings: LimitSettings;
  notificationSettings: NotificationSettings;
  verificationApis: MessagingAPI[];
  notificationApis: MessagingAPI[];
  lastUsedVerificationApiIndex: number;
  lastUsedNotificationApiIndex: number;
  messageTemplates: Partial<Record<NotificationType, MessageTemplate>>;
  default_message_templates?: Record<string, string>;
  whatsapp_env_status?: {
    has_env_keys: boolean;
    env_app_key_preview: string;
  };
  whatsappNotificationsActive: boolean;
  seoSettings: SeoSettings;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  imageUrl: string;
  author: string;
  publishedAt: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}



export interface TechnicianSpecialty {
  id: string;
  name: string;
  icon: string;
}

export interface StoreProductReview {
  id: string;
  buyerId: string;
  buyerName: string;
  buyerType: 'customer' | 'technician' | 'provider' | 'tow_truck';
  rating: number;
  comment: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface FlashProductPurchase {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  purchaseDate: string;
  deliveryMethod?: 'shipping' | 'pickup';
  shippingCost?: number;
  totalPrice?: number;
  status?: FlashProductRequestStatus;
}

export interface AdminFlashProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  media: GalleryItem[];
  targetAudience: 'technicians' | 'customers' | 'all' | 'providers' | 'tow_trucks';
  specialty?: string;
  totalStock: number;
  purchaseLimitPerBuyer: number;
  expiresAt: string;
  createdAt: string;
  isFlash: boolean;
  allowedPaymentMethods?: string[];
  storeCategoryId?: string;
  storeSubcategoryId?: string;
  shippingSize?: PartSizeCategory;
  staticShippingCost?: number | null;
  reviews?: StoreProductReview[];
}

export type View = 'welcome' | 'newOrder' | 'myOrders' | 'adminDashboard' | 'providerDashboard' | 'announcements' | 'customerDashboard' | 'notificationCenter' | 'technicianDashboard' | 'technicianDirectory' | 'technicianProfile' | 'technicianRegistration' | 'blog' | 'blogPost' | 'faq' | 'privacyPolicy' | 'termsOfUse' | 'contact' | 'towTruckDirectory' | 'towTruckProfile' | 'towTruckRegistration' | 'towTruckDashboard' | 'store';

export interface CarModel {
  id: string;
  name: string;
  brandId: string;
}

export interface Technician {
  user_id?: number;
  id: string;
  uniqueId: string;
  registrationDate?: string;
  phone: string;
  name: string;
  reviews?: any[];
  qrCodeUrl?: string;
  specialty: string;
  city: string;
  isVerified: boolean;
  isActive: boolean;
  profilePhoto?: string;
  gallery?: GalleryItem[];
  distance?: number;
  averageRating?: number;
  description: string;
  workshopAddress?: string;
  socials?: {
    facebook?: string;
    instagram?: string;
    whatsapp?: string;
  };
  location?: {
    latitude: number;
    longitude: number;
  };
  notificationSettings?: Partial<NotificationSettings>;
  flashPurchases?: FlashProductPurchase[];
}


export interface Order {
  orderNumber: string;
  date: string;
  status: OrderStatus;
  formData: StoredFormData;
  quotes?: Quote[];
  acceptedQuote?: Quote;
  customerName?: string;
  customerAddress?: string;
  customerPhone?: string;
  userType?: 'technician' | 'customer' | 'provider' | 'tow_truck';
  userPhone?: string;
  deliveryMethod?: 'pickup' | 'shipping';
  paymentMethodName?: string;
  paymentReceiptUrl?: string;
  shippingNotes?: string;
  shippingPrice?: number;
  productPrice?: number;
  totalPrice?: number;
  paymentMethodId?: string;
  staleNotified?: boolean;
  rejectionReason?: string;
  review?: OrderReview;
  vl?: number;
  xs_remote?: number;
  s_remote?: number;
  m_remote?: number;
  l_remote?: number;
  vl_remote?: number;
}

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: string;
  vin?: string;
  engineType?: string;
  imageUrl?: string;
  category?: string;
  transmission?: string;
}

export interface TowTruck {
  user_id?: number;
  id: string;
  uniqueId: string;
  phone: string;
  name: string;
  password: string;
  profilePhoto?: string;
  vehicleType: string;
  city: string;
  serviceArea?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  description: string;
  isVerified: boolean;
  isActive: boolean;
  registrationDate: string;
  socials?: {
    facebook?: string;
    instagram?: string;
    whatsapp?: string;
  };
  gallery?: GalleryItem[];
  qrCodeUrl?: string;
  notificationSettings?: Partial<NotificationSettings>;
  averageRating?: number;
  reviews?: any[];
  flashPurchases?: FlashProductPurchase[];
  walletBalance?: number;
}

// ======== USER WALLET TYPES ========

export type UserWalletTransactionType = 'deposit' | 'withdrawal' | 'payment' | 'refund' | 'hold' | 'release';
export type UserWalletRequestStatus = 'pending' | 'approved' | 'rejected';

export interface UserWalletBalance {
  balance: number;
  availableBalance: number;
  heldAmount: number;
}

export interface UserWalletTransaction {
  id: string;
  userId: number;
  userType: 'customer' | 'technician' | 'tow_truck';
  type: UserWalletTransactionType;
  amount: number;
  description: string;
  balanceAfter: number;
  timestamp: string;
  referenceType?: string;
  referenceId?: string;
}

export interface UserDepositRequest {
  id: string;
  userId: number;
  userType: 'customer' | 'technician' | 'tow_truck';
  userName: string;
  amount: number;
  status: UserWalletRequestStatus;
  paymentMethodId: string;
  paymentMethodName: string;
  receiptUrl: string;
  requestTimestamp: string;
  decisionTimestamp?: string;
  adminNotes?: string;
}

export interface UserWithdrawalRequest {
  id: string;
  userId: number;
  userType: 'customer' | 'technician' | 'tow_truck';
  userName: string;
  amount: number;
  status: UserWalletRequestStatus;
  paymentMethodId: string;
  paymentMethodName: string;
  paymentMethodDetails?: string;
  receiptUrl?: string;
  requestTimestamp: string;
  decisionTimestamp?: string;
  adminNotes?: string;
}

export interface InternationalLicenseRequest {
  id: number;
  user_id: number;
  full_name: string;
  phone: string;
  nationality: 'syrian' | 'non_syrian';
  personal_photo: string;
  id_document: string;
  id_document_back?: string;
  passport_document: string;
  driving_license_front?: string;
  driving_license_back?: string;
  proof_of_payment: string;
  status: 'pending' | 'payment_check' | 'documents_check' | 'in_work' | 'ready_to_handle' | 'rejected';
  payment_status: string;
  order_number: string;
  price: number;
  created_at: string;
  updated_at: string;
  admin_note?: string;
  rejection_reason?: string;
  rejection_type?: 'payment' | 'documents' | 'other';
  rejected_documents?: string[];
}

export interface TowTruckType {
  id: string;
  name: string;
  icon: string;
}

export interface CartItem {
  id?: string;
  product: AdminFlashProduct;
  quantity: number;
}

export interface AuthResponse {
  token: string;
  user: Customer | Provider | Technician | TowTruck;
  role: 'customer' | 'provider' | 'technician' | 'tow_truck';
  is_admin?: boolean;
  user_type?: string;
  user_id?: number | string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  errors?: any;
}

// ======== AUCTION TYPES ========

export type AuctionStatus = 'draft' | 'scheduled' | 'live' | 'extended' | 'ended' | 'completed' | 'cancelled';
export type AuctionCarStatus = 'draft' | 'pending_approval' | 'approved' | 'in_auction' | 'sold' | 'unsold' | 'cancelled';
export type AuctionPaymentStatus = 'pending' | 'awaiting_payment' | 'payment_received' | 'completed' | 'refunded' | 'paid';

export interface AuctionCarMedia {
  images: string[];
  videos?: string[];
  inspectionReport?: string;
  documents?: string[];
}

export interface AuctionCar {
  id: string;
  title: string;
  description?: string;
  condition: 'new' | 'used';
  brand?: string;
  model?: string;
  year?: number;
  vin?: string;
  body_type?: string;
  mileage?: number;
  engine_type?: string;
  transmission?: string;
  fuel_type?: string;
  exterior_color?: string;
  interior_color?: string;
  features?: string[];
  media?: AuctionCarMedia;
  location?: string;
  starting_price: number;
  reserve_price?: number;
  buy_now_price?: number;
  deposit_amount: number;
  seller_type: 'admin' | 'user';
  seller_id?: string;
  seller_user_type?: string;
  seller_name?: string;
  seller_phone?: string;
  status: AuctionCarStatus;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  // Computed
  primary_image?: string;
  images?: string[];
  has_buy_now?: boolean;
  is_available?: boolean;

  // Auction Scheduling
  scheduled_start?: string;
  scheduled_end?: string;
  schedule_auction?: boolean;
  bid_increment?: number;
  auto_extend?: boolean;
  extension_minutes?: number;
  max_extensions?: number;
}

export interface Auction {
  id: string;
  auction_car_id: string;
  car?: AuctionCar;
  title: string;
  description?: string;
  scheduled_start: string;
  scheduled_end: string;
  actual_start?: string;
  actual_end?: string;
  starting_bid: number;
  current_bid?: number;
  bid_increment: number;
  bid_count: number;
  auto_extend?: boolean;
  extension_minutes: number;
  extension_threshold_seconds: number;
  max_extensions: number;
  extensions_used: number;
  commission_percent?: number;
  commission_fixed?: number;
  status: AuctionStatus;
  winner_id?: string;
  winner_type?: string;
  winner_name?: string;
  winner_phone?: string;
  final_price?: number;
  commission_amount?: number;
  payment_status: AuctionPaymentStatus;
  payment_notes?: string;
  payment_deadline?: string;
  created_at: string;
  updated_at: string;
  // Computed/Added by API
  participant_count?: number;
  reminder_count?: number;
  time_remaining?: number;
  time_until_start?: number;
  minimum_bid?: number;
  is_live?: boolean;
  has_ended?: boolean;
  is_upcoming?: boolean;
  can_extend?: boolean;
  // User-specific
  is_registered?: boolean;
  has_reminder?: boolean;
  can_bid?: boolean;
  my_highest_bid?: number;
}

export interface AuctionBid {
  id: string;
  auction_id: string;
  user_id: string;
  user_type: string;
  bidder_name: string;
  bidder_phone?: string;
  amount: number;
  bid_time: string;
  wallet_hold_id?: string;
  status: 'valid' | 'outbid' | 'winning' | 'cancelled' | 'rejected';
  is_auto_bid: boolean;
  max_auto_bid?: number;
  // For display
  display_name?: string;
  anonymized_name?: string;
  is_mine?: boolean;
}

export interface AuctionRegistration {
  id: string;
  auction_id: string;
  auction?: Auction;
  user_id: string;
  user_type: string;
  user_name: string;
  user_phone?: string;
  deposit_amount: number;
  wallet_hold_id?: string;
  status: 'pending' | 'registered' | 'participated' | 'winner' | 'deposit_released' | 'deposit_forfeited' | 'cancelled';
  registered_at?: string;
  deposit_released_at?: string;
}

export interface AuctionReminder {
  id: string;
  auction_id: string;
  user_id: string;
  user_type: string;
  remind_minutes_before: number;
  remind_at: string;
  channels?: string[];
  is_sent: boolean;
  sent_at?: string;
}

export interface AuctionStats {
  total_cars: number;
  pending_approval: number;
  total_auctions: number;
  scheduled_auctions: number;
  live_auctions: number;
  ended_auctions: number;
  completed_auctions: number;
  total_bids: number;
  total_registrations: number;
  total_revenue: number;
}

// Real-time event data
export interface AuctionBidPlacedEvent {
  bid: {
    id: string;
    amount: number;
    bidderName: string;
    bidTime: string;
    isAutoBid: boolean;
  };
  auction: {
    id: string;
    currentBid: number;
    minimumBid: number;
    bidCount: number;
    timeRemaining: number;
    status: AuctionStatus;
    extensionsUsed: number;
  };
  timestamp: string;
}

export interface AuctionStartedEvent {
  auction: {
    id: string;
    title: string;
    carId: string;
    carTitle: string;
    startingBid: number;
    currentBid: number;
    minimumBid: number;
    bidIncrement: number;
    scheduledEnd: string;
    actualStart: string;
    timeRemaining: number;
    status: 'live';
  };
  timestamp: string;
}

export interface AuctionEndedEvent {
  auction: {
    id: string;
    title: string;
    carId: string;
    status: 'ended';
    hasWinner: boolean;
    finalPrice?: number;
    winnerName?: string;
    bidCount: number;
  };
  timestamp: string;
}

export interface AuctionExtendedEvent {
  auction: {
    id: string;
    status: 'extended';
    newEndTime: string;
    timeRemaining: number;
    extensionsUsed: number;
    maxExtensions: number;
  };
  timestamp: string;
}

// Form data for submitting a car
export interface SellCarFormData {
  title: string;
  description: string;
  condition: 'new' | 'used';
  brand: string;
  model: string;
  year: number;
  body_type?: string;
  vin?: string;
  mileage?: number;
  engine_type?: string;
  transmission?: string;
  fuel_type?: string;
  exterior_color?: string;
  interior_color?: string;
  features?: string[];
  media: AuctionCarMedia;
  location?: string;
  starting_price: number;
  reserve_price?: number;
  buy_now_price?: number;
  deposit_amount?: number;
}
