import { Box } from '@chakra-ui/react';
import { memo } from 'react';
import { InputFieldTemplate, InputFieldValue } from '../../types/types';
import CollectionInputField from './fieldTypes/CollectionInputField';
import BooleanInputField from './fieldTypes/BooleanInputField';
import ClipInputField from './fieldTypes/ClipInputField';
import ColorInputField from './fieldTypes/ColorInputField';
import ConditioningInputField from './fieldTypes/ConditioningInputField';
import ControlInputField from './fieldTypes/ControlInputField';
import ControlNetModelInputField from './fieldTypes/ControlNetModelInputField';
import EnumInputField from './fieldTypes/EnumInputField';
import ImageCollectionInputField from './fieldTypes/ImageCollectionInputField';
import ImageInputField from './fieldTypes/ImageInputField';
import CollectionItemInputField from './fieldTypes/CollectionItemInputField';
import LatentsInputField from './fieldTypes/LatentsInputField';
import LoRAModelInputField from './fieldTypes/LoRAModelInputField';
import MainModelInputField from './fieldTypes/MainModelInputField';
import NumberInputField from './fieldTypes/NumberInputField';
import StringInputField from './fieldTypes/StringInputField';
import UnetInputField from './fieldTypes/UnetInputField';
import VaeInputField from './fieldTypes/VaeInputField';
import VaeModelInputField from './fieldTypes/VaeModelInputField';
import RefinerModelInputField from './fieldTypes/RefinerModelInputField';
import SDXLMainModelInputField from './fieldTypes/SDXLMainModelInputField';

type InputFieldProps = {
  nodeId: string;
  field: InputFieldValue;
  template: InputFieldTemplate;
};

// build an individual input element based on the schema
const InputFieldRenderer = (props: InputFieldProps) => {
  const { nodeId, field, template } = props;
  const { type } = field;

  if (type === 'string' && template.type === 'string') {
    return (
      <StringInputField nodeId={nodeId} field={field} template={template} />
    );
  }

  if (type === 'boolean' && template.type === 'boolean') {
    return (
      <BooleanInputField nodeId={nodeId} field={field} template={template} />
    );
  }

  if (
    (type === 'integer' && template.type === 'integer') ||
    (type === 'float' && template.type === 'float') ||
    (type === 'Seed' && template.type === 'Seed')
  ) {
    return (
      <NumberInputField nodeId={nodeId} field={field} template={template} />
    );
  }

  if (type === 'enum' && template.type === 'enum') {
    return <EnumInputField nodeId={nodeId} field={field} template={template} />;
  }

  if (type === 'ImageField' && template.type === 'ImageField') {
    return (
      <ImageInputField nodeId={nodeId} field={field} template={template} />
    );
  }

  if (type === 'LatentsField' && template.type === 'LatentsField') {
    return (
      <LatentsInputField nodeId={nodeId} field={field} template={template} />
    );
  }

  if (type === 'ConditioningField' && template.type === 'ConditioningField') {
    return (
      <ConditioningInputField
        nodeId={nodeId}
        field={field}
        template={template}
      />
    );
  }

  if (type === 'UNetField' && template.type === 'UNetField') {
    return <UnetInputField nodeId={nodeId} field={field} template={template} />;
  }

  if (type === 'ClipField' && template.type === 'ClipField') {
    return <ClipInputField nodeId={nodeId} field={field} template={template} />;
  }

  if (type === 'VaeField' && template.type === 'VaeField') {
    return <VaeInputField nodeId={nodeId} field={field} template={template} />;
  }

  if (type === 'ControlField' && template.type === 'ControlField') {
    return (
      <ControlInputField nodeId={nodeId} field={field} template={template} />
    );
  }

  if (type === 'MainModelField' && template.type === 'MainModelField') {
    return (
      <MainModelInputField nodeId={nodeId} field={field} template={template} />
    );
  }

  if (
    type === 'SDXLRefinerModelField' &&
    template.type === 'SDXLRefinerModelField'
  ) {
    return (
      <RefinerModelInputField
        nodeId={nodeId}
        field={field}
        template={template}
      />
    );
  }

  if (type === 'VaeModelField' && template.type === 'VaeModelField') {
    return (
      <VaeModelInputField nodeId={nodeId} field={field} template={template} />
    );
  }

  if (type === 'LoRAModelField' && template.type === 'LoRAModelField') {
    return (
      <LoRAModelInputField nodeId={nodeId} field={field} template={template} />
    );
  }

  if (
    type === 'ControlNetModelField' &&
    template.type === 'ControlNetModelField'
  ) {
    return (
      <ControlNetModelInputField
        nodeId={nodeId}
        field={field}
        template={template}
      />
    );
  }

  if (type === 'Collection' && template.type === 'Collection') {
    return (
      <CollectionInputField nodeId={nodeId} field={field} template={template} />
    );
  }

  if (type === 'CollectionItem' && template.type === 'CollectionItem') {
    return (
      <CollectionItemInputField
        nodeId={nodeId}
        field={field}
        template={template}
      />
    );
  }

  if (type === 'ColorField' && template.type === 'ColorField') {
    return (
      <ColorInputField nodeId={nodeId} field={field} template={template} />
    );
  }

  if (type === 'ImageCollection' && template.type === 'ImageCollection') {
    return (
      <ImageCollectionInputField
        nodeId={nodeId}
        field={field}
        template={template}
      />
    );
  }

  if (type === 'SDXLMainModelField' && template.type === 'SDXLMainModelField') {
    return (
      <SDXLMainModelInputField
        nodeId={nodeId}
        field={field}
        template={template}
      />
    );
  }

  return <Box p={2}>Unknown field type: {type}</Box>;
};

export default memo(InputFieldRenderer);
