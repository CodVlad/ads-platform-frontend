/**
 * Merges category and subcategory fields by key. Subcategory fields override base for same key.
 *
 * @param {Array} baseFields - category.fields
 * @param {Array} subFields - subcategory.fields
 * @returns {Array} merged fields array
 */
export function mergeFieldsByKey(baseFields = [], subFields = []) {
  const byKey = new Map();
  (Array.isArray(baseFields) ? baseFields : []).forEach((f) => {
    const k = f.key || f.name;
    if (k) byKey.set(k, { ...f });
  });
  (Array.isArray(subFields) ? subFields : []).forEach((f) => {
    const k = f.key || f.name;
    if (k) byKey.set(k, { ...f });
  });
  return Array.from(byKey.values());
}

/**
 * Validates dynamic detail fields from category schema.
 * Returns errors keyed by detail_<fieldKey>.
 *
 * @param {Array<{key: string, name?: string, label?: string, type: string, required?: boolean, options?: Array}>} fields
 * @param {Object} details - Current details state { [field.key]: value }
 * @returns {Object} { detail_<key>: string }
 */
export function validateDynamicDetails(fields = [], details = {}) {
  const errors = {};
  if (!Array.isArray(fields)) return errors;

  const getOptionValues = (field) => {
    const opts = field.options || [];
    if (!Array.isArray(opts)) return [];
    return opts.map((o) => (typeof o === 'string' ? o : o.value ?? o.label));
  };

  fields.forEach((field) => {
    const key = field.key || field.name;
    if (!key) return;
    const label = field.label || key;
    const val = details[key];
    const empty = val === undefined || val === null || (typeof val === 'string' && !String(val).trim());

    if (field.required && empty) {
      errors[`detail_${key}`] = `${label} is required`;
      return;
    }

    if (empty) return;

    if (field.type === 'number') {
      const num = Number(val);
      if (!Number.isFinite(num)) {
        errors[`detail_${key}`] = 'Must be a valid number';
      }
      return;
    }

    if (field.type === 'select') {
      const optionValues = getOptionValues(field);
      if (optionValues.length > 0) {
        const valStr = String(val);
        const valid = optionValues.some((opt) => String(opt) === valStr);
        if (!valid) {
          errors[`detail_${key}`] = 'Please choose a valid option';
        }
      }
    }
  });

  return errors;
}
