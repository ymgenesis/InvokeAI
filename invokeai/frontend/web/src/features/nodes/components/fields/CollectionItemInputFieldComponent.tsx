import {
  CollectionItemInputFieldTemplate,
  CollectionItemInputFieldValue,
} from 'features/nodes/types/types';
import { memo } from 'react';
import { FaAddressCard } from 'react-icons/fa';
import { FieldComponentProps } from './types';

const CollectionItemInputFieldComponent = (
  _props: FieldComponentProps<
    CollectionItemInputFieldValue,
    CollectionItemInputFieldTemplate
  >
) => {
  return <FaAddressCard />;
};

export default memo(CollectionItemInputFieldComponent);
