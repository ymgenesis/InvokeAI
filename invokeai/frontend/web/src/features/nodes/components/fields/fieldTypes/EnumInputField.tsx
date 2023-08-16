import { Select } from '@chakra-ui/react';
import { useAppDispatch } from 'app/store/storeHooks';
import { fieldEnumModelValueChanged } from 'features/nodes/store/nodesSlice';
import {
  EnumInputFieldTemplate,
  EnumInputFieldValue,
} from 'features/nodes/types/types';
import { ChangeEvent, memo, useCallback } from 'react';
import { FieldComponentProps } from './types';

const EnumInputFieldComponent = (
  props: FieldComponentProps<EnumInputFieldValue, EnumInputFieldTemplate>
) => {
  const { nodeData, field, fieldTemplate } = props;
  const nodeId = nodeData.id;

  const dispatch = useAppDispatch();

  const handleValueChanged = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      dispatch(
        fieldEnumModelValueChanged({
          nodeId,
          fieldName: field.name,
          value: e.target.value,
        })
      );
    },
    [dispatch, field.name, nodeId]
  );

  return (
    <Select
      className="nowheel"
      onChange={handleValueChanged}
      value={field.value}
    >
      {fieldTemplate.options.map((option) => (
        <option key={option}>{option}</option>
      ))}
    </Select>
  );
};

export default memo(EnumInputFieldComponent);
