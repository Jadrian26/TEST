export interface School {
  id: string;
  name: string;
  logoUrl: string; // This will be a public_url from Supabase Storage (media_items.public_url)
  category?: string;
  // DB columns: created_at, updated_at
}

export interface ProductVariant {
  id: string; // Could be client-generated if not stored separately or managed within JSON
  size: string;
  price: number;
}

export interface Product {
  id: string; // UUID from DB
  name: string;
  description: string;
  variants: ProductVariant[]; // Stored as JSONB in DB
  imageUrl: string; // This will be a public_url from Supabase Storage (media_items.public_url)
  schoolId?: string | null; // Foreign key to schools.id
  orderIndex: number;
  // DB columns: created_at, updated_at
}

export interface CartItem {
  product: Product; // Holds the full product object as present in the client
  quantity: number;
  selectedSize: string;
  priceAtPurchase: number; // Price of the selected variant at the time of adding to cart
}

export interface Address {
  id: string; // Client-generated unique ID for the address within the user's list
  primaryAddress: string;
  apartmentOrHouseNumber: string;
  deliveryInstructions: string;
  isDefault: boolean;
  wazeUrl?: string;
  googleMapsUrl?: string;
  lat?: number;
  lon?: number;
}

export type DeliveryMethod = 'pickup' | 'delivery';

// Raw DB structure for orders (used when fetching directly)
export interface DbOrder {
  id: string; // UUID from DB, actual primary key
  display_order_id: string; // User-facing ID like #12345
  user_id: string; // UUID of the profile
  order_date: string; // ISO date string
  status: 'Delivered' | 'Shipped' | 'Processing' | 'Cancelled';
  total_amount: number;
  shipping_address_json: Address | null; // Stores the selected Address object, or null for pickup
  delivery_method: DeliveryMethod;
  placed_by_user_id?: string | null; // UUID of admin/sales profile if they placed the order
  customer_name_for_order?: string | null; // Snapshot of customer name if placed by admin/sales
  customer_id_card_for_order?: string | null; // Snapshot of customer ID if placed by admin/sales
  created_at: string; // timestamptz
  updated_at: string; // timestamptz
}

// Raw DB structure for order_items
export interface DbOrderItem {
  id: string; // UUID from DB
  order_id: string; // Foreign key to orders.id
  product_id_ref?: string | null; // Foreign key to products.id (original product)
  product_name: string; // Snapshot of product name at time of order
  quantity: number;
  price_at_purchase: number; // Price per unit of the selected variant at time of purchase
  selected_size: string; // Snapshot of selected size
  created_at: string; // timestamptz
}

// Order structure for client-side use (constructed from DbOrder and DbOrderItem)
export interface Order {
  id: string; // This will be the display_order_id for UI use (e.g., /account/orders/ORDER_DISPLAY_ID)
  db_id: string; // Actual UUID from DB (orders.id), useful for updates/queries
  date: string; // From DbOrder.order_date
  status: 'Delivered' | 'Shipped' | 'Processing' | 'Cancelled'; // From DbOrder.status
  total: number; // From DbOrder.total_amount
  items: Array<{
    productId: string | null; // From DbOrderItem.product_id_ref
    name: string; // From DbOrderItem.product_name
    quantity: number; // From DbOrderItem.quantity
    price: number; // From DbOrderItem.price_at_purchase
    selectedSize: string; // From DbOrderItem.selected_size
  }>;
  shippingAddress: Address | null; // From DbOrder.shipping_address_json
  deliveryMethod: DeliveryMethod; // From DbOrder.delivery_method
  userId: string; // From DbOrder.user_id (owner of the order)
  placedByUserId?: string | null; // From DbOrder.placed_by_user_id
  customerNameForOrder?: string | null; // From DbOrder.customer_name_for_order
  customerIdCardForOrder?: string | null; // From DbOrder.customer_id_card_for_order
}


