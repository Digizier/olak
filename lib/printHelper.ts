'use client';

/**
 * High-fidelity isolated document printing utility.
 * Renders the target element into a dedicated iframe with full stylesheets,
 * guaranteeing that:
 * 1. The print preview is NEVER blank or blocked by parent modal styles.
 * 2. Background colors, emerald accents, and logos print with 100% exact fidelity.
 * 3. The user can either print directly to paper or select "Save as PDF".
 */
export function printElementDirectly(elementId: string, title: string = 'OLAK-Document') {
  if (typeof window === 'undefined') return;

  const element = document.getElementById(elementId);
  if (!element) {
    console.error('Element with id "' + elementId + '" not found for printing.');
    window.print();
    return;
  }

  // Create isolated hidden iframe with non-zero viewport to prevent collapsed print engine
  const iframe = document.createElement('iframe');
  iframe.setAttribute('title', title);
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '1024px';
  iframe.style.height = '1024px';
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  iframe.style.zIndex = '-99999';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  // Collect all stylesheets and style tags from current document
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map(s => s.outerHTML)
    .join('\n');

  // Clone target HTML
  const contentHtml = element.outerHTML;

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        ${styles}
        <style>
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #0f172a !important;
            width: 100% !important;
          }
          #${elementId} {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 auto !important;
            padding: 10px !important;
            box-shadow: none !important;
            border: none !important;
            visibility: visible !important;
          }
          .no-print {
            display: none !important;
          }
        </style>
      </head>
      <body>
        ${contentHtml}
      </body>
    </html>
  `);
  doc.close();

  // Allow styles, images, and fonts to render inside iframe before triggering print
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (err) {
      console.error('Iframe print error:', err);
      window.print();
    } finally {
      // Clean up iframe after print dialog
      setTimeout(() => {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }, 2000);
    }
  }, 400);
}
