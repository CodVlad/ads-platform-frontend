// Slugify function for Romanian text
export const slugifyRo = (text) => {
  if (!text) return '';
  
  return text
    .toLowerCase()
    // Replace Romanian diacritics
    .replace(/ă/g, 'a')
    .replace(/â/g, 'a')
    .replace(/î/g, 'i')
    .replace(/ș/g, 's')
    .replace(/ț/g, 't')
    // Replace & with si
    .replace(/&/g, 'si')
    // Replace / with -
    .replace(/\//g, '-')
    // Remove parentheses and their content
    .replace(/\([^)]*\)/g, '')
    // Replace multiple spaces/hyphens with single hyphen
    .replace(/[\s\-]+/g, '-')
    // Remove non-alphanumeric characters except hyphens
    .replace(/[^a-z0-9\-]/g, '')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '');
};

// Complete categories list for the ads platform
// All slugs are generated using slugifyRo for consistency
export const CATEGORIES = [
  {
    slug: slugifyRo('Imobiliare'),
    label: 'Imobiliare',
    subs: [
      { slug: slugifyRo('Apartamente de vânzare'), label: 'Apartamente de vânzare' },
      { slug: slugifyRo('Apartamente de închiriat'), label: 'Apartamente de închiriat' },
      { slug: slugifyRo('Case / Vile'), label: 'Case / Vile' },
      { slug: slugifyRo('Terenuri'), label: 'Terenuri' },
      { slug: slugifyRo('Spații comerciale'), label: 'Spații comerciale' },
      { slug: slugifyRo('Birouri'), label: 'Birouri' },
      { slug: slugifyRo('Garaje / Parcări'), label: 'Garaje / Parcări' },
      { slug: slugifyRo('Imobiliare peste hotare'), label: 'Imobiliare peste hotare' },
    ],
  },
  {
    slug: slugifyRo('Auto & Transport'),
    label: 'Auto & Transport',
    subs: [
      { slug: slugifyRo('Autoturisme'), label: 'Autoturisme' },
      { slug: slugifyRo('Motociclete / Scutere'), label: 'Motociclete / Scutere' },
      { slug: slugifyRo('Camioane / Autobuze'), label: 'Camioane / Autobuze' },
      { slug: slugifyRo('Utilaje agricole'), label: 'Utilaje agricole' },
      { slug: slugifyRo('Piese auto'), label: 'Piese auto' },
      { slug: slugifyRo('Anvelope / Jante'), label: 'Anvelope / Jante' },
      { slug: slugifyRo('Accesorii auto'), label: 'Accesorii auto' },
      { slug: slugifyRo('Servicii auto (service, tractare)'), label: 'Servicii auto (service, tractare)' },
    ],
  },
  {
    slug: slugifyRo('Electronice & Tehnică'),
    label: 'Electronice & Tehnică',
    subs: [
      { slug: slugifyRo('Telefoane mobile'), label: 'Telefoane mobile' },
      { slug: slugifyRo('Laptopuri / PC'), label: 'Laptopuri / PC' },
      { slug: slugifyRo('Tablete'), label: 'Tablete' },
      { slug: slugifyRo('Televizoare'), label: 'Televizoare' },
      { slug: slugifyRo('Audio / Video'), label: 'Audio / Video' },
      { slug: slugifyRo('Electrocasnice mari'), label: 'Electrocasnice mari' },
      { slug: slugifyRo('Electrocasnice mici'), label: 'Electrocasnice mici' },
      { slug: slugifyRo('Gadgeturi & Smart home'), label: 'Gadgeturi & Smart home' },
      { slug: slugifyRo('Jocuri & Console'), label: 'Jocuri & Console' },
    ],
  },
  {
    slug: slugifyRo('Modă & Frumusețe'),
    label: 'Modă & Frumusețe',
    subs: [
      { slug: slugifyRo('Îmbrăcăminte femei'), label: 'Îmbrăcăminte femei' },
      { slug: slugifyRo('Îmbrăcăminte bărbați'), label: 'Îmbrăcăminte bărbați' },
      { slug: slugifyRo('Îmbrăcăminte copii'), label: 'Îmbrăcăminte copii' },
      { slug: slugifyRo('Încălțăminte'), label: 'Încălțăminte' },
      { slug: slugifyRo('Genți & Accesorii'), label: 'Genți & Accesorii' },
      { slug: slugifyRo('Ceasuri'), label: 'Ceasuri' },
      { slug: slugifyRo('Bijuterii'), label: 'Bijuterii' },
      { slug: slugifyRo('Cosmetice & Parfumuri'), label: 'Cosmetice & Parfumuri' },
    ],
  },
  {
    slug: slugifyRo('Casă & Grădină'),
    label: 'Casă & Grădină',
    subs: [
      { slug: slugifyRo('Mobilă'), label: 'Mobilă' },
      { slug: slugifyRo('Decorațiuni'), label: 'Decorațiuni' },
      { slug: slugifyRo('Textile pentru casă'), label: 'Textile pentru casă' },
      { slug: slugifyRo('Unelte & Scule'), label: 'Unelte & Scule' },
      { slug: slugifyRo('Materiale de construcție'), label: 'Materiale de construcție' },
      { slug: slugifyRo('Grădinărit'), label: 'Grădinărit' },
      { slug: slugifyRo('Iluminat'), label: 'Iluminat' },
      { slug: slugifyRo('Sisteme de încălzire / climatizare'), label: 'Sisteme de încălzire / climatizare' },
    ],
  },
  {
    slug: slugifyRo('Locuri de muncă'),
    label: 'Locuri de muncă',
    subs: [
      { slug: slugifyRo('IT & Tehnologie'), label: 'IT & Tehnologie' },
      { slug: slugifyRo('Vânzări & Marketing'), label: 'Vânzări & Marketing' },
      { slug: slugifyRo('Construcții'), label: 'Construcții' },
      { slug: slugifyRo('Transport & Logistică'), label: 'Transport & Logistică' },
      { slug: slugifyRo('HoReCa'), label: 'HoReCa' },
      { slug: slugifyRo('Contabilitate & Finanțe'), label: 'Contabilitate & Finanțe' },
      { slug: slugifyRo('Juridic'), label: 'Juridic' },
      { slug: slugifyRo('Educație'), label: 'Educație' },
      { slug: slugifyRo('Medicină'), label: 'Medicină' },
      { slug: slugifyRo('Freelance / Remote'), label: 'Freelance / Remote' },
    ],
  },
  {
    slug: slugifyRo('Servicii'),
    label: 'Servicii',
    subs: [
      { slug: slugifyRo('Servicii IT'), label: 'Servicii IT' },
      { slug: slugifyRo('Reparații'), label: 'Reparații' },
      { slug: slugifyRo('Curățenie'), label: 'Curățenie' },
      { slug: slugifyRo('Construcții & Renovări'), label: 'Construcții & Renovări' },
      { slug: slugifyRo('Transport'), label: 'Transport' },
      { slug: slugifyRo('Servicii juridice'), label: 'Servicii juridice' },
      { slug: slugifyRo('Servicii contabile'), label: 'Servicii contabile' },
      { slug: slugifyRo('Marketing & Publicitate'), label: 'Marketing & Publicitate' },
      { slug: slugifyRo('Foto / Video'), label: 'Foto / Video' },
      { slug: slugifyRo('Evenimente'), label: 'Evenimente' },
    ],
  },
  {
    slug: slugifyRo('Afaceri & Echipamente'),
    label: 'Afaceri & Echipamente',
    subs: [
      { slug: slugifyRo('Afaceri la cheie'), label: 'Afaceri la cheie' },
      { slug: slugifyRo('Echipamente industriale'), label: 'Echipamente industriale' },
      { slug: slugifyRo('Echipamente comerciale'), label: 'Echipamente comerciale' },
      { slug: slugifyRo('Mașini-unelte'), label: 'Mașini-unelte' },
      { slug: slugifyRo('Francize'), label: 'Francize' },
      { slug: slugifyRo('Materii prime'), label: 'Materii prime' },
    ],
  },
  {
    slug: slugifyRo('Copii & Bebeluși'),
    label: 'Copii & Bebeluși',
    subs: [
      { slug: slugifyRo('Cărucioare'), label: 'Cărucioare' },
      { slug: slugifyRo('Pătuțuri'), label: 'Pătuțuri' },
      { slug: slugifyRo('Jucării'), label: 'Jucării' },
      { slug: slugifyRo('Haine copii'), label: 'Haine copii' },
      { slug: slugifyRo('Produse pentru nou-născuți'), label: 'Produse pentru nou-născuți' },
      { slug: slugifyRo('Educație & Jocuri'), label: 'Educație & Jocuri' },
    ],
  },
  {
    slug: slugifyRo('Sport & Timp liber'),
    label: 'Sport & Timp liber',
    subs: [
      { slug: slugifyRo('Biciclete'), label: 'Biciclete' },
      { slug: slugifyRo('Fitness'), label: 'Fitness' },
      { slug: slugifyRo('Pescuit'), label: 'Pescuit' },
      { slug: slugifyRo('Vânătoare'), label: 'Vânătoare' },
      { slug: slugifyRo('Turism & Camping'), label: 'Turism & Camping' },
      { slug: slugifyRo('Sporturi de iarnă'), label: 'Sporturi de iarnă' },
      { slug: slugifyRo('Jocuri de societate'), label: 'Jocuri de societate' },
    ],
  },
  {
    slug: slugifyRo('Animale'),
    label: 'Animale',
    subs: [
      { slug: slugifyRo('Câini'), label: 'Câini' },
      { slug: slugifyRo('Pisici'), label: 'Pisici' },
      { slug: slugifyRo('Păsări'), label: 'Păsări' },
      { slug: slugifyRo('Animale de fermă'), label: 'Animale de fermă' },
      { slug: slugifyRo('Produse pentru animale'), label: 'Produse pentru animale' },
      { slug: slugifyRo('Servicii veterinare'), label: 'Servicii veterinare' },
    ],
  },
  {
    slug: slugifyRo('Agricultură'),
    label: 'Agricultură',
    subs: [
      { slug: slugifyRo('Utilaje agricole'), label: 'Utilaje agricole' },
      { slug: slugifyRo('Semințe & Plante'), label: 'Semințe & Plante' },
      { slug: slugifyRo('Produse agricole'), label: 'Produse agricole' },
      { slug: slugifyRo('Furaje'), label: 'Furaje' },
      { slug: slugifyRo('Servicii agricole'), label: 'Servicii agricole' },
    ],
  },
  {
    slug: slugifyRo('Educație & Cursuri'),
    label: 'Educație & Cursuri',
    subs: [
      { slug: slugifyRo('Meditații'), label: 'Meditații' },
      { slug: slugifyRo('Cursuri online'), label: 'Cursuri online' },
      { slug: slugifyRo('Limbi străine'), label: 'Limbi străine' },
      { slug: slugifyRo('IT & Programare'), label: 'IT & Programare' },
      { slug: slugifyRo('Dezvoltare personală'), label: 'Dezvoltare personală' },
    ],
  },
  {
    slug: slugifyRo('Diverse'),
    label: 'Diverse',
    subs: [
      { slug: slugifyRo('Obiecte de colecție'), label: 'Obiecte de colecție' },
      { slug: slugifyRo('Antichități'), label: 'Antichități' },
      { slug: slugifyRo('Cărți'), label: 'Cărți' },
      { slug: slugifyRo('Instrumente muzicale'), label: 'Instrumente muzicale' },
      { slug: slugifyRo('Altele'), label: 'Altele' },
    ],
  },
];

