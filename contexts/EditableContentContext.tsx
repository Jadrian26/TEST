
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
      setSchools(schoolsData?.map(s => ({...s})) || []);

      // Fetch Products
      const { data: productsData, error: productsError } = await supabase.from('products').select('*').order('order_index');
      if (productsError) throw productsError;
      setProducts(productsData?.map(p => ({
          ...p, 
          schoolId: p.school_id 
        })) || []);

      // Fetch General Site Settings
      const { data: gsData, error: gsError } = await supabase.from('general_site_settings').select('*').eq('id', true).single();
      if (gsError && gsError.code !== 'PGRST116') console.warn("Error fetching general settings:", gsError.message);
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
      if (pcError && pcError.code !== 'PGRST116') console.warn("Error fetching PDF config:", pcError.message);
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

    const subscriptionChannel = supabase
      .channel('public-editable-content')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'schools' },
        () => { console.log('Schools changed, refreshing data.'); refreshContextData(); }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => { console.log('Products changed, refreshing data.'); refreshContextData(); }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'general_site_settings' },
        () => { console.log('General site settings changed, refreshing data.'); refreshContextData(); }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hero_slides_config' },
        () => { console.log('Hero slides config changed, refreshing data.'); refreshContextData(); }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'value_proposition_cards_config' },
        () => { console.log('Value proposition cards changed, refreshing data.'); refreshContextData(); }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pdf_config' },
        () => { console.log('PDF config changed, refreshing data.'); refreshContextData(); }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to editable content changes!');
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('EditableContentContext Realtime Error:', status, err ? (err.message || err) : 'Unknown error');
        }
      });

    return () => {
      supabase.removeChannel(subscriptionChannel);
    };
  }, [fetchAndSetAllData, refreshContextData]);


  const updateSingleRowConfig = async (tableName: string, data: Record<string, any>) => {
    const { error: updateError } = await supabase.from(tableName).update(data).eq('id', true);
    if (updateError) return { success: false, message: updateError.message };
    try {
      await refreshContextData(); // Explicit refresh
      return { success: true };
    } catch (refreshError: any) {
      console.error(`Error refreshing context data after updating ${tableName}:`, refreshError);
      return { success: false, message: `Datos guardados, pero error al refrescar: ${refreshError.message}` };
    }
  };

  const addSchool = async (newSchoolData: Omit<School, 'id' | 'created_at' | 'updated_at'>): Promise<{success: boolean, message?: string, newSchool?: School}> => {
    const { data, error } = await supabase.from('schools').insert(newSchoolData).select().single();
    if (error) return { success: false, message: error.message };
    await refreshContextData();
    if (data) return { success: true, newSchool: data as School };
    return { success: false, message: "Error al añadir colegio."};
  };
  const updateSchool = async (schoolId: string, updatedData: Partial<Omit<School, 'id' | 'created_at' | 'updated_at'>>): Promise<{success: boolean, message?: string}> => {
    const { error } = await supabase.from('schools').update(updatedData).eq('id', schoolId);
    if (error) return { success: false, message: error.message };
    await refreshContextData();
    return { success: true };
  };
  const deleteSchool = async (schoolId: string): Promise<{success: boolean, message?: string}> => {
    const { error } = await supabase.from('schools').delete().eq('id', schoolId);
    if (error) return { success: false, message: error.message };
    await refreshContextData();
    return { success: true };
  };

  const addProductToContext = async (newProductData: Omit<Product, 'id' | 'orderIndex' | 'created_at' | 'updated_at'>): Promise<{success: boolean, message?: string, newProduct?: Product}> => {
    const schoolSpecificProducts = products.filter(p => p.schoolId === (newProductData.schoolId || null));
    const newOrderIndex = schoolSpecificProducts.length > 0 ? Math.max(...schoolSpecificProducts.map(p => p.orderIndex)) + 1 : 0;
    const productToInsert = { 
        ...newProductData, 
        school_id: newProductData.schoolId,
        order_index: newOrderIndex 
    };
    delete (productToInsert as any).schoolId;

    const { data, error } = await supabase.from('products').insert(productToInsert).select().single();
    if (error) return { success: false, message: error.message };
    await refreshContextData();
    if (data) return { success: true, newProduct: {...data, schoolId: data.school_id} as Product };
    return { success: false, message: "Error al añadir producto."};
  };
  const updateProduct = async (productId: string, updatedData: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at' | 'orderIndex'>>): Promise<{success: boolean, message?: string}> => {
    const dbUpdates: Record<string, any> = {...updatedData};
    if (updatedData.schoolId !== undefined) { dbUpdates.school_id = updatedData.schoolId; delete (dbUpdates as any).schoolId; }
    
    const { error } = await supabase.from('products').update(dbUpdates).eq('id', productId);
    if (error) return { success: false, message: error.message };
    await refreshContextData();
    return { success: true };
  };
  const deleteProduct = async (productId: string): Promise<{success: boolean, message?: string}> => {
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) return { success: false, message: error.message };
    await refreshContextData();
    return { success: true };
  };
  const updateProductOrder = async (schoolId: string | null, orderedProductIds: string[]): Promise<{success: boolean, message?: string}> => {
    const updates = orderedProductIds.map((id, index) => 
      supabase.from('products').update({ order_index: index }).eq('id', id).eq('school_id', schoolId)
    );
    const results = await Promise.all(updates.map(p => p.then(res => res.error ? res.error : null)));
    const firstError = results.find(r => r !== null);
    if (firstError) return { success: false, message: "Error actualizando orden: " + (firstError as any).message };
    await refreshContextData();
    return { success: true };
  };

  const updateHeroSlides = async (newSlidesMediaItemIds: string[]): Promise<{success: boolean, message?: string}> => {
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
      await refreshContextData(); // Explicit refresh
      return { success: true };
    } catch (refreshError: any) {
      console.error(`Error refreshing context data after updating hero slides:`, refreshError);
      return { success: false, message: `Diapositivas guardadas, pero error al refrescar: ${refreshError.message}` };
    }
  };


  const updateValuePropositionCardsData = async (newCardsData: Array<Omit<ValuePropositionCardData, 'id' | 'created_at' | 'updated_at'>>): Promise<{success: boolean, message?: string}> => {
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
  };
  
  const updatePdfConfig = async (newConfig: Partial<Omit<PdfConfig, 'updated_at'>>) => { // Made async
    const dbConfig: Record<string, any> = {...newConfig};
    if (newConfig.logoId !== undefined) { dbConfig.logo_id = newConfig.logoId; delete (dbConfig as any).logoId; }
    const result = await updateSingleRowConfig('pdf_config', dbConfig); // updateSingleRowConfig is already async
    // No need to call refreshContextData here, as updateSingleRowConfig does it.
    return result;
  }
  
  const updateHeroCarouselInterval = (val: number) => updateSingleRowConfig('general_site_settings', { hero_carousel_interval: Math.max(1, Math.min(60, val)) });
  const updateSchoolCarouselAnimationDurationPerItem = (val: number) => updateSingleRowConfig('general_site_settings', { school_carousel_duration_per_item: Math.max(1, Math.min(30, val)) });
  const updateStoreWazeUrl = (val: string) => updateSingleRowConfig('general_site_settings', { store_waze_url: val });
  const updateStoreGoogleMapsUrl = (val: string) => updateSingleRowConfig('general_site_settings', { store_google_maps_url: val });
  const updateStoreAddressDescription = (val: string) => updateSingleRowConfig('general_site_settings', { store_address_description: val });
  const updateVisitStoreSection_MainImageId = (val: string | null) => updateSingleRowConfig('general_site_settings', { visit_store_main_image_id: val });
  const updateVisitStoreSection_WazeButtonIconId = (val: string | null) => updateSingleRowConfig('general_site_settings', { visit_store_waze_icon_id: val });
  const updateVisitStoreSection_GoogleMapsButtonIconId = (val: string | null) => updateSingleRowConfig('general_site_settings', { visit_store_gmaps_icon_id: val });
  const updateBrandLogoId = (val: string | null) => updateSingleRowConfig('general_site_settings', { brand_logo_id: val });

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
