import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { UserProfile, Address, Order, CartItem, DeliveryMethod, AuthContextType, UserRole, SchoolApprovalStatus, UserSchoolAffiliation } from '../types'; // Updated to import AuthContextType & UserSchoolAffiliation

// Define AuthContext
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock password hashing (in a real app, use bcrypt or similar on the server)
const mockHashPassword = async (password: string): Promise<string> => {
  // This is a very simple "hash" for demonstration. DO NOT USE IN PRODUCTION.
  return `hashed_${password}`;
};

const mockVerifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return `hashed_${password}` === hash;
};


// Placeholder address for pickup orders
const PICKUP_ADDRESS_PLACEHOLDER: Address = {
  id: 'pickup-address-placeholder',
  primaryAddress: 'Retiro en Local',
  apartmentOrHouseNumber: '',
  deliveryInstructions: 'Cliente retira en tienda.',
  isDefault: false,
  wazeUrl: undefined,
  googleMapsUrl: undefined,
  lat: undefined,
  lon: undefined,
};


export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const storedUser = localStorage.getItem('currentUser');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [registeredUsers, setRegisteredUsers] = useState<Array<UserProfile & { passwordHash: string }>>(() => {
    const storedUsers = localStorage.getItem('registeredUsers');
    if (storedUsers) {
      return JSON.parse(storedUsers);
    }
    return []; 
  });

  useEffect(() => {
    const storedUsersData = localStorage.getItem('registeredUsers');
    let usersToStore: Array<UserProfile & { passwordHash: string }> = storedUsersData ? JSON.parse(storedUsersData) : [];

    const initializeUser = async (
        userData: Omit<UserProfile, 'id' | 'orders' | 'addresses' | 'passwordHash' | 'role' | 'idCardNumber' | 'affiliations'> & 
                  { phone?: string; role: UserRole; idCardNumber: string; addresses: Address[], orders: Order[], affiliations: UserSchoolAffiliation[] },
        userId: string,
        passwordPlain: string
    ) => {
        if (!usersToStore.find(u => u.id === userId)) {
            const hashedPassword = await mockHashPassword(passwordPlain);
            const userWithHash: UserProfile & { passwordHash: string } = {
                ...userData,
                id: userId,
                phone: userData.phone || '',
                passwordHash: hashedPassword,
                role: userData.role,
                affiliations: userData.affiliations,
            };
            usersToStore.push(userWithHash);
        }
    };
    
    const setupInitialUsers = async () => {
        await initializeUser({
            firstName: 'Usuario', 
            lastName: 'Admin', 
            email: 'admin@site.com',
            phone: '60000000', 
            idCardNumber: '00-000-0000',
            role: 'admin',
            addresses: [], 
            orders: [],    
            affiliations: [], // Admins don't have school affiliations by default
        }, 'user-admin', 'AdminUyB');

        await initializeUser({
            firstName: 'Usuario',
            lastName: 'Ventas',
            email: 'ventas@site.com',
            phone: '60000001',
            idCardNumber: 'VT-000-0001',
            role: 'sales',
            addresses: [],
            orders: [],
            affiliations: [], // Sales staff don't have school affiliations by default
        }, 'user-sales', 'VentasUyB');
      
        const currentStoredUsersString = localStorage.getItem('registeredUsers');
        if (usersToStore.length > 0 && JSON.stringify(usersToStore) !== currentStoredUsersString) {
          setRegisteredUsers(usersToStore);
          localStorage.setItem('registeredUsers', JSON.stringify(usersToStore));
        }
    };
    
    const adminUserExists = usersToStore.some(u => u.id === 'user-admin');
    const salesUserExists = usersToStore.some(u => u.id === 'user-sales');
    if (usersToStore.length === 0 || !adminUserExists || !salesUserExists ) { 
        setupInitialUsers();
    }
  }, []);


  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('currentUser');
    }
  }, [currentUser]);

  useEffect(() => {
    if (registeredUsers.length > 0) {
        const currentStoredUsers = localStorage.getItem('registeredUsers');
        if (JSON.stringify(registeredUsers) !== currentStoredUsers) {
            localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
        }
    }
  }, [registeredUsers]);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    const userRecord = registeredUsers.find(user => user.email.toLowerCase() === email.toLowerCase());
    if (userRecord) {
      const isPasswordValid = await mockVerifyPassword(password, userRecord.passwordHash);
      if (isPasswordValid) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { passwordHash, ...userProfile } = userRecord;
        setCurrentUser(userProfile);
        return { success: true };
      }
    }
    return { success: false, message: 'Correo electrónico o contraseña incorrectos.' };
  }, [registeredUsers]);

  const register = useCallback(async (userData: Omit<UserProfile, 'id' | 'addresses' | 'orders' | 'phone' | 'role' | 'idCardNumber' | 'affiliations'> & { password: string; phone: string; initialSchoolIdRequest: string; idCardNumber: string; }): Promise<{ success: boolean; message?: string }> => {
    if (registeredUsers.find(user => user.email.toLowerCase() === userData.email.toLowerCase())) {
      return { success: false, message: 'Este correo electrónico ya está registrado.' };
    }
    if (registeredUsers.find(user => user.idCardNumber === userData.idCardNumber)) {
      return { success: false, message: 'Esta cédula ya está registrada.' };
    }
    const passwordHash = await mockHashPassword(userData.password);
    const initialAffiliation: UserSchoolAffiliation = {
      schoolId: userData.initialSchoolIdRequest,
      status: 'approved', // Initial school is automatically approved
      requestedAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
    };
    
    const newUserProfile: UserProfile = {
      id: `user-${Date.now()}`,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      phone: userData.phone,
      idCardNumber: userData.idCardNumber,
      affiliations: [initialAffiliation],
      addresses: [],
      orders: [],
      role: 'client',
    };
    
    let updatedRegisteredUsers = [...registeredUsers];
    const ordersToMove: { order: Order, fromUserId: string }[] = [];

    updatedRegisteredUsers = updatedRegisteredUsers.map(existingUser => {
        const userOrders = existingUser.orders.filter(order => {
            if (order.placedByUserId && order.customerIdCardForOrder === newUserProfile.idCardNumber && order.userId === existingUser.id) {
                ordersToMove.push({ order: { ...order, userId: newUserProfile.id }, fromUserId: existingUser.id });
                return false; 
            }
            return true;
        });
        return { ...existingUser, orders: userOrders };
    });
    
    newUserProfile.orders = ordersToMove.map(item => item.order);

    const newUserRecord = { ...newUserProfile, passwordHash };
    updatedRegisteredUsers.push(newUserRecord);
    
    setRegisteredUsers(updatedRegisteredUsers);
    setCurrentUser(newUserProfile);
    
    return { success: true, message: 'Cuenta creada con éxito. Tu colegio inicial ha sido aprobado automáticamente.' };
  }, [registeredUsers]);

  const logout = useCallback(() => {
    setCurrentUser(null);
  }, []);

  const updateCurrentUserProfile = useCallback(async (updatedProfileData: Partial<Pick<UserProfile, 'firstName' | 'lastName' | 'email' | 'phone' | 'idCardNumber'>>) => {
    if (!currentUser) return { success: false, message: 'Usuario no autenticado.' };

    const updatedUser: UserProfile = { 
        ...currentUser, 
        ...updatedProfileData,
    };
    
    setCurrentUser(updatedUser);

    setRegisteredUsers(prevUsers => prevUsers.map(user => {
      if (user.id === currentUser.id) {
        const originalUserRecord = prevUsers.find(u => u.id === currentUser.id);
        return { 
            ...user, 
            ...updatedUser, 
            passwordHash: originalUserRecord?.passwordHash || '', 
        };
      }
      return user;
    }));
    return { success: true, message: 'Perfil actualizado exitosamente.' };
  }, [currentUser]);

  const requestSchoolAffiliation = useCallback(async (schoolId: string): Promise<{ success: boolean; message?: string; }> => {
    if (!currentUser) return { success: false, message: 'Usuario no autenticado.' };
    if (currentUser.role !== 'client') return { success: false, message: 'Solo los clientes pueden solicitar afiliaciones a colegios.'};

    const existingAffiliation = currentUser.affiliations.find(aff => aff.schoolId === schoolId);
    if (existingAffiliation) {
        if (existingAffiliation.status === 'approved') {
            return { success: false, message: 'Ya estás afiliado a este colegio.' };
        } else if (existingAffiliation.status === 'pending') {
            return { success: false, message: 'Ya tienes una solicitud pendiente para este colegio.' };
        }
    }

    const newAffiliation: UserSchoolAffiliation = {
        schoolId: schoolId,
        status: 'pending', // New requests (not initial) are pending
        requestedAt: new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString(),
    };

    const updatedAffiliations = [...currentUser.affiliations, newAffiliation];
    const updatedUser = { ...currentUser, affiliations: updatedAffiliations };
    setCurrentUser(updatedUser);

    setRegisteredUsers(prevUsers => prevUsers.map(user => {
        if (user.id === currentUser.id) {
            const originalUserRecord = prevUsers.find(u => u.id === currentUser.id);
            return { ...user, ...updatedUser, passwordHash: originalUserRecord?.passwordHash || '' };
        }
        return user;
    }));

    return { success: true, message: 'Solicitud de afiliación de colegio enviada.' };

  }, [currentUser]);


  const updateUserAddresses = useCallback(async (newAddresses: Address[]) => {
    if (!currentUser) return { success: false, message: 'Usuario no autenticado.' };
    
    const updatedUser = { ...currentUser, addresses: newAddresses };
    setCurrentUser(updatedUser);

    setRegisteredUsers(prevUsers => prevUsers.map(user => {
      if (user.id === currentUser.id) {
        const originalUserRecord = prevUsers.find(u => u.id === currentUser.id);
        return { ...user, ...updatedUser, passwordHash: originalUserRecord?.passwordHash || '' };
      }
      return user;
    }));
    return { success: true, message: 'Direcciones actualizadas exitosamente.' };
  }, [currentUser]);
  
  const addMockOrder = useCallback(async (
    cartItems: CartItem[], 
    shippingAddress: Address | null, // Nullable for pickup
    deliveryMethod: DeliveryMethod,
    customerForOrder?: { name: string; idCard: string; }
  ): Promise<{ success: boolean; orderId?: string; message?: string }> => {
    if (!currentUser) return { success: false, message: 'Debes iniciar sesión para realizar un pedido.' };
    if (deliveryMethod === 'delivery' && !shippingAddress) {
        return { success: false, message: 'Por favor, selecciona una dirección de envío para entrega a domicilio.'};
    }
    if (cartItems.length === 0) return { success: false, message: 'Tu carrito está vacío.'};

    const orderId = `#${Math.floor(Math.random() * 90000) + 10000}`;
    const shippingCost = deliveryMethod === 'delivery' ? 5.00 : 0.00;
    const orderTotal = cartItems.reduce((sum, item) => sum + item.priceAtPurchase * item.quantity, 0) + shippingCost; 

    const finalShippingAddress = deliveryMethod === 'pickup' ? PICKUP_ADDRESS_PLACEHOLDER : shippingAddress;

    const newOrderBase: Omit<Order, 'userId' | 'placedByUserId' | 'customerNameForOrder' | 'customerIdCardForOrder'> = {
      id: orderId,
      date: new Date().toISOString().split('T')[0],
      status: 'Processing',
      total: orderTotal,
      items: cartItems.map(item => ({
        productId: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        price: item.priceAtPurchase, 
        selectedSize: item.selectedSize,
      })),
      shippingAddress: finalShippingAddress,
      deliveryMethod: deliveryMethod,
    };

    let finalOrder: Order;
    let targetUserIdForOrderAddition: string = currentUser.id;
    let orderAddedToCurrentUser = true;

    if ((currentUser.role === 'admin' || currentUser.role === 'sales') && customerForOrder) {
        const existingCustomer = registeredUsers.find(u => u.idCardNumber === customerForOrder.idCard && u.role === 'client');
        if (existingCustomer) {
            finalOrder = {
                ...newOrderBase,
                userId: existingCustomer.id,
                placedByUserId: currentUser.id,
            };
            targetUserIdForOrderAddition = existingCustomer.id;
            orderAddedToCurrentUser = false;
        } else {
            // Cliente no existe, el pedido se asocia temporalmente al Admin/Ventas
            finalOrder = {
                ...newOrderBase,
                userId: currentUser.id, // Asociado al Admin/Ventas
                placedByUserId: currentUser.id,
                customerNameForOrder: customerForOrder.name,
                customerIdCardForOrder: customerForOrder.idCard,
            };
        }
    } else {
        // Pedido normal de cliente
        finalOrder = {
            ...newOrderBase,
            userId: currentUser.id,
        };
    }
    
    setRegisteredUsers(prevUsers => prevUsers.map(user => {
      if (user.id === targetUserIdForOrderAddition) {
        return { ...user, orders: [finalOrder, ...user.orders] };
      }
      return user;
    }));

    if (orderAddedToCurrentUser) {
      setCurrentUser(prevCurrentUser => prevCurrentUser ? {...prevCurrentUser, orders: [finalOrder, ...prevCurrentUser.orders]} : null);
    }
    
    return { success: true, orderId: finalOrder.id, message: 'Pedido realizado con éxito.' };
  }, [currentUser, registeredUsers]);

  const updateOrderStatus = useCallback(async (userId: string, orderId: string, newStatus: Order['status']): Promise<{ success: boolean; message?: string }> => {
    let userWhoseOrderUpdated = false;
    const updatedRegisteredUsers = registeredUsers.map(user => {
      if (user.id === userId) {
        const updatedOrders = user.orders.map(order => {
          if (order.id === orderId) {
            userWhoseOrderUpdated = true;
            return { ...order, status: newStatus };
          }
          return order;
        });
        return { ...user, orders: updatedOrders };
      }
      const orderToUpdate = user.orders.find(o => o.id === orderId);
      if(orderToUpdate && orderToUpdate.userId === userId) { 
         const updatedOrders = user.orders.map(order => {
          if (order.id === orderId) {
            userWhoseOrderUpdated = true;
            return { ...order, status: newStatus };
          }
          return order;
        });
        return { ...user, orders: updatedOrders };
      }

      return user;
    });

    if (userWhoseOrderUpdated) {
      setRegisteredUsers(updatedRegisteredUsers);
      if (currentUser && currentUser.id === userId) {
        const updatedCurrentUserProfile = updatedRegisteredUsers.find(u => u.id === userId);
        if (updatedCurrentUserProfile) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { passwordHash, ...profile } = updatedCurrentUserProfile;
            setCurrentUser(profile);
        }
      }
      return { success: true, message: `Estado del pedido ${orderId} actualizado.` };
    }
    return { success: false, message: 'Usuario o pedido no encontrado para actualizar estado.' };
  }, [registeredUsers, currentUser]);
  
  const updateUserProfileByAdmin = useCallback(async (userId: string, updatedData: Partial<UserProfile>): Promise<{ success: boolean; message?: string }> => {
    let userFoundAndUpdated = false;
    const updatedUsers = registeredUsers.map(user => {
      if (user.id === userId) {
        userFoundAndUpdated = true;
        let finalUpdatedData = { ...user, ...updatedData };

        // If affiliations are being updated directly by admin, ensure lastUpdatedAt is set
        if (updatedData.affiliations) {
            finalUpdatedData.affiliations = updatedData.affiliations.map(aff => {
                const originalAff = user.affiliations.find(oa => oa.schoolId === aff.schoolId);
                // If status changed, update lastUpdatedAt. If new, also set.
                if (!originalAff || originalAff.status !== aff.status) {
                    return { ...aff, lastUpdatedAt: new Date().toISOString() };
                }
                return aff; // No status change, keep original lastUpdatedAt if it exists
            });
        }
        
        // If role changes to admin/sales, clear affiliations
        if (updatedData.role && updatedData.role !== user.role && (updatedData.role === 'admin' || updatedData.role === 'sales')) {
           finalUpdatedData.affiliations = [];
        }
        // If role changes from admin/sales to client, affiliations might need to be initialized or kept as is (empty array by default)
        if (user.role !== 'client' && updatedData.role === 'client') {
            finalUpdatedData.affiliations = finalUpdatedData.affiliations || [];
        }


        return { ...finalUpdatedData, passwordHash: user.passwordHash }; 
      }
      return user;
    });

    if (userFoundAndUpdated) {
      setRegisteredUsers(updatedUsers);
      if (currentUser && currentUser.id === userId) {
        const updatedSelf = updatedUsers.find(u => u.id === userId);
        if (updatedSelf) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { passwordHash, ...profileData } = updatedSelf;
          setCurrentUser(profileData);
        }
      }
      return { success: true, message: 'Perfil de usuario actualizado por administrador.' };
    }
    return { success: false, message: 'Usuario no encontrado para actualizar.' };
  }, [registeredUsers, currentUser]);


  const sendPasswordResetEmail = useCallback(async (email: string): Promise<{ success: boolean; message: string }> => {
    console.log(`Password reset requested for email: ${email}. (This is a client-side simulation)`);
    return { 
      success: true, 
      message: 'Si existe una cuenta asociada a este correo electrónico, se ha enviado un enlace para restablecer tu contraseña.' 
    };
  }, []);

  const authContextValue: AuthContextType = {
    currentUser,
    registeredUsers,
    login,
    register,
    logout,
    updateCurrentUserProfile,
    requestSchoolAffiliation,
    updateUserAddresses,
    addMockOrder,
    updateOrderStatus,
    updateUserProfileByAdmin,
    sendPasswordResetEmail
  };

  return (
    <AuthContext.Provider value={authContextValue}>
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