
import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../supabaseClient'; // Import Supabase client
import { UserProfile, Address, Order, CartItem, DeliveryMethod, AuthContextType, DbOrder, DbOrderItem, UserRegistrationData } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// This placeholder is now only for client-side UI hints if needed, actual pickup orders have null shipping_address_json.
const PICKUP_ADDRESS_PLACEHOLDER: Address = {
  id: 'pickup-address-placeholder',
  primaryAddress: 'Retiro en Local',
  apartmentOrHouseNumber: '',
  deliveryInstructions: 'Cliente retira en tienda.',
  isDefault: false,
};

// Helper to map DB profile to UserProfile
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
  orders: orders,
});

// Helper to map UserProfile partial to DB profile partial
const mapUserProfileToDbProfilePartial = (userProfilePartial: Partial<UserProfile>): Record<string, any> => {
    const dbPartial: Record<string, any> = {};
    if (userProfilePartial.firstName !== undefined) dbPartial.first_name = userProfilePartial.firstName;
    if (userProfilePartial.lastName !== undefined) dbPartial.last_name = userProfilePartial.lastName;
    if (userProfilePartial.email !== undefined) dbPartial.email = userProfilePartial.email; // Email update should be handled carefully
    if (userProfilePartial.phone !== undefined) dbPartial.phone = userProfilePartial.phone;
    if (userProfilePartial.idCardNumber !== undefined) dbPartial.id_card_number = userProfilePartial.idCardNumber;
    if (userProfilePartial.schoolId !== undefined) dbPartial.school_id = userProfilePartial.schoolId;
    if (userProfilePartial.isAdmin !== undefined) dbPartial.is_admin = userProfilePartial.isAdmin;
    if (userProfilePartial.isSales !== undefined) dbPartial.is_sales = userProfilePartial.isSales;
    if (userProfilePartial.addresses !== undefined) dbPartial.addresses = userProfilePartial.addresses;
    return dbPartial;
};


