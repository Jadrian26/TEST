import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { School, Product, MediaItem, ProductVariant, ValuePropositionCardData, PdfConfig } from './../types';
import { MOCK_SCHOOLS, MOCK_PRODUCTS, APP_NAME, SECONDARY_COLOR } from '../constants';

const SCHOOLS_STORAGE_KEY = 'editableSchools';
const PRODUCTS_STORAGE_KEY = 'editableProducts';
const HERO_SLIDES_STORAGE_KEY = 'heroCarouselSlidesData';
const HERO_CAROUSEL_INTERVAL_KEY = 'heroCarouselIntervalData';
const SCHOOL_CAROUSEL_ANIMATION_DURATION_KEY = 'schoolCarouselAnimationDurationPerItemData';
const STORE_WAZE_URL_KEY = 'storeWazeUrlData';
const STORE_GOOGLE_MAPS_URL_KEY = 'storeGoogleMapsUrlData';
const STORE_ADDRESS_DESCRIPTION_KEY = 'storeAddressDescriptionData';
const VALUE_PROPOSITION_CARDS_KEY = 'valuePropositionCardsData';
const VISIT_STORE_MAIN_IMAGE_ID_KEY = 'visitStoreSection_MainImageIdData';
const VISIT_STORE_WAZE_ICON_ID_KEY = 'visitStoreSection_WazeButtonIconIdData';
const VISIT_STORE_GMAPS_ICON_ID_KEY = 'visitStoreSection_GoogleMapsButtonIconIdData';
const BRAND_LOGO_ID_KEY = 'brandLogoIdData'; 
const PDF_CONFIG_KEY = 'pdfConfigurationData'; // New storage key

// DEFAULT_BRAND_LOGO_ID is removed as the default logo is no longer hardcoded.
// The system will default to null for brandLogoId if nothing is selected.

const DEFAULT_PDF_CONFIG: PdfConfig = {
  logoId: null,
  companyName: APP_NAME,
  contactPhone: "Ej: +507 123-4567",
  contactEmail: "Ej: contacto@empresa.com",
  website: "Ej: www.empresa.com",
  address: "Ej: Edificio Principal, Calle 1, Ciudad",
  footerText: "Gracias por su compra.",
  accentColor: SECONDARY_COLOR, // Default to site's secondary color
};

interface EditableContentContextType {
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
  pdfConfig: PdfConfig;
  updateSchool: (schoolId: string, updatedData: Partial<School>) => void;
  addSchool: (newSchoolData: Omit<School, 'id'>) => void;
  deleteSchool: (schoolId: string) => void;
  updateProduct: (productId: string, updatedData: Partial<Product>) => void;
  addProductToContext: (newProductData: Omit<Product, 'id' | 'orderIndex'> & { schoolId?: string }) => void;
  deleteProduct: (productId: string) => void;
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
  updatePdfConfig: (newConfig: Partial<PdfConfig>) => void;
  updateProductOrder: (schoolId: string, orderedProductIds: string[]) => void;
  isLoading: boolean;
}

const EditableContentContext = createContext<EditableContentContextType | undefined>(undefined);

