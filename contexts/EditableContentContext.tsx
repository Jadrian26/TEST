
import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { School, Product, MediaItem, ValuePropositionCardData, PdfConfig, EditableContentContextType } from '../types';
import { APP_NAME, SECONDARY_COLOR } from '../constants';

// DEFAULT values for fallback or initial seeding
const DEFAULT_WAZE_URL = "https://www.waze.com/es/live-map/directions/pa/provincia-de-panama/panama/uniformes-y-bordados-escolares?to=place.ChIJ3yLseMeprI8RO0CxhS2naiU";
const DEFAULT_GOOGLE_MAPS_URL = "https://www.google.com/maps/place/Uniformes+y+Bordados+Escolares/@9.0763584,-79.4535665,17z/data=!3m1!4b1!4m6!3m5!1s0x8faca9c778ec22df:0x256aa72d85b1403b!8m2!3d9.0763584!4d-79.4535665!16s%2Fg%2F11hchzfrl9?entry=ttu&g_ep=EgoyMDI1MDUxNS4xIKXMDSoASAFQAw%3D%3D";
const DEFAULT_STORE_ADDRESS_DESCRIPTION = "San Miguelito, Brisas del Golf, Calle 39 Norte (Al final de la calle sin salida).";
const DEFAULT_VALUE_PROPOSITION_CARDS_DB_SEED: Omit<ValuePropositionCardData, 'id' | 'order_index' | 'iconId'>[] = [
  { title: 'Entrega en local', subtitle: 'Lunes a viernes (9:30am a 3:00pm)', defaultIconName: 'storeUyB' },
  { title: 'Entrega a domicilio', subtitle: 'Disponible en 24 - 72 horas (Para pedidos realizados de Lunes a viernes)', defaultIconName: 'deliveryUyB' },
  { title: 'Atención al cliente', subtitle: 'Lunes a viernes (9:30am a 3:00pm)', defaultIconName: 'customerServiceUyB' },
];
const DEFAULT_PDF_CONFIG: Omit<PdfConfig, 'logoId'> = {
  companyName: APP_NAME,
  contactPhone: "Ej: +507 123-4567",
  contactEmail: "Ej: contacto@empresa.com",
  website: "Ej: www.empresa.com",
  address: "Ej: Edificio Principal, Calle 1, Ciudad",
  footerText: "Gracias por su compra.",
  accentColor: SECONDARY_COLOR,
};

const EditableContentContext = createContext<EditableContentContextType | undefined>(undefined);