export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);


  const fetchUserOrders = useCallback(async (userIdToFetch?: string): Promise<Order[]> => {
    const targetUserId = userIdToFetch || currentUser?.id;
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
      const specificError = error as any;
      console.error("AuthContext: Error fetching user orders:", specificError);
      if (specificError instanceof TypeError && specificError.message === 'Failed to fetch') {
        console.warn("AuthContext: A 'TypeError: Failed to fetch' occurred while fetching user orders. This commonly indicates network connectivity problems, an issue with the Supabase service, or potential browser/environment restrictions (e.g., CORS, ad-blockers, sandboxed environment network policies). Please check your internet connection and Supabase project status. If running in a restricted environment, network policies might be blocking the request.");
      }
      return [];
    }
  }, [currentUser?.id]); 

  const fetchAllUsers = useCallback(async (forCurrentUserSession?: UserProfile | null) => {
    const effectiveUserForPermCheck = forCurrentUserSession || currentUser;
    
    if (!effectiveUserForPermCheck?.isAdmin) {
      if (effectiveUserForPermCheck) { 
        setAllUsers([effectiveUserForPermCheck]);
      } else { 
        setAllUsers([]);
      }
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
  }, [fetchUserOrders, currentUser]);


  const schoolSelectionIsMandatory = useMemo(() => {
    if (loadingAuth) return false; 
    const adminExists = allUsers.some(user => user.isAdmin);
    const salesExists = allUsers.some(user => user.isSales);
    return adminExists && salesExists;
  }, [allUsers, loadingAuth]);

  useEffect(() => {
    setLoadingAuth(true);
    
    const { data: authListenerData, error: listenerError } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user;
      if (user) {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('AuthContext: Error fetching profile for authenticated user:', error.message || error);
          setCurrentUser(null);
          setAllUsers([]); 
        } else if (profileData) {
          const orders = await fetchUserOrders(profileData.id);
          const mappedUser = mapDbProfileToUserProfile(profileData, orders);
          setCurrentUser(mappedUser);
          await fetchAllUsers(mappedUser); 
        } else {
            console.warn(`AuthContext: User with ID ${user.id} and email ${user.email} is authenticated but their profile was NOT FOUND in the 'profiles' table.`);
            setCurrentUser(null); 
            setAllUsers([]);
        }
      } else {
        setCurrentUser(null);
        await fetchAllUsers(null); 
      }
      setLoadingAuth(false);
    });

    if (listenerError) {
        console.error("AuthContext: Failed to subscribe to auth state changes:", listenerError);
        setLoadingAuth(false);
        setCurrentUser(null);
        fetchAllUsers(null).catch(e => console.error("AuthContext: Error fetching users on auth listener error:", e));
        return;
    }

    const authSubscription = authListenerData?.subscription;
    
    const checkInitialSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
           // This ensures allUsers is populated for schoolSelectionIsMandatory if no one is logged in initially.
           // onAuthStateChange will also handle this, but this provides an earlier fetch if needed.
           await fetchAllUsers(null); 
        }
        // If onAuthStateChange hasn't fired yet to set loadingAuth to false, this might be too early.
        // However, onAuthStateChange should fire almost immediately with the initial state.
        // If loadingAuth is still true here, it means onAuthStateChange is still processing.
    };

    checkInitialSession().catch(e => console.error("AuthContext: Error in initial session check:", e));

    return () => {
      authSubscription?.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchUserOrders, fetchAllUsers]); 
  
  // Effect for Realtime Subscriptions
  useEffect(() => {
    if (loadingAuth) return; 

    const ordersChannel = supabase
      .channel('public-orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        async (payload) => {
          console.log('AuthContext: Orders change received!', payload);
          const currentAuthUser = currentUser; 
          if (currentAuthUser) {
            if (currentAuthUser.isAdmin || currentAuthUser.isSales) {
              await fetchAllUsers(currentAuthUser);
            } else {
              const updatedOrders = await fetchUserOrders(currentAuthUser.id);
              setCurrentUser(prevUser => prevUser ? {...prevUser, orders: updatedOrders} : null);
            }
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') console.log('AuthContext: Subscribed to orders changes!');
        if (err) console.error('AuthContext: Orders subscription error', err);
      });

    const profilesChannel = supabase
      .channel('public-profiles-realtime')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        async (payload) => {
          console.log('AuthContext: Profiles change received!', payload);
          const currentAuthUser = currentUser;
          if (currentAuthUser) {
            if (currentAuthUser.isAdmin) {
              await fetchAllUsers(currentAuthUser); 
            } else if (payload.new && (payload.new as any).id === currentAuthUser.id) {
              const { data: profileData, error } = await supabase
                .from('profiles').select('*').eq('id', currentAuthUser.id).single();
              if (profileData && !error) {
                const orders = await fetchUserOrders(profileData.id); 
                setCurrentUser(mapDbProfileToUserProfile(profileData, orders));
              }
            }
          } else {
            await fetchAllUsers(null);
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') console.log('AuthContext: Subscribed to profiles changes!');
        if (err) console.error('AuthContext: Profiles subscription error', err);
      });

    return () => {
      supabase.removeChannel(ordersChannel).catch(err => console.error("Error removing orders channel:", err));
      supabase.removeChannel(profilesChannel).catch(err => console.error("Error removing profiles channel:", err));
    };
  }, [loadingAuth, currentUser, fetchAllUsers, fetchUserOrders]); 

  const login = async (email: string, password: string) => {
    setLoadingAuth(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
        setLoadingAuth(false);
        return { success: false, message: error.message, error };
    }
    return { success: true };
  };

  const register = async (userData: UserRegistrationData) => {
    setLoadingAuth(true);
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
        setLoadingAuth(false);
        return { success: false, message: error.message, error };
    }
    return { success: true, message: "Registro exitoso. Por favor, revisa tu correo para verificar tu cuenta." };
  };

  const logout = async () => {
    setLoadingAuth(true); 
    await supabase.auth.signOut();
  };

  const updateCurrentUserProfile = async (
    updatedProfileData: Partial<Pick<UserProfile, 'firstName' | 'lastName' | 'email' | 'phone' | 'schoolId' | 'idCardNumber'>>
  ) => {
    if (!currentUser) return { success: false, message: "Usuario no autenticado." };
    
    const dbUpdates = mapUserProfileToDbProfilePartial(updatedProfileData);

    const { error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', currentUser.id);

    if (error) return { success: false, message: error.message };
    
    const { data: refreshedProfile, error: refreshError } = await supabase
        .from('profiles').select('*').eq('id', currentUser.id).single();
    if (refreshedProfile && !refreshError) {
        const orders = await fetchUserOrders(refreshedProfile.id); 
        setCurrentUser(mapDbProfileToUserProfile(refreshedProfile, orders)); 
    } else if (refreshError) {
        console.error("AuthContext: Error re-fetching profile after update:", refreshError.message);
    }
    return { success: true, message: "Perfil actualizado." };
  };

  const updateUserAddresses = async (newAddresses: Address[]) => {
    if (!currentUser) return { success: false, message: "Usuario no autenticado." };
    const { error } = await supabase
      .from('profiles')
      .update({ addresses: newAddresses })
      .eq('id', currentUser.id);

    if (error) return { success: false, message: error.message };
    setCurrentUser(prev => prev ? { ...prev, addresses: newAddresses } : null);
    return { success: true, message: "Direcciones actualizadas." };
  };

  const createOrder = async (
    cartItems: CartItem[],
    shippingAddress: Address | null,
    deliveryMethod: DeliveryMethod,
    customerForOrder?: { name: string; idCard: string }
  ) => {
    if (!currentUser || cartItems.length === 0) {
      return { success: false, message: "Error en la información del pedido." };
    }

    const totalAmount = cartItems.reduce((sum, item) => sum + item.priceAtPurchase * item.quantity, 0) + (deliveryMethod === 'delivery' ? 5 : 0);
    
    const orderToInsert: Omit<DbOrder, 'id' | 'display_order_id' | 'created_at' | 'updated_at'> = {
        user_id: currentUser.id,
        order_date: new Date().toISOString().split('T')[0], 
        status: 'Processing',
        total_amount: totalAmount,
        shipping_address_json: deliveryMethod === 'delivery' ? shippingAddress : null,
        delivery_method: deliveryMethod,
        placed_by_user_id: (currentUser.isAdmin || currentUser.isSales) ? currentUser.id : null,
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

    return { success: true, orderId: newOrderData.display_order_id, dbOrderId: newOrderData.id, message: "Pedido realizado con éxito." };
  };


  const updateOrderStatus = async (order_db_id: string, newStatus: Order['status']) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', order_db_id); 

    if (error) return { success: false, message: error.message };
    return { success: true, message: "Estado del pedido actualizado." };
  };

  const updateUserProfileByAdmin = async (
    userId: string, 
    updatedData: Partial<Pick<UserProfile, 'firstName' | 'lastName' | 'email' | 'phone' | 'schoolId' | 'idCardNumber' | 'isAdmin' | 'isSales'>>
  ) => {
    if (!currentUser?.isAdmin) return { success: false, message: "No autorizado." };
    
    const dbUpdates = mapUserProfileToDbProfilePartial(updatedData);

    const { error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', userId);

    if (error) return { success: false, message: error.message };
    return { success: true, message: "Perfil de usuario actualizado por administrador." };
  };
  
  const sendPasswordResetEmail = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {});
    if (error) return { success: false, message: error.message };
    return { success: true, message: "Si existe una cuenta con este correo, se ha enviado un enlace para restablecer la contraseña." };
  };


  return (
    <AuthContext.Provider value={{ 
        currentUser, 
        loadingAuth, 
        login, 
        register, 
        logout, 
        updateCurrentUserProfile, 
        updateUserAddresses,
        createOrder,
        updateOrderStatus,
        updateUserProfileByAdmin,
        sendPasswordResetEmail,
        fetchUserOrders: () => fetchUserOrders(), 
        allUsers,
        fetchAllUsers: () => fetchAllUsers(currentUser),
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