export interface UserProfile {
  id: string; // UUID from profiles table (matches auth.users.id)
  firstName: string; // Mapped from profiles.first_name
  lastName: string; // Mapped from profiles.last_name
  email: string; // From profiles.email (should be synced with auth.users.email)
  phone?: string | null; // From profiles.phone
  idCardNumber: string; // Mapped from profiles.id_card_number
  addresses: Address[]; // Stored as JSONB in profiles.addresses
  orders: Order[]; // This will be constructed by fetching from 'orders' and 'order_items' tables
  isAdmin?: boolean; // Mapped from profiles.is_admin
  isSales?: boolean; // Mapped from profiles.is_sales
  schoolId: string | null; // Mapped from profiles.school_id
  cartItems?: CartItem[]; // Added to store user's cart
  // DB columns: created_at, updated_at
}

// User data for registration, some fields are optional or handled by DB/auth
export type UserRegistrationData = Omit<UserProfile, 'id' | 'addresses' | 'orders' | 'isAdmin' | 'isSales' | 'cartItems'> & {
  password: string;
};


export interface AuthContextType {
  currentUser: UserProfile | null;
  loadingAuth: boolean;
  isLoggingOut?: boolean; // Added for logout specific loading state
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string; error?: any }>;
  register: (userData: UserRegistrationData) => Promise<{ success: boolean; message?: string; error?: any }>;
  logout: () => Promise<{ success: boolean; message?: string; error?: any }>; // Reverted signature
  updateCurrentUserProfile: (
    updatedProfileData: Partial<Pick<UserProfile, 'firstName' | 'lastName' | 'email' | 'phone' | 'schoolId' | 'idCardNumber'>>
  ) => Promise<{ success: boolean; message?: string }>;
  updateUserAddresses: (newAddresses: Address[]) => Promise<{ success: boolean; message?: string }>;
  updateUserCart: (items: CartItem[]) => Promise<{ success: boolean; message?: string }>; // Added
  createOrder: (
    cartItems: CartItem[],
    shippingAddress: Address | null, // Full address object or null for pickup
    deliveryMethod: DeliveryMethod,
    customerForOrder?: { name: string; idCard: string } // For admin/sales placing orders
  ) => Promise<{ success: boolean; orderId?: string; dbOrderId?: string; message?: string }>; // orderId is display_order_id
  updateOrderStatus: (order_db_id: string, newStatus: Order['status']) => Promise<{ success: boolean; message?: string }>;
  updateUserProfileByAdmin: (userId: string, updatedData: Partial<Pick<UserProfile, 'firstName' | 'lastName' | 'email' | 'phone' | 'schoolId' | 'idCardNumber' | 'isAdmin' | 'isSales'>>) => Promise<{ success: boolean; message?: string }>;
  sendPasswordResetEmail: (email: string) => Promise<{ success: boolean; message: string }>;
  fetchUserOrders: () => Promise<Order[]>; // Fetches orders for the currently logged-in user
  allUsers: UserProfile[]; // For admin view
  fetchAllUsers: () => Promise<void>; // For admin to fetch all users and their orders
  schoolSelectionIsMandatory: boolean; // New: True if both an admin AND a sales user exist
}


export interface MediaItem {
  id: string; // UUID from media_items table
  name: string; // From media_items.name (original file name)
  mimeType: string; // From media_items.mime_type
  size: number; // From media_items.size_bytes (in bytes)
  public_url: string; // From media_items.public_url
  uploadedAt: string; // From media_items.uploaded_at (ISO date string)
  file_path?: string; // Path in Supabase storage bucket, from media_items.file_path
  user_id_uploader?: string | null; // From media_items.user_id_uploader
}


export interface ValuePropositionCardData {
  id: string; // UUID from DB or client-generated for new cards
  iconId: string | null; // ID from media_items.id
  title: string;
  subtitle: string;
  defaultIconName: 'store' | 'delivery' | 'customerService' | 'storeUyB' | 'deliveryUyB' | 'customerServiceUyB';
  ariaLabel?: string;
  order_index?: number; // For ordering, from value_proposition_cards_config.order_index
  // DB columns: created_at, updated_at
}

