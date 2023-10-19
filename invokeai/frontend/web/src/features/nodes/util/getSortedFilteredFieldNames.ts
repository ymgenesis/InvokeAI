import { isNil } from 'lodash-es';
import { InputFieldTemplate, OutputFieldTemplate } from '../types/types';

export const getSortedFilteredFieldNames = (
  fields: InputFieldTemplate[] | OutputFieldTemplate[]
): string[] => {
  const visibleFields = fields.filter((field) => !field.ui_hidden);

  // we want explicitly ordered fields to be before unordered fields; split the list
  const orderedFields = visibleFields
    .filter((f) => !isNil(f.ui_order))
    .sort((a, b) => (a.ui_order ?? 0) - (b.ui_order ?? 0));
  const unorderedFields = visibleFields.filter((f) => isNil(f.ui_order));

  // concat the lists, and return the field names, skipping `is_intermediate`
  return orderedFields
    .concat(unorderedFields)
    .map((f) => f.name)
    .filter((fieldName) => fieldName !== 'is_intermediate');
};
