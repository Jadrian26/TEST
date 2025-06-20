import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../supabaseClient'; // Import Supabase client
import { UserProfile, Address, Order, CartItem, DeliveryMethod, AuthContextType, DbOrder, DbOrderItem, UserRegistrationData } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PICKUP_ADDRESS_PLACEHOLDER: Address = {
  id: 'pickup-address-placeholder',
  primaryAddress: 'Retiro en Local',
  apartmentOrHouseNumber: '',
  deliveryInstructions: 'Cliente retira en tienda.',
  isDefault: false,
};

const mapDbProfileToUserProfile = (dbProfile: any, orders: Order[] = []): UserProfile => ({
  id: dbProfile.id,
  firstName: dbProfile.first_name,
  lastName: dbProfile.last_name,
  email: dbProfile.email,
  phone: dbProfile.phone,
  idCardNumber: dbProfile.id_card_number,
  addresses: dbProfile.addresses || [],
  isAdmin: dbProfile.is_admin,
  isSales: dbProfile.is_sales,
  schoolId: dbProfile.school_id,
  cartItems: dbProfile.cart_items || [],
  orders: orders,
});

const mapUserProfileToDbProfilePartial = (userProfilePartial: Partial<UserProfile>): Record<string, any> => {
    const dbPartial: Record<string, any> = {};
    if (userProfilePartial.firstName !== undefined) dbPartial.first_name = userProfilePartial.firstName;
    if (userProfilePartial.lastName !== undefined) dbPartial.last_name = userProfilePartial.lastName;
    if (userProfilePartial.email !== undefined) dbPartial.email = userProfilePartial.email;
    if (userProfilePartial.phone !== undefined) dbPartial.phone = userProfilePartial.phone;
    if (userProfilePartial.idCardNumber !== undefined) dbPartial.id_card_number = userProfilePartial.idCardNumber;
    if (userProfilePartial.schoolId !== undefined) dbPartial.school_id = userProfilePartial.schoolId;
    if (userProfilePartial.isAdmin !== undefined) dbPartial.is_admin = userProfilePartial.isAdmin;
    if (userProfilePartial.isSales !== undefined) dbPartial.is_sales = userProfilePartial.isSales;
    if (userProfilePartial.addresses !== undefined) dbPartial.addresses = userProfilePartial.addresses;
    return dbPartial;
};