export interface PdfConfig {
  logoId: string | null; // ID from media_items.id
  companyName: string;
  contactPhone: string;
  contactEmail: string;
  website: string;
  address: string;
  footerText: string;
  accentColor: string; // Hex color string
  // DB column: updated_at
}

export interface EditableContentContextType {
  schools: School[];
  products: Product[];
  heroSlides: MediaItem[]; // Array of MediaItem objects (resolved from hero_slides_config and media_items)
  heroCarouselInterval: number; // From general_site_settings
  schoolCarouselAnimationDurationPerItem: number; // From general_site_settings
  storeWazeUrl: string; // From general_site_settings
  storeGoogleMapsUrl: string; // From general_site_settings
  storeAddressDescription: string; // From general_site_settings
  valuePropositionCardsData: ValuePropositionCardData[]; // From value_proposition_cards_config
  visitStoreSection_MainImageId: string | null; // MediaItem.id, from general_site_settings
  visitStoreSection_WazeButtonIconId: string | null; // MediaItem.id, from general_site_settings
  visitStoreSection_GoogleMapsButtonIconId: string | null; // MediaItem.id, from general_site_settings
  brandLogoId: string | null; // MediaItem.id, from general_site_settings
  pdfConfig: PdfConfig; // From pdf_config
  isLoading: boolean;

  updateSchool: (schoolId: string, updatedData: Partial<Omit<School, 'id' | 'created_at' | 'updated_at'>>) => Promise<{success: boolean, message?: string}>;
  addSchool: (newSchoolData: Omit<School, 'id' | 'created_at' | 'updated_at'>) => Promise<{success: boolean, message?: string, newSchool?: School}>;
  deleteSchool: (schoolId: string) => Promise<{success: boolean, message?: string}>;

  updateProduct: (productId: string, updatedData: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at' | 'orderIndex'>>) => Promise<{success: boolean, message?: string}>;
  addProductToContext: (newProductData: Omit<Product, 'id' | 'orderIndex' | 'created_at' | 'updated_at'>) => Promise<{success: boolean, message?: string, newProduct?: Product}>;
  deleteProduct: (productId: string) => Promise<{success: boolean, message?: string}>;
  updateProductOrder: (schoolId: string | null, orderedProductIds: string[]) => Promise<{success: boolean, message?: string}>; // schoolId can be null for general products

  updateHeroSlides: (newSlidesMediaItemIds: string[]) => Promise<{success: boolean, message?: string}>;
  updateHeroCarouselInterval: (newInterval: number) => Promise<{success: boolean, message?: string}>;
  updateSchoolCarouselAnimationDurationPerItem: (newDuration: number) => Promise<{success: boolean, message?: string}>;

  updateStoreWazeUrl: (newUrl: string) => Promise<{success: boolean, message?: string}>;
  updateStoreGoogleMapsUrl: (newUrl: string) => Promise<{success: boolean, message?: string}>;
  updateStoreAddressDescription: (newDescription: string) => Promise<{success: boolean, message?: string}>;

  updateValuePropositionCardsData: (newCardsData: Array<Omit<ValuePropositionCardData, 'id' | 'created_at' | 'updated_at'>>) => Promise<{success: boolean, message?: string}>;
  updateVisitStoreSection_MainImageId: (newImageId: string | null) => Promise<{success: boolean, message?: string}>;
  updateVisitStoreSection_WazeButtonIconId: (newIconId: string | null) => Promise<{success: boolean, message?: string}>;
  updateVisitStoreSection_GoogleMapsButtonIconId: (newIconId: string | null) => Promise<{success: boolean, message?: string}>;

  updateBrandLogoId: (newLogoId: string | null) => Promise<{success: boolean, message?: string}>;
  updatePdfConfig: (newConfig: Partial<Omit<PdfConfig, 'updated_at'>>) => Promise<{success: boolean, message?: string}>;

  refreshContextData: () => Promise<void>;
}