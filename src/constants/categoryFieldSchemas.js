/**
 * Fallback field schemas for CreateAd Details when API returns no fields.
 * Keys: category slug (lowercase, dashes). Compatible with DynamicFields.
 * Schema: { key, label, type, required?, options?, placeholder? }
 */

const afaceriEchipamenteFields = [
  { key: 'businessType', label: 'Tip Business', type: 'select', required: true, options: ['Echipamente', 'Utilaje', 'Mobilier Comercial', 'IT & Office', 'Stoc Marfa', 'Servicii Business', 'Altele'] },
  { key: 'condition', label: 'Stare', type: 'select', required: true, options: ['Nou', 'Ca Nou', 'Buna', 'Cu Defecte'] },
  { key: 'brand', label: 'Brand', type: 'text', required: false, placeholder: 'Marca' },
  { key: 'model', label: 'Model', type: 'text', required: false, placeholder: 'Model' },
  { key: 'year', label: 'An', type: 'number', required: false, placeholder: 'An fabricație' },
  { key: 'warranty', label: 'Garanție', type: 'select', required: false, options: ['Da', 'Nu'] },
  { key: 'invoiceAvailable', label: 'Factură Disponibilă', type: 'select', required: false, options: ['Da', 'Nu'] },
  { key: 'deliveryAvailable', label: 'Livrare Disponibilă', type: 'select', required: false, options: ['Da', 'Nu'] },
  { key: 'locationCity', label: 'Oraș / Locație', type: 'text', required: true, placeholder: 'Oraș sau regiune' },
  { key: 'contactType', label: 'Tip Contact', type: 'select', required: true, options: ['Persoana Fizica', 'Persoana Juridica'] },
  { key: 'quantity', label: 'Cantitate', type: 'number', required: false, placeholder: 'Nr. bucăți' },
  { key: 'notes', label: 'Observații', type: 'textarea', required: false, placeholder: 'Detalii suplimentare' },
];

const copiiBebelusiFields = [
  { key: 'productType', label: 'Tip Produs', type: 'select', required: true, options: ['Haine', 'Incaltaminte', 'Carucioare', 'Scaune Auto', 'Patuturi', 'Jucarii', 'Ingrijire', 'Altele'] },
  { key: 'ageGroup', label: 'Vârstă', type: 'select', required: true, options: ['0-6 luni', '6-12 luni', '1-2 ani', '2-4 ani', '4-6 ani', '6-10 ani', '10+ ani'] },
  { key: 'gender', label: 'Gen', type: 'select', required: false, options: ['Baiat', 'Fata', 'Unisex'] },
  { key: 'size', label: 'Mărime', type: 'text', required: false, placeholder: 'Mărime haine/încalțăminte' },
  { key: 'condition', label: 'Stare', type: 'select', required: true, options: ['Nou', 'Ca Nou', 'Buna', 'Uzata'] },
  { key: 'brand', label: 'Brand', type: 'text', required: false, placeholder: 'Marca' },
  { key: 'color', label: 'Culoare', type: 'text', required: false, placeholder: 'Culoare' },
  { key: 'material', label: 'Material', type: 'text', required: false, placeholder: 'Material' },
  { key: 'safetyCertified', label: 'Certificat Siguranță', type: 'select', required: false, options: ['Da', 'Nu', 'Nu Stiu'] },
  { key: 'deliveryAvailable', label: 'Livrare Disponibilă', type: 'select', required: false, options: ['Da', 'Nu'] },
  { key: 'locationCity', label: 'Oraș / Locație', type: 'text', required: true, placeholder: 'Oraș sau regiune' },
  { key: 'contactType', label: 'Tip Contact', type: 'select', required: true, options: ['Persoana Fizica', 'Persoana Juridica'] },
  { key: 'notes', label: 'Observații', type: 'textarea', required: false, placeholder: 'Detalii suplimentare' },
];