export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | undefined>(undefined); // Initialize as undefined
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false); // New state for logout
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);

  const currentUserRef = useRef(currentUser);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  const fetchUserOrders = useCallback(async (userIdToFetch?: string): Promise<Order[]> => {
    const targetUserId = userIdToFetch || currentUserRef.current?.id;
    if (!targetUserId) return [];
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select<string, DbOrder>('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;
      if (!ordersData) return [];

      const fetchedOrders: Order[] = [];
      for (const dbOrder of ordersData) {
        const { data: itemsData, error: itemsError } = await supabase
          .from('order_items')
          .select<string, DbOrderItem>('*')
          .eq('order_id', dbOrder.id);

        if (itemsError) {
          console.error(`AuthContext: Error fetching items for order ${dbOrder.display_order_id}:`, itemsError);
          continue;
        }
        
        fetchedOrders.push({
          id: dbOrder.display_order_id,
          db_id: dbOrder.id,
          date: dbOrder.order_date,
          status: dbOrder.status,
          total: dbOrder.total_amount,
          items: itemsData ? itemsData.map(item => ({
            productId: item.product_id_ref,
            name: item.product_name,
            quantity: item.quantity,
            price: item.price_at_purchase,
            selectedSize: item.selected_size,
          })) : [],
          shippingAddress: dbOrder.shipping_address_json,
          deliveryMethod: dbOrder.delivery_method,
          userId: dbOrder.user_id,
          placedByUserId: dbOrder.placed_by_user_id,
          customerNameForOrder: dbOrder.customer_name_for_order,
          customerIdCardForOrder: dbOrder.customer_id_card_for_order,
        });
      }
      return fetchedOrders;
    } catch (error) {
      console.error("AuthContext: Error fetching user orders:", error);
      return [];
    }
  }, []);

  const fetchAllUsers = useCallback(async (effectiveUserForPermCheck?: UserProfile | null) => {
    if (!effectiveUserForPermCheck?.isAdmin) {
      setAllUsers(effectiveUserForPermCheck ? [effectiveUserForPermCheck] : []);
      return;
    }

    try {
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*');
      if (usersError) throw usersError;

      if (usersData) {
        const usersWithOrdersPromises = usersData.map(async (dbProfile) => {
          const orders = await fetchUserOrders(dbProfile.id);
          return mapDbProfileToUserProfile(dbProfile, orders);
        });
        const resolvedUsersWithOrders = await Promise.all(usersWithOrdersPromises);
        setAllUsers(resolvedUsersWithOrders);
      } else {
        setAllUsers([]);
      }
    } catch (error) {
      console.error("AuthContext: Error fetching all users:", error);
      setAllUsers([]);
    }
  }, [fetchUserOrders]);

  const fetchUserOrdersRef = useRef(fetchUserOrders);
  useEffect(() => { fetchUserOrdersRef.current = fetchUserOrders; }, [fetchUserOrders]);

  const fetchAllUsersRef = useRef(fetchAllUsers);
  useEffect(() => { fetchAllUsersRef.current = fetchAllUsers; }, [fetchAllUsers]);

  const schoolSelectionIsMandatory = useMemo(() => {
    if (loadingAuth || currentUser === undefined) return false; // Wait for auth to settle
    const adminExists = allUsers.some(user => user.isAdmin);
    const salesExists = allUsers.some(user => user.isSales);
    return adminExists && salesExists;
  }, [allUsers, loadingAuth, currentUser]);

  useEffect(() => {
    let isMounted = true;
    setLoadingAuth(true);

    const { data: authListenerData, error: listenerError } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;
      // setLoadingAuth(true) here can cause quick flickers if event fires rapidly. 
      // Handled by the outer setLoadingAuth(true) and final setLoadingAuth(false).

      const authUser = session?.user;
      if (authUser) {
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .single();

          if (!isMounted) return;

          if (profileError || !profileData) {
            console.error('AuthContext: Error fetching profile or profile not found:', profileError?.message || 'Profile not found');
            setCurrentUser(null);
          } else {
            const ordersForCurrentUser = await fetchUserOrdersRef.current(profileData.id);
            if (!isMounted) return;
            const mappedUser = mapDbProfileToUserProfile(profileData, ordersForCurrentUser);
            setCurrentUser(mappedUser);
          }
        } catch (e) {
          if (!isMounted) return;
          console.error("AuthContext: Exception during profile/order fetch in onAuthStateChange", e);
          setCurrentUser(null);
        }
      } else { // No authUser
        setCurrentUser(null);
      }
      if (isMounted) setLoadingAuth(false); // Crucial: set loading false after user object is settled
    });
    
    if (listenerError) {
        console.error("AuthContext: Failed to subscribe to auth state changes:", listenerError);
        if (isMounted) {
            setCurrentUser(null);
            setLoadingAuth(false);
        }
        return;
    }
    
    // Initial session check no longer needs to manually set loadingAuth(false) or call fetchAllUsers.
    // onAuthStateChange with 'INITIAL_SESSION' event will handle it.
    // supabase.auth.getSession(); // This is implicitly handled by onAuthStateChange for INITIAL_SESSION

    return () => {
      isMounted = false;
      authListenerData?.subscription?.unsubscribe();
    };
  }, []); // Empty deps for main listener setup

  // New useEffect to fetch allUsers reactively
  useEffect(() => {
    let isMounted = true;
    const effectFetchAllUsers = async () => {
      // Only run if initial auth loading is complete AND currentUser state is determined (not undefined)
      if (!loadingAuth && currentUser !== undefined && isMounted) {
        // console.log("AuthContext: Fetching all users based on currentUser change:", currentUser?.email);
        await fetchAllUsersRef.current(currentUser); // currentUser can be null here
      }
    };

    effectFetchAllUsers();
    return () => { isMounted = false; };
  }, [currentUser, loadingAuth]);


  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
        return { success: false, message: error.message, error };
    }
    return { success: true };
  }, []);

  const register = useCallback(async (userData: UserRegistrationData) => {
    const { error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          idCardNumber: userData.idCardNumber,
          schoolId: userData.schoolId,
          phone: userData.phone,
        },
      },
    });
    if (error) {
        return { success: false, message: error.message, error };
    }
    return { success: true };
  }, []);

  const logout = useCallback(async (): Promise<{ success: boolean; message?: string; error?: any }> => {
    setIsLoggingOut(true); 
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return { success: false, message: `Error al cerrar sesión: ${error.message}`, error };
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, message: `Error inesperado al cerrar sesión: ${e.message}`, error: e };
    } finally {
      setIsLoggingOut(false); 
    }
  }, []);

  const updateCurrentUserProfile = useCallback(async (
    updatedProfileData: Partial<Pick<UserProfile, 'firstName' | 'lastName' | 'email' | 'phone' | 'schoolId' | 'idCardNumber'>>
  ) => {
    if (!currentUserRef.current) return { success: false, message: "Usuario no autenticado." };
    
    const dbUpdates = mapUserProfileToDbProfilePartial(updatedProfileData);

    const { error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', currentUserRef.current.id);

    if (error) return { success: false, message: error.message };
    
    const { data: refreshedProfile, error: refreshError } = await supabase
        .from('profiles').select('*').eq('id', currentUserRef.current.id).single();
    if (refreshedProfile && !refreshError) {
        const orders = await fetchUserOrdersRef.current(refreshedProfile.id);
        const fullUser = mapDbProfileToUserProfile(refreshedProfile, orders);
        setCurrentUser(fullUser); 
    } else if (refreshError) {
        console.error("AuthContext: Error re-fetching profile after update:", refreshError.message);
        setCurrentUser(prev => prev ? {...prev, ...updatedProfileData} : null);
    }
    return { success: true, message: "Perfil actualizado." };
  }, []);

  const updateUserAddresses = useCallback(async (newAddresses: Address[]) => {
    if (!currentUserRef.current) return { success: false, message: "Usuario no autenticado." };
    const { error } = await supabase
      .from('profiles')
      .update({ addresses: newAddresses })
      .eq('id', currentUserRef.current.id);

    if (error) return { success: false, message: error.message };
    setCurrentUser(prev => prev ? { ...prev, addresses: newAddresses } : null);
    return { success: true, message: "Direcciones actualizadas." };
  }, []);

  const updateUserCart = useCallback(async (items: CartItem[]) => {
    if (!currentUserRef.current) return { success: false, message: "Usuario no autenticado para guardar carrito." };
    const { error } = await supabase
      .from('profiles')
      .update({ cart_items: items })
      .eq('id', currentUserRef.current.id);
    if (error) {
      console.error("AuthContext: Error updating cart in DB:", error);
      return { success: false, message: `Error al guardar carrito: ${error.message}` };
    }
    setCurrentUser(prev => prev ? { ...prev, cartItems: items } : null);
    return { success: true, message: "Carrito guardado en perfil." };
  }, []);

  const createOrder = useCallback(async (
    cartItems: CartItem[],
    shippingAddress: Address | null,
    deliveryMethod: DeliveryMethod,
    customerForOrder?: { name: string; idCard: string }
  ) => {
    if (!currentUserRef.current || cartItems.length === 0) {
      return { success: false, message: "Error en la información del pedido." };
    }

    const totalAmount = cartItems.reduce((sum, item) => sum + item.priceAtPurchase * item.quantity, 0) + (deliveryMethod === 'delivery' ? 5 : 0);
    
    const orderToInsert: Omit<DbOrder, 'id' | 'display_order_id' | 'created_at' | 'updated_at'> = {
        user_id: currentUserRef.current.id,
        order_date: new Date().toISOString().split('T')[0],
        status: 'Processing',
        total_amount: totalAmount,
        shipping_address_json: deliveryMethod === 'delivery' ? shippingAddress : null,
        delivery_method: deliveryMethod,
        placed_by_user_id: (currentUserRef.current.isAdmin || currentUserRef.current.isSales) ? currentUserRef.current.id : null,
        customer_name_for_order: customerForOrder?.name,
        customer_id_card_for_order: customerForOrder?.idCard,
    };

    const { data: newOrderData, error: orderError } = await supabase
      .from('orders')
      .insert(orderToInsert)
      .select()
      .single();

    if (orderError || !newOrderData) {
      return { success: false, message: orderError?.message || "Error al crear el pedido." };
    }
    
    const orderItemsToInsert = cartItems.map(item => ({
      order_id: newOrderData.id,
      product_id_ref: item.product.id,
      product_name: item.product.name,
      quantity: item.quantity,
      price_at_purchase: item.priceAtPurchase,
      selected_size: item.selectedSize,
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(orderItemsToInsert);

    if (itemsError) {
      console.error("Error inserting order items, order created but items failed:", itemsError);
      return { success: false, message: `Pedido creado (${newOrderData.display_order_id}), pero error al guardar artículos: ${itemsError.message}` };
    }
    
    await updateUserCart([]); 

    if (currentUserRef.current) {
        const updatedOrders = await fetchUserOrdersRef.current(currentUserRef.current.id);
        setCurrentUser(prev => prev ? { ...prev, orders: updatedOrders, cartItems: [] } : null);
    }
    return { success: true, orderId: newOrderData.display_order_id, dbOrderId: newOrderData.id, message: "Pedido realizado con éxito." };
  }, [updateUserCart]);

  const updateOrderStatus = useCallback(async (order_db_id: string, newStatus: Order['status']) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', order_db_id);

    if (error) return { success: false, message: error.message };
    
    if (currentUserRef.current && !currentUserRef.current.isAdmin) {
        const updatedOrders = await fetchUserOrdersRef.current(currentUserRef.current.id);
        setCurrentUser(prev => prev ? { ...prev, orders: updatedOrders } : null);
    } else if (currentUserRef.current?.isAdmin) {
       // No need to explicitly call fetchAllUsers here, as it's triggered by setCurrentUser in other parts
       // or by the useEffect watching currentUser. Forcing might be redundant.
       // The parent component (AdminViewOrdersPage) should see the updated orders in allUsers.
    }
    return { success: true, message: "Estado del pedido actualizado." };
  }, []);

  const updateUserProfileByAdmin = useCallback(async (
    userId: string,
    updatedData: Partial<Pick<UserProfile, 'firstName' | 'lastName' | 'email' | 'phone' | 'schoolId' | 'idCardNumber' | 'isAdmin' | 'isSales'>>
  ) => {
    if (!currentUserRef.current?.isAdmin) return { success: false, message: "No autorizado." };
    
    const dbUpdates = mapUserProfileToDbProfilePartial(updatedData);

    const { error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', userId);

    if (error) return { success: false, message: error.message };
    await fetchAllUsersRef.current(currentUserRef.current);
    return { success: true, message: "Perfil de usuario actualizado por administrador." };
  }, []);
  
  const sendPasswordResetEmail = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {});
    if (error) return { success: false, message: error.message };
    return { success: true, message: "Si existe una cuenta con este correo, se ha enviado un enlace para restablecer la contraseña." };
  }, []);


  return (
    <AuthContext.Provider value={{
        currentUser,
        loadingAuth,
        isLoggingOut,
        login,
        register,
        logout,
        updateCurrentUserProfile,
        updateUserAddresses,
        updateUserCart,
        createOrder,
        updateOrderStatus,
        updateUserProfileByAdmin,
        sendPasswordResetEmail,
        fetchUserOrders: useCallback(() => fetchUserOrders(), [fetchUserOrders]),
        allUsers,
        fetchAllUsers: useCallback(() => fetchAllUsers(currentUserRef.current), [fetchAllUsers]),
        schoolSelectionIsMandatory,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};