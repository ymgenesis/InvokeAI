import { useAppDispatch } from 'app/store/storeHooks';
import IAIInput from 'common/components/IAIInput';
import IAITextarea from 'common/components/IAITextarea';
import { fieldStringValueChanged } from 'features/nodes/store/nodesSlice';
import {
  StringInputFieldTemplate,
  StringInputFieldValue,
} from 'features/nodes/types/types';
import { ChangeEvent, memo } from 'react';
import { FieldComponentProps } from './types';

const StringInputFieldComponent = (
  props: FieldComponentProps<StringInputFieldValue, StringInputFieldTemplate>
) => {
  const { nodeId, field, template } = props;
  const dispatch = useAppDispatch();

  const handleValueChanged = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    dispatch(
      fieldStringValueChanged({
        nodeId,
        fieldName: field.name,
        value: e.target.value,
      })
    );
    // dispatch(
    //   fieldValueChanged({
    //     nodeId,
    //     fieldName: field.name,
    //     value: e.target.value,
    //   })
    // );
  };

  if (template.ui_component === 'textarea') {
    return (
      <IAITextarea onChange={handleValueChanged} value={field.value} rows={2} />
    );
  }

  return <IAIInput onChange={handleValueChanged} value={field.value} />;
};

export default memo(StringInputFieldComponent);