export const EditableContentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [schools, setSchools] = useState<School[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [heroSlides, setHeroSlides] = useState<MediaItem[]>([]);
  const [heroCarouselInterval, setHeroCarouselInterval] = useState<number>(3);
  const [schoolCarouselAnimationDurationPerItem, setSchoolCarouselAnimationDurationPerItem] = useState<number>(5);
  const [storeWazeUrl, setStoreWazeUrl] = useState<string>(DEFAULT_WAZE_URL);
  const [storeGoogleMapsUrl, setStoreGoogleMapsUrl] = useState<string>(DEFAULT_GOOGLE_MAPS_URL);
  const [storeAddressDescription, setStoreAddressDescription] = useState<string>(DEFAULT_STORE_ADDRESS_DESCRIPTION);
  const [valuePropositionCardsData, setValuePropositionCardsData] = useState<ValuePropositionCardData[]>([]);
  const [visitStoreSection_MainImageId, setVisitStoreSection_MainImageId] = useState<string | null>(null);
  const [visitStoreSection_WazeButtonIconId, setVisitStoreSection_WazeButtonIconId] = useState<string | null>(null);
  const [visitStoreSection_GoogleMapsButtonIconId, setVisitStoreSection_GoogleMapsButtonIconId] = useState<string | null>(null);
  const [brandLogoId, setBrandLogoId] = useState<string | null>(null);
  const [pdfConfig, setPdfConfig] = useState<PdfConfig>({ ...DEFAULT_PDF_CONFIG, logoId: null });
  const [isLoading, setIsLoading] = useState(true);

  const fetchAndSetAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch Schools
      const { data: schoolsData, error: schoolsError } = await supabase.from('schools').select('*').order('name');
      if (schoolsError) throw schoolsError;
      setSchools(schoolsData?.map(s => ({...s, logoUrl: s.logo_url})) || []); // Map logo_url to logoUrl

      // Fetch Products
      const { data: productsData, error: productsError } = await supabase.from('products').select('*').order('order_index');
      if (productsError) throw productsError;
      setProducts(productsData?.map(p => ({
          ...p, 
          schoolId: p.school_id,
          imageUrl: p.image_url // Map image_url to imageUrl
        })) || []);

      // Fetch General Site Settings
      const { data: gsData, error: gsError } = await supabase.from('general_site_settings').select('*').eq('id', true).single();
      if (gsError) {
        if (gsError.code === 'PGRST116') {
            console.warn("EditableContentContext: 'general_site_settings' row not found. Using default values. Ensure this table is seeded with one row where id = true.");
        } else {
            console.error("Error fetching general settings:", gsError.message);
        }
      }
      setHeroCarouselInterval(gsData?.hero_carousel_interval ?? 3);
      setSchoolCarouselAnimationDurationPerItem(gsData?.school_carousel_duration_per_item ?? 5);
      setStoreWazeUrl(gsData?.store_waze_url ?? DEFAULT_WAZE_URL);
      setStoreGoogleMapsUrl(gsData?.store_google_maps_url ?? DEFAULT_GOOGLE_MAPS_URL);
      setStoreAddressDescription(gsData?.store_address_description ?? DEFAULT_STORE_ADDRESS_DESCRIPTION);
      setVisitStoreSection_MainImageId(gsData?.visit_store_main_image_id ?? null);
      setVisitStoreSection_WazeButtonIconId(gsData?.visit_store_waze_icon_id ?? null);
      setVisitStoreSection_GoogleMapsButtonIconId(gsData?.visit_store_gmaps_icon_id ?? null);
      setBrandLogoId(gsData?.brand_logo_id ?? null);

      // Fetch Hero Slides
      const { data: hsConfig, error: hsError } = await supabase
        .from('hero_slides_config')
        .select('order_index, media_items!inner(*)')
        .order('order_index');
      if (hsError) throw hsError;
      setHeroSlides(hsConfig?.map((hs: any) => ({
          id: hs.media_items.id,
          name: hs.media_items.name,
          mimeType: hs.media_items.mime_type,
          size: hs.media_items.size_bytes,
          public_url: hs.media_items.public_url,
          uploadedAt: hs.media_items.uploaded_at,
          file_path: hs.media_items.file_path,
      })) || []);

      // Fetch Value Proposition Cards
      const { data: vpcData, error: vpcError } = await supabase.from('value_proposition_cards_config').select('*').order('order_index');
      if (vpcError) throw vpcError;
      if (vpcData && vpcData.length > 0) {
          setValuePropositionCardsData(vpcData.map(card => ({
              id: card.id,
              iconId: card.icon_media_item_id,
              title: card.title,
              subtitle: card.subtitle,
              defaultIconName: card.default_icon_name as ValuePropositionCardData['defaultIconName'],
              order_index: card.order_index
          })));
      } else {
          setValuePropositionCardsData(DEFAULT_VALUE_PROPOSITION_CARDS_DB_SEED.map((card, i) => ({...card, id: `default-vp-${i}`, order_index: i, iconId: null })));
      }

      // Fetch PDF Config
      const { data: pcData, error: pcError } = await supabase.from('pdf_config').select('*').eq('id', true).single();
      if (pcError) {
         if (pcError.code === 'PGRST116') {
            console.warn("EditableContentContext: 'pdf_config' row not found. Using default values. Ensure this table is seeded with one row where id = true.");
        } else {
            console.error("Error fetching PDF config:", pcError.message);
        }
      }
      setPdfConfig(pcData ? {
        logoId: pcData.logo_id,
        companyName: pcData.company_name || DEFAULT_PDF_CONFIG.companyName,
        contactPhone: pcData.contact_phone || DEFAULT_PDF_CONFIG.contactPhone,
        contactEmail: pcData.contact_email || DEFAULT_PDF_CONFIG.contactEmail,
        website: pcData.website || DEFAULT_PDF_CONFIG.website,
        address: pcData.address || DEFAULT_PDF_CONFIG.address,
        footerText: pcData.footer_text || DEFAULT_PDF_CONFIG.footerText,
        accentColor: pcData.accent_color || DEFAULT_PDF_CONFIG.accentColor,
      } : { ...DEFAULT_PDF_CONFIG, logoId: null });

    } catch (error: any) {
      console.error("Error loading editable content from Supabase:", error.message || error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshContextData = useCallback(async () => { await fetchAndSetAllData(); }, [fetchAndSetAllData]);

  useEffect(() => { 
    fetchAndSetAllData(); 
  }, [fetchAndSetAllData]);


  const updateSingleRowConfig = useCallback(async (tableName: string, data: Record<string, any>) => {
    const { error: updateError } = await supabase.from(tableName).update(data).eq('id', true);
    if (updateError) return { success: false, message: updateError.message };
    try {
      await refreshContextData(); 
      return { success: true };
    } catch (refreshError: any) {
      console.error(`Error refreshing context data after updating ${tableName}:`, refreshError);
      return { success: false, message: `Datos guardados, pero error al refrescar: ${refreshError.message}` };
    }
  }, [refreshContextData]);

  const addSchool = useCallback(async (newSchoolData: Omit<School, 'id' | 'created_at' | 'updated_at'>): Promise<{success: boolean, message?: string, newSchool?: School}> => {
    const schoolToInsert = {
      name: newSchoolData.name,
      logo_url: newSchoolData.logoUrl,
      category: newSchoolData.category, 
    };
    const { data, error } = await supabase.from('schools').insert(schoolToInsert).select().single();
    if (error) return { success: false, message: error.message };
    await refreshContextData();
    if (data) return { success: true, newSchool: {...data, logoUrl: data.logo_url} as School };
    return { success: false, message: "Error al añadir colegio."};
  }, [refreshContextData]);

  const updateSchool = useCallback(async (schoolId: string, updatedData: Partial<Omit<School, 'id' | 'created_at' | 'updated_at'>>): Promise<{success: boolean, message?: string}> => {
    const dbUpdates: Record<string, any> = { ...updatedData };
    if (updatedData.logoUrl !== undefined) {
      dbUpdates.logo_url = updatedData.logoUrl;
      delete (dbUpdates as any).logoUrl;
    }
    const { error } = await supabase.from('schools').update(dbUpdates).eq('id', schoolId);
    if (error) return { success: false, message: error.message };
    await refreshContextData();
    return { success: true };
  }, [refreshContextData]);

  const deleteSchool = useCallback(async (schoolId: string): Promise<{success: boolean, message?: string}> => {
    const { error } = await supabase.from('schools').delete().eq('id', schoolId);
    if (error) return { success: false, message: error.message };
    await refreshContextData();
    return { success: true };
  }, [refreshContextData]);

  const addProductToContext = useCallback(async (newProductData: Omit<Product, 'id' | 'orderIndex' | 'created_at' | 'updated_at'>): Promise<{success: boolean, message?: string, newProduct?: Product}> => {
    const schoolSpecificProducts = products.filter(p => p.schoolId === (newProductData.schoolId || null));
    const newOrderIndex = schoolSpecificProducts.length > 0 ? Math.max(...schoolSpecificProducts.map(p => p.orderIndex)) + 1 : 0;
    
    const productToInsert: Record<string, any> = { 
        name: newProductData.name,
        description: newProductData.description,
        variants: newProductData.variants,
        image_url: newProductData.imageUrl, 
        school_id: newProductData.schoolId,
        order_index: newOrderIndex 
    };

    const { data, error } = await supabase.from('products').insert(productToInsert).select().single();
    if (error) return { success: false, message: error.message };
    await refreshContextData();
    if (data) return { success: true, newProduct: {...data, schoolId: data.school_id, imageUrl: data.image_url} as Product };
    return { success: false, message: "Error al añadir producto."};
  }, [products, refreshContextData]);

  const updateProduct = useCallback(async (productId: string, updatedData: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at' | 'orderIndex'>>): Promise<{success: boolean, message?: string}> => {
    const dbUpdates: Record<string, any> = {...updatedData};
    if (updatedData.schoolId !== undefined) { dbUpdates.school_id = updatedData.schoolId; delete (dbUpdates as any).schoolId; }
    if (updatedData.imageUrl !== undefined) { dbUpdates.image_url = updatedData.imageUrl; delete (dbUpdates as any).imageUrl; }
    
    const { error } = await supabase.from('products').update(dbUpdates).eq('id', productId);
    if (error) return { success: false, message: error.message };
    await refreshContextData();
    return { success: true };
  }, [refreshContextData]);

  const deleteProduct = useCallback(async (productId: string): Promise<{success: boolean, message?: string}> => {
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) return { success: false, message: error.message };
    await refreshContextData();
    return { success: true };
  }, [refreshContextData]);

  const updateProductOrder = useCallback(async (schoolId: string | null, orderedProductIds: string[]): Promise<{success: boolean, message?: string}> => {
    const updates = orderedProductIds.map((id, index) => 
      supabase.from('products').update({ order_index: index }).eq('id', id).eq('school_id', schoolId)
    );
    const results = await Promise.all(updates.map(p => p.then(res => res.error ? res.error : null)));
    const firstError = results.find(r => r !== null);
    if (firstError) return { success: false, message: "Error actualizando orden: " + (firstError as any).message };
    await refreshContextData();
    return { success: true };
  }, [refreshContextData]);

  const updateHeroSlides = useCallback(async (newSlidesMediaItemIds: string[]): Promise<{success: boolean, message?: string}> => {
    const { error: deleteError } = await supabase.from('hero_slides_config').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (deleteError) {
        console.error("Error deleting hero slides:", deleteError);
        return { success: false, message: `Error al eliminar diapositivas antiguas: ${deleteError.message}` };
    }

    if (newSlidesMediaItemIds.length > 0) {
      const slidesToInsert = newSlidesMediaItemIds.map((media_item_id, index) => ({ media_item_id, order_index: index }));
      const { error: insertError } = await supabase.from('hero_slides_config').insert(slidesToInsert);
      if (insertError) {
        console.error("Error inserting new hero slides:", insertError);
        return { success: false, message: `Error al insertar nuevas diapositivas: ${insertError.message}` };
      }
    }
    
    try {
      await refreshContextData(); 
      return { success: true };
    } catch (refreshError: any) {
      console.error(`Error refreshing context data after updating hero slides:`, refreshError);
      return { success: false, message: `Diapositivas guardadas, pero error al refrescar: ${refreshError.message}` };
    }
  }, [refreshContextData]);

  const updateValuePropositionCardsData = useCallback(async (newCardsData: Array<Omit<ValuePropositionCardData, 'id' | 'created_at' | 'updated_at'>>): Promise<{success: boolean, message?: string}> => {
    await supabase.from('value_proposition_cards_config').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (newCardsData.length > 0) {
      const cardsToInsert = newCardsData.map((card, index) => ({
        icon_media_item_id: card.iconId,
        title: card.title,
        subtitle: card.subtitle,
        default_icon_name: card.defaultIconName,
        order_index: index,
      }));
      const { error } = await supabase.from('value_proposition_cards_config').insert(cardsToInsert);
      if (error) return { success: false, message: error.message };
    }
    await refreshContextData();
    return { success: true };
  }, [refreshContextData]);
  
  const updatePdfConfig = useCallback(async (newConfig: Partial<Omit<PdfConfig, 'updated_at'>>) => {
    const dbConfig: Record<string, any> = {...newConfig};
    if (newConfig.logoId !== undefined) { dbConfig.logo_id = newConfig.logoId; delete (dbConfig as any).logoId; }
    const result = await updateSingleRowConfig('pdf_config', dbConfig);
    return result;
  }, [updateSingleRowConfig]);
  
  const updateHeroCarouselInterval = useCallback((val: number) => updateSingleRowConfig('general_site_settings', { hero_carousel_interval: Math.max(1, Math.min(60, val)) }), [updateSingleRowConfig]);
  const updateSchoolCarouselAnimationDurationPerItem = useCallback((val: number) => updateSingleRowConfig('general_site_settings', { school_carousel_duration_per_item: Math.max(1, Math.min(30, val)) }), [updateSingleRowConfig]);
  const updateStoreWazeUrl = useCallback((val: string) => updateSingleRowConfig('general_site_settings', { store_waze_url: val }), [updateSingleRowConfig]);
  const updateStoreGoogleMapsUrl = useCallback((val: string) => updateSingleRowConfig('general_site_settings', { store_google_maps_url: val }), [updateSingleRowConfig]);
  const updateStoreAddressDescription = useCallback((val: string) => updateSingleRowConfig('general_site_settings', { store_address_description: val }), [updateSingleRowConfig]);
  const updateVisitStoreSection_MainImageId = useCallback((val: string | null) => updateSingleRowConfig('general_site_settings', { visit_store_main_image_id: val }), [updateSingleRowConfig]);
  const updateVisitStoreSection_WazeButtonIconId = useCallback((val: string | null) => updateSingleRowConfig('general_site_settings', { visit_store_waze_icon_id: val }), [updateSingleRowConfig]);
  const updateVisitStoreSection_GoogleMapsButtonIconId = useCallback((val: string | null) => updateSingleRowConfig('general_site_settings', { visit_store_gmaps_icon_id: val }), [updateSingleRowConfig]);
  const updateBrandLogoId = useCallback((val: string | null) => updateSingleRowConfig('general_site_settings', { brand_logo_id: val }), [updateSingleRowConfig]);

  return (
    <EditableContentContext.Provider value={{
        schools, products, heroSlides, heroCarouselInterval, schoolCarouselAnimationDurationPerItem,
        storeWazeUrl, storeGoogleMapsUrl, storeAddressDescription, valuePropositionCardsData,
        visitStoreSection_MainImageId, visitStoreSection_WazeButtonIconId, visitStoreSection_GoogleMapsButtonIconId,
        brandLogoId, pdfConfig, isLoading,
        updateSchool, addSchool, deleteSchool,
        updateProduct, addProductToContext, deleteProduct, updateProductOrder,
        updateHeroSlides, updateHeroCarouselInterval, updateSchoolCarouselAnimationDurationPerItem,
        updateStoreWazeUrl, updateStoreGoogleMapsUrl, updateStoreAddressDescription,
        updateValuePropositionCardsData,
        updateVisitStoreSection_MainImageId, updateVisitStoreSection_WazeButtonIconId, updateVisitStoreSection_GoogleMapsButtonIconId,
        updateBrandLogoId, updatePdfConfig,
        refreshContextData
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