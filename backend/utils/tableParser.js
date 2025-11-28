/**
 * Utility to parse structured tables from OCR text (esp. Qty/Rate/Amount columns)
 */

function parseNumber(value) {
  if (typeof value !== 'string') return NaN;
  const sanitized = value.replace(/[^0-9.-]/g, '');
  if (!sanitized) return NaN;
  return parseFloat(sanitized);
}

/**
 * Attempt to parse rows that follow a pattern like:
 * Sl#  Description  Cpt Code  Date  Qty  Rate  Gross Amount  Discount
 */
export function parseTableRows(ocrText = '') {
  if (!ocrText) return [];

  const lines = ocrText.split('\n').map(line => line.trim()).filter(Boolean);
  const dateRegex = /(\d{2}\/\d{2}\/\d{4})/;
  const parsedItems = [];

  for (const line of lines) {
    const dateMatch = line.match(dateRegex);
    if (!dateMatch) continue;

    const dateToken = dateMatch[0];
    const dateIndex = line.indexOf(dateToken);

    if (dateIndex === -1) continue;

    const beforeDate = line.slice(0, dateIndex).trim();
    const afterDate = line.slice(dateIndex + dateToken.length).trim();

    const slMatch = beforeDate.match(/^\d+/);
    if (!slMatch) continue;

    const descriptionPart = beforeDate.slice(slMatch[0].length).trim();
    if (!descriptionPart) continue;

    const numericParts = afterDate.split(/\s+/).filter(Boolean);
    if (numericParts.length < 3) continue;

    const quantity = parseNumber(numericParts[0]);
    const rate = parseNumber(numericParts[1]);
    const amount = parseNumber(numericParts[2]);

    if ([quantity, rate, amount].some(num => Number.isNaN(num))) continue;

    parsedItems.push({
      item_name: descriptionPart.replace(/\s{2,}/g, ' ').trim(),
      item_rate: Number(Number(rate).toFixed(2)),
      item_quantity: Number(Number(quantity).toFixed(2)),
      item_amount: Number(Number(amount).toFixed(2))
    });
  }

  return parsedItems;
}

