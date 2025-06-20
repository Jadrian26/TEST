import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Product, School, ProductVariant, MediaItem } from '../types';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext'; 
import { useEditableContent } from '../contexts/EditableContentContext';
import ProductCard from '../components/ProductCard'; 
import { useNotifications } from '../contexts/NotificationsContext';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai"; 
import useButtonCooldown from '../hooks/useButtonCooldown'; // Importar hook

interface ProductQnAItem {
  id: string;
  question: string;
  answer: string;
  isLoading: boolean;
  error: string | null;
}

const ProductDetailPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { currentUser } = useAuth(); 
  const { products, schools, isLoading: isContentLoading } = useEditableContent();
  const { showNotification } = useNotifications();

  const [product, setProduct] = useState<Product | null>(null);
  const [school, setSchool] = useState<School | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>(''); 
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

  const [userQuestion, setUserQuestion] = useState<string>('');
  const [qaList, setQaList] = useState<ProductQnAItem[]>([]);
  // isAskingGemini ya no es necesario, useButtonCooldown lo maneja
  
  const API_KEY = process.env.API_KEY;


  useEffect(() => {
    if (isContentLoading) return;

    const foundProduct = products.find(p => p.id === productId);
    if (foundProduct) {
      setProduct(foundProduct);
      setQuantity(1); 
      
      if (foundProduct.variants && foundProduct.variants.length > 0) {
        const initialVariant = foundProduct.variants[0];
        setSelectedVariant(initialVariant);
        setSelectedSize(initialVariant.size);
      } else {
        setSelectedVariant(null);
        setSelectedSize('N/A'); 
      }
      
      if (foundProduct.schoolId) {
        const foundSchool = schools.find(s => s.id === foundProduct.schoolId);
        setSchool(foundSchool || null);
      } else {
        setSchool(null);
      }

      let newRelated: Product[] = [];
      if (currentUser?.isAdmin || currentUser?.isSales) { 
        if (foundProduct.schoolId) {
            newRelated = products.filter(
                p => p.schoolId === foundProduct.schoolId && p.id !== foundProduct.id
            );
        } else { 
             newRelated = products.filter(
                p => !p.schoolId && p.id !== foundProduct.id
            );
        }
      } else if (currentUser && currentUser.schoolId) {
        newRelated = products.filter(
          p => p.schoolId === currentUser.schoolId && p.id !== foundProduct.id
        );
      } else if (foundProduct.schoolId) {
         newRelated = products.filter(
          p => p.schoolId === foundProduct.schoolId && p.id !== foundProduct.id
        );
      }
      setRelatedProducts(newRelated.slice(0, 4)); 
      setQaList([]); 

    } else {
      navigate('/catalog'); 
    }
     window.scrollTo(0, 0);
  }, [productId, navigate, products, schools, isContentLoading, currentUser]);

  const handleSizeSelect = (size: string) => {
    if (product && product.variants) {
      const variantForSize = product.variants.find(v => v.size === size);
      if (variantForSize) {
        setSelectedVariant(variantForSize);
        setSelectedSize(variantForSize.size);
      }
    }
  };
  
  const addToCartAction = async () => {
    if (product && selectedVariant) {
      addToCart(product, quantity, selectedVariant.size, selectedVariant.price);
      showNotification(`${product.name} (Talla: ${selectedVariant.size}, x${quantity}) añadido al carrito.`, 'success');
    } else if (product && (!product.variants || product.variants.length === 0)) {
      showNotification("Este producto no tiene variantes disponibles para añadir al carrito.", 'error');
    } else if (!selectedVariant) {
       showNotification("Por favor, selecciona una talla disponible.", 'error');
    }
  };

  const { 
    trigger: triggerAddToCart, 
    isCoolingDown: isAddToCartCoolingDown, 
    timeLeft: addToCartTimeLeft 
  } = useButtonCooldown(addToCartAction, 1500); // 1.5 segundos de cooldown

  const askGeminiAction = async () => {
    if (!userQuestion.trim() || !product || !API_KEY) {
      showNotification("Por favor, escribe una pregunta.", 'error');
      if (!API_KEY) {
        console.error("API_KEY for Gemini not found.");
        showNotification("Error de configuración: No se pudo conectar con el servicio de IA.", 'error');
      }
      return; // No lanzar error para que el hook no lo capture innecesariamente si es validación
    }

    const currentQuestionId = `qna-${Date.now()}`;
    const newQnAItem: ProductQnAItem = {
      id: currentQuestionId,
      question: userQuestion,
      answer: '',
      isLoading: true,
      error: null,
    };
    setQaList(prev => [...prev, newQnAItem]);
    const questionToAsk = userQuestion; // Guardar antes de limpiar
    setUserQuestion(''); 

    try {
      const ai = new GoogleGenAI({ apiKey: API_KEY });
      
      const productVariantsInfo = product.variants && product.variants.length > 0
        ? `Variantes (Talla - Precio):\n${product.variants.map(v => `- Talla ${v.size} - $${v.price.toFixed(2)}`).join('\n')}`
        : 'Variantes: Este producto no tiene variantes de talla y precio especificadas.';
      
      const schoolInfo = school 
        ? `Colegio Asociado: ${school.name}` 
        : 'Colegio Asociado: Producto general, no asociado a un colegio específico.';

      const productInfoPrompt = `
Nombre del Producto: ${product.name}
Descripción: ${product.description}
${productVariantsInfo}
${schoolInfo}
      `.trim();

      const fullPrompt = `
Contexto: Eres un asistente virtual de "Uniformes y Bordados Escolares". Tu especialidad es responder preguntas sobre los productos de nuestra tienda.
Por favor, responde la siguiente pregunta del usuario basándote EXCLUSIVAMENTE en la información proporcionada sobre el producto.
Si la información solicitada no se encuentra en los detalles del producto, indica amablemente que no dispones de esa información específica para este artículo.
Sé amable, directo y conciso en tu respuesta. Responde siempre en español.

Información del Producto:
${productInfoPrompt}

Pregunta del Usuario:
"${questionToAsk}" 

Respuesta del Asistente:
      `.trim();
      
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-04-17',
        contents: [{ parts: [{ text: fullPrompt }] }],
      });

      const answerText = response.text;
      setQaList(prev => prev.map(item => item.id === currentQuestionId ? { ...item, answer: answerText, isLoading: false } : item));

    } catch (error: any) {
      console.error("Error calling Gemini API:", error);
      const errorMessage = error.message || "No se pudo obtener una respuesta del servicio de IA.";
      setQaList(prev => prev.map(item => item.id === currentQuestionId ? { ...item, error: errorMessage, isLoading: false } : item));
      showNotification(`Error al contactar la IA: ${errorMessage}`, 'error');
    }
  };
  
  const { 
    trigger: triggerAskGemini, 
    isCoolingDown: isAskGeminiCoolingDown, 
    timeLeft: askGeminiTimeLeft 
  } = useButtonCooldown(askGeminiAction, 5000); // 5 segundos de cooldown para IA


  if (isContentLoading || !product) {
    return <div className="text-center py-20 text-text-secondary">Cargando producto...</div>;
  }

  const productNameElement = <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-text-primary mb-1">{product.name}</h1>; 
  
  let productPriceElement: JSX.Element | null = null;
  const canViewPrice = currentUser?.isAdmin || currentUser?.isSales || (product?.schoolId && currentUser?.schoolId === product.schoolId);

  if (canViewPrice) {
    if (selectedVariant) {
      productPriceElement = <p className="text-2xl sm:text-3xl font-bold text-brand-secondary mb-4 sm:mb-5">${selectedVariant.price.toFixed(2)}</p>;
    } else if (product.variants && product.variants.length > 0) {
      const prices = product.variants.map(v => v.price);
      const minPrice = Math.min(...prices);
      productPriceElement = <p className="text-2xl sm:text-3xl font-bold text-brand-secondary mb-4 sm:mb-5">Desde ${minPrice.toFixed(2)}</p>;
    } else {
      productPriceElement = <p className="text-2xl sm:text-3xl font-bold text-brand-secondary mb-4 sm:mb-5">Precio no disponible</p>;
    }
  }

  const productDescriptionElement = <p className="text-sm sm:text-base">{product.description}</p>;
  const productImageElement = (
     <img
        src={product.imageUrl}
        alt={product.name}
        className="w-full h-full object-contain p-2 sm:p-4"
      />
  );

  const availableSizesForDisplay = product.variants ? [...new Set(product.variants.map(v => v.size))] : [];

  return (
    <div className="container mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 sm:mb-6 text-sm text-brand-tertiary hover:text-brand-secondary font-medium flex items-center transition-colors group"
        aria-label="Volver a la página anterior"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
        Volver
      </button>
      <div className="md:flex md:gap-6 lg:gap-10 bg-brand-primary p-4 sm:p-6 md:p-8 rounded-lg shadow-card">
        <div className="md:w-1/2 lg:w-2/5">
          <div className="aspect-square bg-brand-gray-light rounded-lg overflow-hidden border border-brand-quaternary/20 shadow-inner">
            {productImageElement}
          </div>
        </div>
        <div className="md:w-1/2 lg:w-3/5 mt-6 md:mt-0">
          {productNameElement}
          {school && (
            <Link to={`/catalog/school/${school.id}`} className="text-sm text-brand-tertiary hover:text-brand-secondary mb-3 block">
              Ver más de {school.name}
            </Link>
          )}
          {!school && <div className="mb-3 h-[calc(1.25rem)]"></div>} 
          
          {productPriceElement}
          
          <div className="mb-5 text-text-secondary text-sm leading-relaxed">
            {productDescriptionElement}
          </div>
          
          {product.variants && product.variants.length > 0 && (
            <div className="mb-5">
              <label htmlFor="size" className="block text-sm font-medium text-text-primary mb-1.5">
                Talla: <span className="font-semibold">{selectedSize}</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {availableSizesForDisplay.map(size => (
                  <button
                    key={size}
                    onClick={() => handleSizeSelect(size)}
                    className={`px-3.5 py-2 border rounded-md text-sm font-medium transition-all duration-150 ease-in-out
                                ${selectedSize === size 
                                  ? 'bg-brand-secondary text-white border-brand-secondary ring-2 ring-brand-tertiary ring-offset-1 shadow-md' 
                                  : 'bg-brand-primary border-brand-quaternary text-text-primary hover:border-brand-secondary hover:text-brand-secondary focus:ring-1 focus:ring-brand-tertiary'
                                }`}
                    aria-pressed={selectedSize === size}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mb-6">
            <label htmlFor="quantity" className="block text-sm font-medium text-text-primary mb-1.5">Cantidad:</label>
            <div className="flex items-center w-fit border border-brand-quaternary rounded-md">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-2 text-brand-secondary hover:bg-brand-gray-light transition-colors rounded-l-md focus:outline-none focus:ring-1 focus:ring-brand-tertiary"
                aria-label="Disminuir cantidad"
              >
                -
              </button>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-12 text-center py-2 border-l border-r border-brand-quaternary text-sm focus:outline-none bg-brand-primary"
                aria-label="Cantidad"
                min="1"
              />
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-3 py-2 text-brand-secondary hover:bg-brand-gray-light transition-colors rounded-r-md focus:outline-none focus:ring-1 focus:ring-brand-tertiary"
                aria-label="Aumentar cantidad"
              >
                +
              </button>
            </div>
          </div>
          
          <button
            onClick={triggerAddToCart}
            disabled={(!selectedVariant && product.variants && product.variants.length > 0) || !canViewPrice || isAddToCartCoolingDown} 
            className={`btn-primary w-full sm:w-auto text-base py-2.5 px-6 ${((!canViewPrice && product.variants && product.variants.length > 0) || isAddToCartCoolingDown) ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={
              isAddToCartCoolingDown ? `Espera ${addToCartTimeLeft}s` :
              !canViewPrice ? "Inicia sesión y selecciona tu colegio para añadir al carrito" : 
              ((!selectedVariant && product.variants && product.variants.length > 0) ? "Selecciona una talla" : "Añadir al carrito")
            }
          >
            {isAddToCartCoolingDown ? `Espera ${addToCartTimeLeft}s` : "Añadir al Carrito"}
          </button>
          {(!canViewPrice && product.variants && product.variants.length > 0) && (
             <p className="text-xs text-error mt-2">Para añadir al carrito, debes <Link to="/account" className="underline">iniciar sesión</Link> y tener un colegio asociado.</p>
          )}
        </div>
      </div>
      
       {API_KEY && (
        <section className="mt-8 md:mt-10 bg-brand-primary p-4 sm:p-6 md:p-8 rounded-lg shadow-card">
          <h2 className="text-xl sm:text-2xl font-bold text-brand-secondary mb-4">Preguntas sobre el Producto (IA)</h2>
          <div className="mb-4">
            <textarea
              value={userQuestion}
              onChange={(e) => setUserQuestion(e.target.value)}
              placeholder="Escribe tu pregunta aquí... (ej: ¿De qué material es? ¿Es adecuado para climas cálidos?)"
              rows={3}
              className="w-full p-3 border border-brand-quaternary rounded-md shadow-sm focus:ring-2 focus:ring-brand-tertiary focus:border-transparent text-sm sm:text-base bg-brand-gray-light"
              aria-label="Escribe tu pregunta sobre el producto"
            />
            <button
              onClick={triggerAskGemini}
              disabled={isAskGeminiCoolingDown || !userQuestion.trim()}
              className="btn-secondary mt-2 px-5 py-2 text-sm disabled:opacity-70"
            >
              {isAskGeminiCoolingDown ? `Preguntando (espera ${askGeminiTimeLeft}s)` : 'Preguntar a IA'}
            </button>
          </div>

          {qaList.length > 0 && (
            <div className="space-y-4">
              {qaList.slice().reverse().map(item => ( 
                <div key={item.id} className="p-3 border border-brand-gray-light rounded-md bg-brand-gray-light/50">
                  <p className="font-semibold text-text-primary text-sm mb-1">P: {item.question}</p>
                  {item.isLoading && <p className="text-xs text-brand-tertiary italic">Buscando respuesta...</p>}
                  {item.error && <p className="text-xs text-error">Error: {item.error}</p>}
                  {item.answer && <p className="text-sm text-text-secondary whitespace-pre-wrap">R: {item.answer}</p>}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {relatedProducts.length > 0 && (
        <section className="mt-8 md:mt-10">
          <h2 className="text-xl sm:text-2xl font-bold text-brand-secondary mb-4 text-center sm:text-left">También te podría interesar</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {relatedProducts.map(relatedProduct => (
              <ProductCard key={relatedProduct.id} product={relatedProduct} showPrice={canViewPrice} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetailPage;