const sportTimpLiberFields = [
  { key: 'sportType', label: 'Tip Sport', type: 'select', required: true, options: ['Fitness', 'Ciclism', 'Alergare', 'Fotbal', 'Tenis', 'Pescuit', 'Camping', 'Schi/Snowboard', 'Altele'] },
  { key: 'productType', label: 'Tip Produs', type: 'select', required: true, options: ['Echipament', 'Accesorii', 'Imbracaminte', 'Bicicleta', 'Suplimente', 'Altele'] },
  { key: 'condition', label: 'Stare', type: 'select', required: true, options: ['Nou', 'Ca Nou', 'Buna', 'Uzata'] },
  { key: 'brand', label: 'Brand', type: 'text', required: false, placeholder: 'Marca' },
  { key: 'model', label: 'Model', type: 'text', required: false, placeholder: 'Model' },
  { key: 'size', label: 'Mărime', type: 'text', required: false, placeholder: 'Mărime' },
  { key: 'weight', label: 'Greutate (kg)', type: 'number', required: false, placeholder: 'kg' },
  { key: 'material', label: 'Material', type: 'text', required: false, placeholder: 'Material' },
  { key: 'deliveryAvailable', label: 'Livrare Disponibilă', type: 'select', required: false, options: ['Da', 'Nu'] },
  { key: 'locationCity', label: 'Oraș / Locație', type: 'text', required: true, placeholder: 'Oraș sau regiune' },
  { key: 'contactType', label: 'Tip Contact', type: 'select', required: true, options: ['Persoana Fizica', 'Persoana Juridica'] },
  { key: 'notes', label: 'Observații', type: 'textarea', required: false, placeholder: 'Detalii suplimentare' },
];

const educatieCursuriFields = [
  { key: 'offeringType', label: 'Tip Ofertă', type: 'select', required: true, options: ['Curs', 'Meditatii', 'Training', 'Workshop', 'Consultanta', 'Altele'] },
  { key: 'subject', label: 'Materie', type: 'select', required: true, options: ['Matematica', 'Romana', 'Engleza', 'Informatica', 'Muzica', 'Arte', 'Business', 'Marketing', 'Altele'] },
  { key: 'level', label: 'Nivel', type: 'select', required: true, options: ['Incepator', 'Intermediar', 'Avansat'] },
  { key: 'format', label: 'Format', type: 'select', required: true, options: ['Online', 'Offline', 'Hibrid'] },
  { key: 'city', label: 'Oraș', type: 'text', required: false, placeholder: 'Obligatoriu pentru Offline/Hibrid' },
  { key: 'durationHours', label: 'Durată (ore)', type: 'number', required: false, placeholder: 'Ex: 10' },
  { key: 'schedule', label: 'Program', type: 'text', required: false, placeholder: 'Ex: seara / weekend' },
  { key: 'certification', label: 'Certificare', type: 'select', required: false, options: ['Da', 'Nu'] },
  { key: 'groupOrIndividual', label: 'Individual / Grup', type: 'select', required: true, options: ['Individual', 'Grup', 'Ambele'] },
  { key: 'teacherExperienceYears', label: 'Experiență profesor (ani)', type: 'number', required: false, placeholder: 'Ani' },
  { key: 'contactType', label: 'Tip Contact', type: 'select', required: true, options: ['Persoana Fizica', 'Persoana Juridica'] },
  { key: 'notes', label: 'Observații', type: 'textarea', required: false, placeholder: 'Detalii suplimentare' },
];

function normalizeSlugForLookup(slug) {
  const s = String(slug || '').toLowerCase().trim();
  return s.replace(/\s+/g, '-').replace(/&/g, 'si').replace(/[ăâ]/g, 'a').replace(/î/g, 'i').replace(/ș/g, 's').replace(/ț/g, 't');
}

/**
 * Slug -> fields array. Supports both canonical slugs and API slugs (e.g. afaceri-si-echipamente).
 */
export const CATEGORY_FIELD_SCHEMAS = {
  'afaceri-echipamente': afaceriEchipamenteFields,
  'afaceri-si-echipamente': afaceriEchipamenteFields,
  'copii-bebelusi': copiiBebelusiFields,
  'copii-si-bebelusi': copiiBebelusiFields,
  'sport-timp-liber': sportTimpLiberFields,
  'sport-si-timp-liber': sportTimpLiberFields,
  'educatie-cursuri': educatieCursuriFields,
  'educatie-si-cursuri': educatieCursuriFields,
};

/**
 * Returns fallback fields for a category slug (with alias normalization).
 * @param {string} categorySlug
 * @returns {Array<{key: string, label: string, type: string, ...}>}
 */
export function getFallbackFieldsForCategory(categorySlug) {
  const key = normalizeSlugForLookup(categorySlug);
  return CATEGORY_FIELD_SCHEMAS[key] || [];
}