const DEFAULT_WAZE_URL = "https://www.waze.com/es/live-map/directions/pa/provincia-de-panama/panama/uniformes-y-bordados-escolares?to=place.ChIJ3yLseMeprI8RO0CxhS2naiU";
const DEFAULT_GOOGLE_MAPS_URL = "https://www.google.com/maps/place/Uniformes+y+Bordados+Escolares/@9.0763584,-79.4535665,17z/data=!3m1!4b1!4m6!3m5!1s0x8faca9c778ec22df:0x256aa72d85b1403b!8m2!3d9.0763584!4d-79.4535665!16s%2Fg%2F11hchzfrl9?entry=ttu&g_ep=EgoyMDI1MDUxNS4xIKXMDSoASAFQAw%3D%3D";
const DEFAULT_STORE_ADDRESS_DESCRIPTION = "San Miguelito, Brisas del Golf, Calle 39 Norte (Al final de la calle sin salida).";
const DEFAULT_VALUE_PROPOSITION_CARDS: ValuePropositionCardData[] = [
  {
    id: 'vp-1',
    iconId: null,
    defaultIconName: 'storeUyB',
    title: 'Entrega en local',
    subtitle: 'Lunes a viernes (9:30am a 3:00pm)',
    ariaLabel: "Entrega en local, Lunes a viernes de 9:30am a 3:00pm"
  },
  {
    id: 'vp-2',
    iconId: null,
    defaultIconName: 'deliveryUyB', 
    title: 'Entrega a domicilio',
    subtitle: 'Disponible en 24 - 72 horas (Para pedidos realizados de Lunes a viernes)',
    ariaLabel: "Entrega a domicilio, Disponible en 24 a 72 horas para pedidos realizados de Lunes a viernes"
  },
  {
    id: 'vp-3',
    iconId: null,
    defaultIconName: 'customerServiceUyB', // Changed from 'customerService'
    title: 'Atención al cliente',
    subtitle: 'Lunes a viernes (9:30am a 3:00pm)',
    ariaLabel: "Atención al cliente, Lunes a viernes de 9:30am a 3:00pm"
  },
];


