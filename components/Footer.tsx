
import React from 'react';
import { Link } from 'react-router-dom';
import { APP_NAME, FOOTER_LINKS_DATA } from '../constants';

const Footer: React.FC = () => {
  const { customerService, ourCompany } = FOOTER_LINKS_DATA;

  const FooterLinkColumn: React.FC<{ title: string; links: Array<{ name: string; path: string }> }> = ({ title, links }) => (
    <div>
      <h2 className="title-font font-semibold text-brand-secondary tracking-widest text-base sm:text-lg mb-3">{title}</h2>
      <nav className="list-none mb-10">
        {links.map(link => (
          <li key={link.name}>
            <Link to={link.path} className="text-sm sm:text-base text-brand-gray-medium hover:text-brand-secondary transition-colors">
              {link.name}
            </Link>
          </li>
        ))}
      </nav>
    </div>
  );

  return (
    <footer className="bg-brand-gray-light text-brand-gray-medium body-font border-t border-brand-quaternary">
      <div className="container px-5 py-16 mx-auto flex md:items-start md:flex-row md:flex-nowrap flex-wrap flex-col">
        <div className="w-64 flex-shrink-0 md:mx-0 mx-auto text-center md:text-left md:mt-0 mt-10">
          <Link to="/" className="flex title-font font-bold items-center md:justify-start justify-center text-brand-secondary">
            <span className="text-xl sm:text-2xl">{APP_NAME}</span>
          </Link>
          <p className="mt-2 text-sm sm:text-base text-brand-gray-medium">Tu tienda única para uniformes escolares y bordados de calidad.</p>
        </div>
        <div className="flex-grow flex flex-wrap md:pl-20 -mb-10 md:mt-0 mt-10 text-center md:text-left">
          <div className="lg:w-1/2 md:w-1/2 w-full px-4">
            <FooterLinkColumn title="Servicio al Cliente" links={customerService} />
          </div>
          <div className="lg:w-1/2 md:w-1/2 w-full px-4">
            <FooterLinkColumn title="Nuestra Empresa" links={ourCompany} />
          </div>
        </div>
      </div>
      <div className="bg-brand-quaternary bg-opacity-20">
        <div className="container mx-auto py-4 px-5 flex flex-wrap flex-col sm:flex-row">
          <p className="text-brand-gray-medium text-sm sm:text-base text-center sm:text-left sm:flex-1">
            © {new Date().getFullYear()} {APP_NAME} — Todos los derechos reservados.
          </p>
          {/* Social media icons removed */}
        </div>
      </div>
    </footer>
  );
};

export default Footer;