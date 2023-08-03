import {
  CollectionInputFieldTemplate,
  CollectionInputFieldValue,
} from 'features/nodes/types/types';
import { memo } from 'react';
import { FaList } from 'react-icons/fa';
import { FieldComponentProps } from './types';

const CollectionInputFieldComponent = (
  _props: FieldComponentProps<
    CollectionInputFieldValue,
    CollectionInputFieldTemplate
  >
) => {
  return <FaList />;
};

export default memo(CollectionInputFieldComponent);