export const EditableContentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [schools, setSchools] = useState<School[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [heroSlides, setHeroSlides] = useState<MediaItem[]>([]);
  const [heroCarouselInterval, setHeroCarouselInterval] = useState<number>(3); 
  const [schoolCarouselAnimationDurationPerItem, setSchoolCarouselAnimationDurationPerItem] = useState<number>(5);
  const [storeWazeUrl, setStoreWazeUrl] = useState<string>(DEFAULT_WAZE_URL);
  const [storeGoogleMapsUrl, setStoreGoogleMapsUrl] = useState<string>(DEFAULT_GOOGLE_MAPS_URL);
  const [storeAddressDescription, setStoreAddressDescription] = useState<string>(DEFAULT_STORE_ADDRESS_DESCRIPTION);
  const [valuePropositionCardsData, setValuePropositionCardsData] = useState<ValuePropositionCardData[]>(DEFAULT_VALUE_PROPOSITION_CARDS);
  const [visitStoreSection_MainImageId, setVisitStoreSection_MainImageId] = useState<string | null>(null);
  const [visitStoreSection_WazeButtonIconId, setVisitStoreSection_WazeButtonIconId] = useState<string | null>(null);
  const [visitStoreSection_GoogleMapsButtonIconId, setVisitStoreSection_GoogleMapsButtonIconId] = useState<string | null>(null);
  const [brandLogoId, setBrandLogoId] = useState<string | null>(null); 
  const [pdfConfig, setPdfConfig] = useState<PdfConfig>(DEFAULT_PDF_CONFIG);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedSchools = localStorage.getItem(SCHOOLS_STORAGE_KEY);
      setSchools(storedSchools ? JSON.parse(storedSchools) : MOCK_SCHOOLS);

      const storedProducts = localStorage.getItem(PRODUCTS_STORAGE_KEY);
      let loadedProductsRaw: Product[] = storedProducts ? JSON.parse(storedProducts) : MOCK_PRODUCTS;
      const productsWithOrderIndex = loadedProductsRaw.map((product, index) => ({
        ...product, orderIndex: typeof product.orderIndex === 'number' ? product.orderIndex : index,
      }));
      setProducts(productsWithOrderIndex);
      if (JSON.stringify(productsWithOrderIndex) !== JSON.stringify(loadedProductsRaw)) {
        localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(productsWithOrderIndex));
      }

      const storedHeroSlides = localStorage.getItem(HERO_SLIDES_STORAGE_KEY);
      setHeroSlides(storedHeroSlides ? JSON.parse(storedHeroSlides) : []);
      
      const storedHeroInterval = localStorage.getItem(HERO_CAROUSEL_INTERVAL_KEY);
      setHeroCarouselInterval(storedHeroInterval ? parseFloat(storedHeroInterval) : 3); 

      const storedSchoolAnimationDuration = localStorage.getItem(SCHOOL_CAROUSEL_ANIMATION_DURATION_KEY);
      setSchoolCarouselAnimationDurationPerItem(storedSchoolAnimationDuration ? parseFloat(storedSchoolAnimationDuration) : 5);

      const storedWazeUrl = localStorage.getItem(STORE_WAZE_URL_KEY);
      setStoreWazeUrl(storedWazeUrl || DEFAULT_WAZE_URL);
      const storedGoogleMapsUrl = localStorage.getItem(STORE_GOOGLE_MAPS_URL_KEY);
      setStoreGoogleMapsUrl(storedGoogleMapsUrl || DEFAULT_GOOGLE_MAPS_URL);
      const storedAddressDescription = localStorage.getItem(STORE_ADDRESS_DESCRIPTION_KEY);
      setStoreAddressDescription(storedAddressDescription || DEFAULT_STORE_ADDRESS_DESCRIPTION);

      const storedValuePropositionCards = localStorage.getItem(VALUE_PROPOSITION_CARDS_KEY);
      setValuePropositionCardsData(storedValuePropositionCards ? JSON.parse(storedValuePropositionCards) : DEFAULT_VALUE_PROPOSITION_CARDS);

      const storedVisitStoreMainImageId = localStorage.getItem(VISIT_STORE_MAIN_IMAGE_ID_KEY);
      setVisitStoreSection_MainImageId(storedVisitStoreMainImageId ? JSON.parse(storedVisitStoreMainImageId) : null);
      const storedVisitStoreWazeIconId = localStorage.getItem(VISIT_STORE_WAZE_ICON_ID_KEY);
      setVisitStoreSection_WazeButtonIconId(storedVisitStoreWazeIconId ? JSON.parse(storedVisitStoreWazeIconId) : null);
      const storedVisitStoreGMapsIconId = localStorage.getItem(VISIT_STORE_GMAPS_ICON_ID_KEY);
      setVisitStoreSection_GoogleMapsButtonIconId(storedVisitStoreGMapsIconId ? JSON.parse(storedVisitStoreGMapsIconId) : null);
      
      const storedBrandLogoIdJson = localStorage.getItem(BRAND_LOGO_ID_KEY);
      let parsedBrandLogoId = null;
      if (storedBrandLogoIdJson) {
        try {
          const tempParsed = JSON.parse(storedBrandLogoIdJson);
          // If the stored ID was the old default "default-brand-logo-svg", or if it's explicitly "null", treat as null.
          if (tempParsed === "default-brand-logo-svg" || tempParsed === null) {
            parsedBrandLogoId = null;
          } else if (typeof tempParsed === 'string' && tempParsed.trim() !== "") {
            parsedBrandLogoId = tempParsed;
          }
        } catch (e) {
          console.error("Error parsing brandLogoId from localStorage", e);
        }
      }
      setBrandLogoId(parsedBrandLogoId);
      // Ensure localStorage reflects null if it was the old default or explicitly null
      if (parsedBrandLogoId === null && storedBrandLogoIdJson !== JSON.stringify(null)) {
        localStorage.setItem(BRAND_LOGO_ID_KEY, JSON.stringify(null));
      }


      const storedPdfConfig = localStorage.getItem(PDF_CONFIG_KEY);
      setPdfConfig(storedPdfConfig ? { ...DEFAULT_PDF_CONFIG, ...JSON.parse(storedPdfConfig) } : DEFAULT_PDF_CONFIG);


    } catch (error) {
      console.error("Error al cargar contenido editable desde localStorage:", error);
      // Reset to defaults on error
      setSchools(MOCK_SCHOOLS);
      setProducts(MOCK_PRODUCTS.map((p, idx) => ({ ...p, orderIndex: idx })));
      setHeroSlides([]);
      setHeroCarouselInterval(3);
      setSchoolCarouselAnimationDurationPerItem(5);
      setStoreWazeUrl(DEFAULT_WAZE_URL);
      setStoreGoogleMapsUrl(DEFAULT_GOOGLE_MAPS_URL);
      setStoreAddressDescription(DEFAULT_STORE_ADDRESS_DESCRIPTION);
      setValuePropositionCardsData(DEFAULT_VALUE_PROPOSITION_CARDS);
      setVisitStoreSection_MainImageId(null);
      setVisitStoreSection_WazeButtonIconId(null);
      setVisitStoreSection_GoogleMapsButtonIconId(null);
      setBrandLogoId(null); // Default to null
      localStorage.setItem(BRAND_LOGO_ID_KEY, JSON.stringify(null)); // Store null
      setPdfConfig(DEFAULT_PDF_CONFIG);
      localStorage.setItem(PDF_CONFIG_KEY, JSON.stringify(DEFAULT_PDF_CONFIG));
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    if (!isLoading) {
      if (localStorage.getItem(SCHOOLS_STORAGE_KEY) === null && schools.length > 0) localStorage.setItem(SCHOOLS_STORAGE_KEY, JSON.stringify(schools));
      if (localStorage.getItem(PRODUCTS_STORAGE_KEY) === null && products.length > 0) localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
      if (localStorage.getItem(STORE_WAZE_URL_KEY) === null) localStorage.setItem(STORE_WAZE_URL_KEY, storeWazeUrl);
      if (localStorage.getItem(STORE_GOOGLE_MAPS_URL_KEY) === null) localStorage.setItem(STORE_GOOGLE_MAPS_URL_KEY, storeGoogleMapsUrl);
      if (localStorage.getItem(STORE_ADDRESS_DESCRIPTION_KEY) === null) localStorage.setItem(STORE_ADDRESS_DESCRIPTION_KEY, storeAddressDescription);
      if (localStorage.getItem(VALUE_PROPOSITION_CARDS_KEY) === null) localStorage.setItem(VALUE_PROPOSITION_CARDS_KEY, JSON.stringify(valuePropositionCardsData));
      if (localStorage.getItem(VISIT_STORE_MAIN_IMAGE_ID_KEY) === null && visitStoreSection_MainImageId !== null) localStorage.setItem(VISIT_STORE_MAIN_IMAGE_ID_KEY, JSON.stringify(visitStoreSection_MainImageId));
      if (localStorage.getItem(VISIT_STORE_WAZE_ICON_ID_KEY) === null && visitStoreSection_WazeButtonIconId !== null) localStorage.setItem(VISIT_STORE_WAZE_ICON_ID_KEY, JSON.stringify(visitStoreSection_WazeButtonIconId));
      if (localStorage.getItem(VISIT_STORE_GMAPS_ICON_ID_KEY) === null && visitStoreSection_GoogleMapsButtonIconId !== null) localStorage.setItem(VISIT_STORE_GMAPS_ICON_ID_KEY, JSON.stringify(visitStoreSection_GoogleMapsButtonIconId));
      if (localStorage.getItem(BRAND_LOGO_ID_KEY) === null || (localStorage.getItem(BRAND_LOGO_ID_KEY) === "null" && brandLogoId !== null) || localStorage.getItem(BRAND_LOGO_ID_KEY) !== JSON.stringify(brandLogoId) ) {
         localStorage.setItem(BRAND_LOGO_ID_KEY, JSON.stringify(brandLogoId));
      }
      if (localStorage.getItem(PDF_CONFIG_KEY) === null) localStorage.setItem(PDF_CONFIG_KEY, JSON.stringify(pdfConfig));
    }
  }, [isLoading, schools, products, storeWazeUrl, storeGoogleMapsUrl, storeAddressDescription, valuePropositionCardsData, visitStoreSection_MainImageId, visitStoreSection_WazeButtonIconId, visitStoreSection_GoogleMapsButtonIconId, brandLogoId, pdfConfig]);


  const updateSchool = useCallback((schoolId: string, updatedData: Partial<School>) => {
    setSchools(prevSchools => {
      const newSchools = prevSchools.map(school => school.id === schoolId ? { ...school, ...updatedData } : school);
      localStorage.setItem(SCHOOLS_STORAGE_KEY, JSON.stringify(newSchools));
      return newSchools;
    });
  }, []);

  const addSchool = useCallback((newSchoolData: Omit<School, 'id'>) => {
    setSchools(prevSchools => {
      const newSchool: School = { ...newSchoolData, id: `school-new-${Date.now()}` };
      const newSchools = [...prevSchools, newSchool];
      localStorage.setItem(SCHOOLS_STORAGE_KEY, JSON.stringify(newSchools));
      return newSchools;
    });
  }, []);

  const deleteSchool = useCallback((schoolId: string) => {
    setSchools(prevSchools => {
      const newSchools = prevSchools.filter(school => school.id !== schoolId);
      localStorage.setItem(SCHOOLS_STORAGE_KEY, JSON.stringify(newSchools));
      return newSchools;
    });
    setProducts(prevProducts => {
      const updatedProducts = prevProducts.map(product => product.schoolId === schoolId ? { ...product, schoolId: undefined } : product);
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(updatedProducts));
      return updatedProducts;
    });
  }, []);

  const updateProduct = useCallback((productId: string, updatedData: Partial<Product>) => {
    setProducts(prevProducts => {
      const newProducts = prevProducts.map(product => product.id === productId ? { ...product, ...updatedData } : product);
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(newProducts));
      return newProducts;
    });
  }, []);

  const addProductToContext = useCallback((newProductData: Omit<Product, 'id' | 'orderIndex'> & { schoolId?: string}) => {
    setProducts(prevProducts => {
      const productsOfSameSchool = prevProducts.filter(p => p.schoolId === newProductData.schoolId);
      const newOrderIndex = productsOfSameSchool.length;
      const newProduct: Product = { ...newProductData, id: `product-new-${Date.now()}`, variants: newProductData.variants as ProductVariant[], orderIndex: newOrderIndex };
      const newProducts = [...prevProducts, newProduct];
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(newProducts));
      return newProducts;
    });
  }, []);

  const deleteProduct = useCallback((productId: string) => {
    setProducts(prevProducts => {
      const productToDelete = prevProducts.find(p => p.id === productId);
      if (!productToDelete) return prevProducts;
      const remainingProducts = prevProducts.filter(product => product.id !== productId);
      const productsOfSameSchool = remainingProducts.filter(p => p.schoolId === productToDelete.schoolId).sort((a, b) => a.orderIndex - b.orderIndex).map((p, index) => ({ ...p, orderIndex: index }));
      const otherProducts = remainingProducts.filter(p => p.schoolId !== productToDelete.schoolId);
      const newProducts = [...otherProducts, ...productsOfSameSchool];
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(newProducts));
      return newProducts;
    });
  }, []);
  
  const updateProductOrder = useCallback((schoolId: string, orderedProductIds: string[]) => {
    setProducts(prevProducts => {
      const schoolProductsToReorder = prevProducts.filter(p => p.schoolId === schoolId);
      const otherProducts = prevProducts.filter(p => p.schoolId !== schoolId);
      const productMap = new Map(schoolProductsToReorder.map(p => [p.id, p]));
      const reorderedSchoolProducts = orderedProductIds.map((id, index) => {
        const product = productMap.get(id);
        return product ? { ...product, orderIndex: index } : null;
      }).filter(p => p !== null) as Product[];
      const newProducts = [...otherProducts, ...reorderedSchoolProducts];
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(newProducts));
      return newProducts;
    });
  }, []);

  const updateHeroSlides = useCallback((newSlides: MediaItem[]) => {
    setHeroSlides(newSlides);
    localStorage.setItem(HERO_SLIDES_STORAGE_KEY, JSON.stringify(newSlides));
  }, []);

  const updateHeroCarouselInterval = useCallback((newInterval: number) => {
    const val = Math.max(2, Math.min(30, newInterval)); 
    setHeroCarouselInterval(val);
    localStorage.setItem(HERO_CAROUSEL_INTERVAL_KEY, JSON.stringify(val));
  }, []);

  const updateSchoolCarouselAnimationDurationPerItem = useCallback((newDuration: number) => {
    const val = Math.max(1, Math.min(20, newDuration)); 
    setSchoolCarouselAnimationDurationPerItem(val);
    localStorage.setItem(SCHOOL_CAROUSEL_ANIMATION_DURATION_KEY, JSON.stringify(val));
  }, []);

  const updateStoreWazeUrl = useCallback((newUrl: string) => { setStoreWazeUrl(newUrl); localStorage.setItem(STORE_WAZE_URL_KEY, newUrl); }, []);
  const updateStoreGoogleMapsUrl = useCallback((newUrl: string) => { setStoreGoogleMapsUrl(newUrl); localStorage.setItem(STORE_GOOGLE_MAPS_URL_KEY, newUrl); }, []);
  const updateStoreAddressDescription = useCallback((newDescription: string) => { setStoreAddressDescription(newDescription); localStorage.setItem(STORE_ADDRESS_DESCRIPTION_KEY, newDescription); }, []);

  const updateValuePropositionCardsData = useCallback((newCardsData: ValuePropositionCardData[]) => {
    setValuePropositionCardsData(newCardsData);
    localStorage.setItem(VALUE_PROPOSITION_CARDS_KEY, JSON.stringify(newCardsData));
  }, []);

  const updateVisitStoreSection_MainImageId = useCallback((newImageId: string | null) => {
    setVisitStoreSection_MainImageId(newImageId);
    localStorage.setItem(VISIT_STORE_MAIN_IMAGE_ID_KEY, JSON.stringify(newImageId));
  }, []);
  const updateVisitStoreSection_WazeButtonIconId = useCallback((newIconId: string | null) => {
    setVisitStoreSection_WazeButtonIconId(newIconId);
    localStorage.setItem(VISIT_STORE_WAZE_ICON_ID_KEY, JSON.stringify(newIconId));
  }, []);
  const updateVisitStoreSection_GoogleMapsButtonIconId = useCallback((newIconId: string | null) => {
    setVisitStoreSection_GoogleMapsButtonIconId(newIconId);
    localStorage.setItem(VISIT_STORE_GMAPS_ICON_ID_KEY, JSON.stringify(newIconId));
  }, []);

  const updateBrandLogoId = useCallback((newLogoId: string | null) => { 
    setBrandLogoId(newLogoId);
    localStorage.setItem(BRAND_LOGO_ID_KEY, JSON.stringify(newLogoId));
  }, []);

  const updatePdfConfig = useCallback((newConfigPartial: Partial<PdfConfig>) => {
    setPdfConfig(prevConfig => {
      const updatedConfig = { ...prevConfig, ...newConfigPartial };
      localStorage.setItem(PDF_CONFIG_KEY, JSON.stringify(updatedConfig));
      return updatedConfig;
    });
  }, []);


  return (
    <EditableContentContext.Provider value={{
        schools, products, heroSlides, heroCarouselInterval, schoolCarouselAnimationDurationPerItem,
        storeWazeUrl, storeGoogleMapsUrl, storeAddressDescription, valuePropositionCardsData,
        visitStoreSection_MainImageId, visitStoreSection_WazeButtonIconId, visitStoreSection_GoogleMapsButtonIconId,
        brandLogoId, pdfConfig,
        updateSchool, addSchool, deleteSchool,
        updateProduct, addProductToContext, deleteProduct, updateProductOrder,
        updateHeroSlides, updateHeroCarouselInterval, updateSchoolCarouselAnimationDurationPerItem,
        updateStoreWazeUrl, updateStoreGoogleMapsUrl, updateStoreAddressDescription,
        updateValuePropositionCardsData,
        updateVisitStoreSection_MainImageId, updateVisitStoreSection_WazeButtonIconId, updateVisitStoreSection_GoogleMapsButtonIconId,
        updateBrandLogoId, updatePdfConfig,
        isLoading
    }}>
      {children}
    </EditableContentContext.Provider>
  );
};

export const useEditableContent = (): EditableContentContextType => {
  const context = useContext(EditableContentContext);
  if (context === undefined) {
    throw new Error('useEditableContent debe ser utilizado dentro de un EditableContentProvider');
  }
  return context;
};