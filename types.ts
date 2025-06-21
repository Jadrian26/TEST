export interface School {
  id: string;
  name: string;
  logoUrl: string;
  category?: string; 
}

export interface ProductVariant {
  id: string; 
  size: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  variants: ProductVariant[]; 
  imageUrl: string;
  schoolId?: string; 
  orderIndex: number; 
}

export interface CartItem {
  product: Product; 
  quantity: number;
  selectedSize: string; 
  priceAtPurchase: number; 
}

export interface Address {
  id: string;
  primaryAddress: string; 
  apartmentOrHouseNumber: string; 
  deliveryInstructions: string; 
  isDefault: boolean;
  wazeUrl?: string;
  googleMapsUrl?: string;
  lat?: number; // Added latitude
  lon?: number; // Added longitude
}

export type DeliveryMethod = 'pickup' | 'delivery';

export interface Order {
  id: string;
  date: string;
  status: 'Delivered' | 'Shipped' | 'Processing' | 'Cancelled'; 
  total: number;
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number; 
    selectedSize: string;
  }>;
  shippingAddress: Address | null; // Can be null if pickup
  deliveryMethod: DeliveryMethod;
  userId: string; // ID del cliente al que pertenece el pedido para su historial
  placedByUserId?: string; // ID del Admin/Ventas que creó el pedido, si aplica
  customerNameForOrder?: string; // Nombre del cliente si Admin/Ventas lo ingresó y no existía
  customerIdCardForOrder?: string; // Cédula del cliente si Admin/Ventas la ingresó y no existía
}

export type UserRole = 'admin' | 'sales' | 'client';
export type SchoolApprovalStatus = 'pending' | 'approved' | 'rejected' | null; // null might mean not applicable (e.g. for admin)

export interface UserSchoolAffiliation {
  schoolId: string;
  status: SchoolApprovalStatus;
  requestedAt: string; // ISO date string
  lastUpdatedAt?: string; // ISO date string when status last changed
  adminNotes?: string; // Optional notes from admin regarding this affiliation
}

export interface UserProfile {
  id:string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string; 
  idCardNumber: string; 
  addresses: Address[];
  orders: Order[];
  role: UserRole; 
  affiliations: UserSchoolAffiliation[]; // Replaces schoolId, requestedSchoolId, schoolApprovalStatus
}

export interface AuthContextType {
  currentUser: UserProfile | null;
  registeredUsers: Array<UserProfile & { passwordHash: string }>;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (userData: Omit<UserProfile, 'id' | 'addresses' | 'orders' | 'phone' | 'role' | 'idCardNumber' | 'affiliations'> & { password: string; phone: string; initialSchoolIdRequest: string; idCardNumber: string; }) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateCurrentUserProfile: (updatedProfileData: Partial<Pick<UserProfile, 'firstName' | 'lastName' | 'email' | 'phone' | 'idCardNumber'>>) => Promise<{ success: boolean; message?: string }>;
  requestSchoolAffiliation: (schoolId: string) => Promise<{ success: boolean; message?: string }>; // New function for users to request new school affiliations
  updateUserAddresses: (newAddresses: Address[]) => Promise<{ success: boolean; message?: string }>;
  addMockOrder: (
    cartItems: CartItem[], 
    shippingAddress: Address | null, 
    deliveryMethod: DeliveryMethod,
    customerForOrder?: { name: string; idCard: string; }
  ) => Promise<{ success: boolean; orderId?: string; message?: string }>;
  updateOrderStatus: (userId: string, orderId: string, newStatus: Order['status']) => Promise<{ success: boolean; message?: string }>;
  updateUserProfileByAdmin: (userId: string, updatedData: Partial<UserProfile>) => Promise<{ success: boolean; message?: string }>; 
  sendPasswordResetEmail: (email: string) => Promise<{ success: boolean; message: string }>;
}


export interface MediaItem {
  id: string;
  name: string;
  type: string; 
  size: number; 
  dataUrl: string; 
  uploadedAt: string; 
  folderId?: string | null; // ID of the folder it belongs to, null for root
}

export interface MediaFolder {
  id: string;
  name: string;
  parentId: string | null; // null for root level folders
  createdAt: string; // ISO date string
}

export interface ValuePropositionCardData {
  id: string; // e.g., 'card1', 'card2', 'card3'
  iconId: string | null; // ID from MediaLibrary
  title: string;
  subtitle: string;
  defaultIconName: 'store' | 'delivery' | 'customerService' | 'storeUyB' | 'deliveryUyB' | 'customerServiceUyB'; // Added customerServiceUyB
  ariaLabel?: string; // Keep if still relevant for static parts
}

export interface PdfConfig {
  logoId: string | null;
  companyName: string;
  contactPhone: string;
  contactEmail: string;
  website: string;
  address: string;
  footerText: string;
  accentColor: string;
}

export interface EditableContentContextType {
  schools: School[];
  products: Product[];
  heroSlides: MediaItem[];
  heroCarouselInterval: number;
  schoolCarouselAnimationDurationPerItem: number;
  storeWazeUrl: string;
  storeGoogleMapsUrl: string;
  storeAddressDescription: string;
  valuePropositionCardsData: ValuePropositionCardData[];
  visitStoreSection_MainImageId: string | null;
  visitStoreSection_WazeButtonIconId: string | null;
  visitStoreSection_GoogleMapsButtonIconId: string | null;
  brandLogoId: string | null; 
  pdfConfig: PdfConfig; // New PDF configuration object
  updateSchool: (schoolId: string, updatedData: Partial<School>) => void;
  addSchool: (newSchoolData: Omit<School, 'id'>) => void;
  deleteSchool: (schoolId: string) => void;
  updateProduct: (productId: string, updatedData: Partial<Product>) => void;
  addProductToContext: (newProductData: Omit<Product, 'id' | 'orderIndex'> & { schoolId?: string }) => void;
  deleteProduct: (productId: string) => void;
  updateProductOrder: (schoolId: string, orderedProductIds: string[]) => void;
  updateHeroSlides: (newSlides: MediaItem[]) => void;
  updateHeroCarouselInterval: (newInterval: number) => void;
  updateSchoolCarouselAnimationDurationPerItem: (newDuration: number) => void;
  updateStoreWazeUrl: (newUrl: string) => void;
  updateStoreGoogleMapsUrl: (newUrl: string) => void;
  updateStoreAddressDescription: (newDescription: string) => void;
  updateValuePropositionCardsData: (newCardsData: ValuePropositionCardData[]) => void;
  updateVisitStoreSection_MainImageId: (newImageId: string | null) => void;
  updateVisitStoreSection_WazeButtonIconId: (newIconId: string | null) => void;
  updateVisitStoreSection_GoogleMapsButtonIconId: (newIconId: string | null) => void;
  updateBrandLogoId: (newLogoId: string | null) => void; 
  updatePdfConfig: (newConfig: Partial<PdfConfig>) => void; // New updater for PDF config
  isLoading: boolean;
}