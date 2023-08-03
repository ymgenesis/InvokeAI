import { Switch } from '@chakra-ui/react';
import { useAppDispatch } from 'app/store/storeHooks';
import { fieldBooleanValueChanged } from 'features/nodes/store/nodesSlice';
import {
  BooleanInputFieldTemplate,
  BooleanInputFieldValue,
} from 'features/nodes/types/types';
import { ChangeEvent, memo } from 'react';
import { FieldComponentProps } from './types';

const BooleanInputFieldComponent = (
  props: FieldComponentProps<BooleanInputFieldValue, BooleanInputFieldTemplate>
) => {
  const { nodeId, field } = props;

  const dispatch = useAppDispatch();

  const handleValueChanged = (e: ChangeEvent<HTMLInputElement>) => {
    dispatch(
      fieldBooleanValueChanged({
        nodeId,
        fieldName: field.name,
        value: e.target.checked,
      })
    );
  };

  return (
    <Switch onChange={handleValueChanged} isChecked={field.value}></Switch>
  );
};

export default memo(BooleanInputFieldComponent);