// Helper functions
export const getAllCategories = () => {
  return CATEGORIES;
};

export const getAllSubcategories = () => {
  const subcategories = [];
  CATEGORIES.forEach((category) => {
    category.subs.forEach((sub) => {
      subcategories.push({
        parentSlug: category.slug,
        parentLabel: category.label,
        slug: sub.slug,
        label: sub.label,
      });
    });
  });
  return subcategories;
};

export const findCategoryBySlug = (slug) => {
  return CATEGORIES.find((cat) => cat.slug === slug) || null;
};

export const findSubcategoryBySlug = (categorySlug, subcategorySlug) => {
  const category = findCategoryBySlug(categorySlug);
  if (!category) return null;
  return category.subs.find((sub) => sub.slug === subcategorySlug) || null;
};

// Get subcategories for a specific category
export const getSubcategoriesByCategorySlug = (categorySlug) => {
  const category = findCategoryBySlug(categorySlug);
  return category ? category.subs : [];
};

// Validation functions
export const isValidCategorySlug = (slug) => {
  if (!slug || !slug.trim()) return false;
  return findCategoryBySlug(slug) !== null;
};

export const isValidSubCategorySlug = (categorySlug, subCategorySlug) => {
  if (!subCategorySlug || !subCategorySlug.trim()) return true; // Subcategory is optional
  if (!categorySlug || !categorySlug.trim()) return false;
  return findSubcategoryBySlug(categorySlug, subCategorySlug) !== null;
};
