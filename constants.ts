
import { School, Product } from './types';

export const APP_NAME = "Uniformes y Bordados Escolares"; // Ya estaba en español

// MOCK_SCHOOLS and MOCK_PRODUCTS removed as they were empty and unused.

export const NAV_LINKS_PRIMARY = [
  { name: 'Inicio', path: '/' },
  { name: 'Catálogo de Productos', path: '/catalog' },
];

export const FOOTER_LINKS_DATA = {
  // quickLinks section removed as it was unused in the Footer.
  customerService: [
    { name: 'Contáctanos', path: '/contact' },
    { name: 'Envíos y Devoluciones', path: '/shipping-returns' },
    { name: 'Política de Privacidad', path: '/privacy' },
    { name: 'Términos de Servicio', path: '/terms' },
  ],
  ourCompany: [
    { name: 'Sobre Nosotros', path: '/about' },
    { name: 'Nuestro Proceso', path: '/process' }, 
    { name: 'Carreras', path: '/careers' }, 
  ]
};


export const PRIMARY_COLOR = '#ffffff';
export const SECONDARY_COLOR = '#26217f';
export const TERTIARY_COLOR = '#00b1ff';
export const QUATERNARY_COLOR = '#a8a8a8';
export const TEXT_ON_PRIMARY_COLOR = '#111827'; 
export const TEXT_ON_SECONDARY_COLOR = '#ffffff';
export const TEXT_ON_TERTIARY_COLOR = '#ffffff';