
import { useState, useCallback } from 'react';
import { Order, UserProfile, MediaItem, DeliveryMethod, PdfConfig } from '../types';
import { useNotifications } from '../contexts/NotificationsContext';
import { useEditableContent } from '../contexts/EditableContentContext'; // Import EditableContentContext
import { useMedia } from '../contexts/MediaContext'; // Import MediaContext
import { APP_NAME as DEFAULT_APP_NAME, SECONDARY_COLOR as DEFAULT_ACCENT_COLOR } from '../constants'; // Import defaults


// Declare jsPDF on window for global access from CDN
declare global {
  interface Window {
    jspdf: any;
  }
}

const useOrderPdfGenerator = () => {
  const { showNotification } = useNotifications();
  const { pdfConfig: globalPdfConfig } = useEditableContent(); // Get PDF config from context
  const { mediaItems } = useMedia(); // Get all media items
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const generatePdf = useCallback(async (
    order: Order,
    customer: UserProfile,
    _siteBrandLogo: MediaItem | null, // _siteBrandLogo is no longer used directly
    deliveryMethod: DeliveryMethod
  ) => {
    setIsGeneratingPdf(true); 

    if (!window.jspdf || !window.jspdf.jsPDF) {
      showNotification('Error: La librería jsPDF base no está cargada. Intenta recargar la página.', 'error');
      console.error("jsPDF constructor (window.jspdf.jsPDF) is not loaded.");
      setIsGeneratingPdf(false);
      return;
    }
    
    if (typeof window.jspdf.jsPDF.API?.autoTable !== 'function') {
        showNotification('Error: El plugin jsPDF-AutoTable no está cargado correctamente. Intenta recargar la página.', 'error');
        console.error("jsPDF.API.autoTable is not a function or window.jspdf.jsPDF.API is not defined.");
        setIsGeneratingPdf(false);
        return;
    }

    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      const pdfConfigToUse: PdfConfig = { 
        logoId: globalPdfConfig.logoId || null,
        companyName: globalPdfConfig.companyName || DEFAULT_APP_NAME,
        contactPhone: globalPdfConfig.contactPhone || "N/A",
        contactEmail: globalPdfConfig.contactEmail || "N/A",
        website: globalPdfConfig.website || "N/A",
        address: globalPdfConfig.address || "N/A",
        footerText: globalPdfConfig.footerText || "Gracias por su compra.",
        accentColor: globalPdfConfig.accentColor || DEFAULT_ACCENT_COLOR,
      };
      
      const brandLogoFromConfig = pdfConfigToUse.logoId ? mediaItems.find(item => item.id === pdfConfigToUse.logoId) : null;

      const pageMargin = 15;
      const pageWidth = doc.internal.pageSize.getWidth();
      const contentWidth = pageWidth - 2 * pageMargin; // Used for table and full-width text
      const rightColX = pageWidth - pageMargin; // For right-aligned text
      
      let headerBlockTopY = pageMargin;
      let logoEndY = headerBlockTopY;

      // Draw Logo (if any)
      if (brandLogoFromConfig && brandLogoFromConfig.dataUrl) {
        let logoData = brandLogoFromConfig.dataUrl;
        let imageType = brandLogoFromConfig.type.split('/')[1].toUpperCase();
        let logoWidth = 0;
        let logoHeight = 0;
        const maxLogoWidth = 45; // Max width for logo
        const maxLogoHeight = 25; // Max height for logo

        try {
          // Handle SVG separately if needed (current addImage supports base64 SVG string directly if jsPDF version is new enough)
          if (brandLogoFromConfig.type === 'image/svg+xml' && brandLogoFromConfig.dataUrl.startsWith('data:image/svg+xml;base64,')) {
              // For SVG, if direct base64 doesn't work or need specific handling:
              const base64Svg = brandLogoFromConfig.dataUrl.replace('data:image/svg+xml;base64,', '');
              // Decode base64 to SVG string
              const decodedSvgString = new TextDecoder().decode(Uint8Array.from(atob(base64Svg), c => c.charCodeAt(0)));
              logoData = decodedSvgString; // Pass the SVG string
              imageType = 'SVG'; // Special handling for SVG string in jsPDF
          }

          // Determine image dimensions
          if (imageType === 'SVG') {
              // Estimate SVG dimensions if possible or use fixed
              const parser = new DOMParser();
              const svgDoc = parser.parseFromString(logoData, "image/svg+xml");
              const svgElement = svgDoc.documentElement;
              let w = parseFloat(svgElement.getAttribute('width') || '0');
              let h = parseFloat(svgElement.getAttribute('height') || '0');
              const viewBox = svgElement.getAttribute('viewBox');
              if ((w === 0 || h === 0) && viewBox) {
                  const vbParts = viewBox.split(' ');
                  if (vbParts.length === 4) { w = parseFloat(vbParts[2]); h = parseFloat(vbParts[3]); }
              }
              if (w > 0 && h > 0) { // If dimensions found
                  if (w > maxLogoWidth) { h = (h * maxLogoWidth) / w; w = maxLogoWidth; }
                  if (h > maxLogoHeight) { w = (w * maxLogoHeight) / h; h = maxLogoHeight; }
                  logoWidth = w; logoHeight = h;
              } else { // Fallback if dimensions can't be parsed
                  logoWidth = Math.min(maxLogoWidth, 20); logoHeight = Math.min(maxLogoHeight, 20);
              }
          } else { // For JPG, PNG, etc.
              const img = new Image();
              img.src = logoData; // Base64 data URL
              await new Promise<void>((resolve, reject) => { // Ensure image is loaded for dimensions
                  img.onload = () => resolve();
                  img.onerror = (err) => reject(new Error("Failed to load raster logo for PDF."));
              });
              let w = img.width; let h = img.height;
              if (w > maxLogoWidth) { h = (h * maxLogoWidth) / w; w = maxLogoWidth; }
              if (h > maxLogoHeight) { w = (w * maxLogoHeight) / h; h = maxLogoHeight; }
              logoWidth = w; logoHeight = h;
          }
          doc.addImage(logoData, imageType, pageMargin, headerBlockTopY, logoWidth, logoHeight);
          logoEndY = headerBlockTopY + logoHeight;
        } catch (error) {
          console.error("Error adding PDF logo:", error);
          // Proceed without logo if error
        }
      }

      // Draw Company Info (Right Column of Header)
      let companyInfoY = headerBlockTopY; 
      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(pdfConfigToUse.accentColor);
      doc.text(pdfConfigToUse.companyName, rightColX, companyInfoY, { align: 'right' });
      doc.setFont(undefined, 'normal');
      companyInfoY += 7; 

      doc.setFontSize(10);
      doc.setTextColor(50); // Dark Gray for details

      const companyDetailsOrder = [
          { value: pdfConfigToUse.contactEmail, isLink: false },
          { value: `Tel: ${pdfConfigToUse.contactPhone}`, isLink: false },
          { value: pdfConfigToUse.website, isLink: true },
          { value: pdfConfigToUse.address, isLink: false },
      ];

      for (const detail of companyDetailsOrder) {
          if (detail.value && detail.value.replace("Tel: ", "") !== "N/A" && !detail.value.toLowerCase().includes("ej:")) {
              if (detail.isLink) {
                  doc.textWithLink(detail.value, rightColX, companyInfoY, {
                      align: 'right',
                      url: detail.value.startsWith('http') ? detail.value : `https://${detail.value}`
                  });
              } else {
                  doc.text(detail.value, rightColX, companyInfoY, { align: 'right' });
              }
              companyInfoY += 5;
          }
      }
      let companyBlockEndY = companyInfoY;
      
      let currentY = Math.max(logoEndY, companyBlockEndY) + 12; 

      // --- Second Row: Order Details (Left) and Customer Info (Right) ---
      const block2StartY = currentY;
      let leftColCurrentY = block2StartY;
      const titleLineHeight = 8;
      const itemLineHeight = 6;
      const sectionSpacing = 10;

      // "Detalle del Pedido" Title & Content (Left)
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(pdfConfigToUse.accentColor);
      doc.text('Detalle del Pedido', pageMargin, leftColCurrentY);
      leftColCurrentY += titleLineHeight;

      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(50);
      doc.text(`Pedido #: ${order.id.replace('#', '')}`, pageMargin, leftColCurrentY);
      leftColCurrentY += itemLineHeight;
      doc.text(`Fecha: ${new Date(order.date).toLocaleDateString('es-PA')}`, pageMargin, leftColCurrentY);
      const endYLeftCol = leftColCurrentY + itemLineHeight;

      // "Información del cliente" Title & Content (Right)
      // const customerColX = pageWidth / 2; // Adjust as needed
      const customerColX = pageMargin + contentWidth / 2 + 5; // Start customer info slightly right of center
      let rightColCurrentY = block2StartY;

      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(pdfConfigToUse.accentColor);
      doc.text('Información del cliente', customerColX, rightColCurrentY);
      rightColCurrentY += titleLineHeight;
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(50);
      const customerName = order.customerNameForOrder || `${customer.firstName} ${customer.lastName}`;
      const customerIdCard = order.customerIdCardForOrder || customer.idCardNumber;

      doc.text(`Cliente: ${customerName}`, customerColX, rightColCurrentY);
      rightColCurrentY += itemLineHeight;
      doc.text(`Email: ${customer.email}`, customerColX, rightColCurrentY);
      rightColCurrentY += itemLineHeight;
      if (customer.phone) {
        doc.text(`Teléfono: ${customer.phone}`, customerColX, rightColCurrentY);
        rightColCurrentY += itemLineHeight;
      }
      if (customerIdCard) {
        doc.text(`Cédula: ${customerIdCard}`, customerColX, rightColCurrentY);
      }
      const endYRightCol = rightColCurrentY + itemLineHeight;
      
      currentY = Math.max(endYLeftCol, endYRightCol) + sectionSpacing; 


      // --- Third Row: Shipping Address / Pickup Info (Full width) ---
      doc.setFontSize(14); // Title font size for consistency
      doc.setFont(undefined, 'bold');
      doc.setTextColor(pdfConfigToUse.accentColor);
      doc.text(deliveryMethod === 'pickup' ? 'Retiro en local' : 'Dirección de envío', pageMargin, currentY);
      currentY += titleLineHeight;

      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(50);
      if (deliveryMethod === 'pickup') {
        doc.text("Retiro en local - Por favor, espera la confirmación para retirar tu pedido.", pageMargin, currentY);
        currentY += itemLineHeight;
      } else if (order.shippingAddress) {
        doc.text(`Dirección de entrega: ${order.shippingAddress.primaryAddress}`, pageMargin, currentY);
        currentY += itemLineHeight;
        if (order.shippingAddress.apartmentOrHouseNumber) {
          doc.text(`Numero de piso/apartamento/casa: ${order.shippingAddress.apartmentOrHouseNumber}`, pageMargin, currentY);
          currentY += itemLineHeight;
        }
        if (order.shippingAddress.deliveryInstructions) {
          const instructions = doc.splitTextToSize(`Indicaciones para la entrega: ${order.shippingAddress.deliveryInstructions}`, contentWidth);
          doc.text(instructions, pageMargin, currentY);
          currentY += itemLineHeight * instructions.length;
        }
      } else {
        doc.text("N/A", pageMargin, currentY);
        currentY += itemLineHeight;
      }
      currentY += sectionSpacing; // Margin before table

      // Items Table
      const tableColumn = ["#", "Producto", "Talla", "Cantidad", "Precio Unit.", "Total"];
      const tableRows: any[][] = [];
      order.items.forEach((item, index) => {
        const itemData = [
          index + 1,
          item.name,
          item.selectedSize,
          item.quantity,
          `$${item.price.toFixed(2)}`,
          `$${(item.price * item.quantity).toFixed(2)}`
        ];
        tableRows.push(itemData);
      });

      (doc as any).autoTable({ 
        head: [tableColumn],
        body: tableRows,
        startY: currentY,
        theme: 'striped', 
        headStyles: { fillColor: pdfConfigToUse.accentColor, textColor: '#FFFFFF' }, 
        styles: { fontSize: 9, cellPadding: 2.5, lineColor: [200, 200, 200], lineWidth: 0.1 },
        columnStyles: {
            0: {cellWidth: 10, halign: 'center'}, 
            1: {cellWidth: 'auto'}, 
            2: {cellWidth: 18, halign: 'center'}, 
            3: {cellWidth: 20, halign: 'center'}, 
            4: {cellWidth: 25, halign: 'right'}, 
            5: {cellWidth: 25, halign: 'right'}  
        },
        didDrawPage: (data: any) => { 
            currentY = data.cursor.y; // Update currentY if table spans multiple pages
        }
      });
      currentY = (doc as any).lastAutoTable.finalY + 12; 

      // Totals Section
      const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const shippingCost = deliveryMethod === 'delivery' ? 5.00 : 0.00;
      const finalTotal = order.total;

      const totalsXStart = pageWidth - 70; 
      const totalsValueX = rightColX;     

      doc.setFontSize(10);
      doc.setTextColor(50);
      doc.text(`Subtotal:`, totalsXStart, currentY, { align: 'left' });
      doc.text(`$${subtotal.toFixed(2)}`, totalsValueX, currentY, { align: 'right' });
      currentY += 7; 

      if (deliveryMethod === 'delivery') {
        doc.text(`Envío:`, totalsXStart, currentY, { align: 'left' });
        doc.text(`$${shippingCost.toFixed(2)}`, totalsValueX, currentY, { align: 'right' });
        currentY += 7; 
      }
      
      doc.setFontSize(12); 
      doc.setFont(undefined, 'bold');
      doc.setTextColor(pdfConfigToUse.accentColor);
      doc.text(`Total:`, totalsXStart, currentY, { align: 'left' });
      doc.text(`$${finalTotal.toFixed(2)}`, totalsValueX, currentY, { align: 'right' });
      doc.setFont(undefined, 'normal'); 
      currentY += 10;

      // Footer Text
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFontSize(9);
      doc.setTextColor(100);
      const finalFooterText = `${pdfConfigToUse.footerText} - ${pdfConfigToUse.companyName}`;
      doc.text(finalFooterText, pageWidth / 2, pageHeight - 10, { align: 'center' });

      // Generate filename
      const orderIdForFilename = order.id.replace('#', '');
      const customerNameForFilename = (order.customerNameForOrder || `${customer.firstName}_${customer.lastName}`).replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
      const formattedDateForFilename = new Date(order.date).toLocaleDateString('es-PA', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
      const filename = `Pedido_${orderIdForFilename}_${customerNameForFilename}_${formattedDateForFilename}.pdf`;

      doc.save(filename);
      showNotification('PDF generado exitosamente.', 'success');
    } catch (error) {
      console.error("Error generating PDF:", error);
      showNotification(`Error al generar PDF: ${(error as Error).message}`, 'error');
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [showNotification, globalPdfConfig, mediaItems]);

  return { generatePdf, isGeneratingPdf };
};

export default useOrderPdfGenerator;
