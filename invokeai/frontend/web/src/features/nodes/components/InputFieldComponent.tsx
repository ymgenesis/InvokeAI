import { Box } from '@chakra-ui/react';
import { memo } from 'react';
import { InputFieldTemplate, InputFieldValue } from '../types/types';
import CollectionInputFieldComponent from './fields/CollectionInputFieldComponent';
import BooleanInputFieldComponent from './fields/BooleanInputFieldComponent';
import ClipInputFieldComponent from './fields/ClipInputFieldComponent';
import ColorInputFieldComponent from './fields/ColorInputFieldComponent';
import ConditioningInputFieldComponent from './fields/ConditioningInputFieldComponent';
import ControlInputFieldComponent from './fields/ControlInputFieldComponent';
import ControlNetModelInputFieldComponent from './fields/ControlNetModelInputFieldComponent';
import EnumInputFieldComponent from './fields/EnumInputFieldComponent';
import ImageCollectionInputFieldComponent from './fields/ImageCollectionInputFieldComponent';
import ImageInputFieldComponent from './fields/ImageInputFieldComponent';
import CollectionItemInputFieldComponent from './fields/CollectionItemInputFieldComponent';
import LatentsInputFieldComponent from './fields/LatentsInputFieldComponent';
import LoRAModelInputFieldComponent from './fields/LoRAModelInputFieldComponent';
import MainModelInputFieldComponent from './fields/MainModelInputFieldComponent';
import FloatInputFieldComponent from './fields/NumberInputFieldComponent';
import StringInputFieldComponent from './fields/StringInputFieldComponent';
import UnetInputFieldComponent from './fields/UnetInputFieldComponent';
import VaeInputFieldComponent from './fields/VaeInputFieldComponent';
import VaeModelInputFieldComponent from './fields/VaeModelInputFieldComponent';
import RefinerModelInputFieldComponent from './fields/RefinerModelInputFieldComponent';
import SDXLMainModelInputFieldComponent from './fields/SDXLMainModelInputFieldComponent';

type InputFieldComponentProps = {
  nodeId: string;
  field: InputFieldValue;
  template: InputFieldTemplate;
};

// build an individual input element based on the schema
const InputFieldComponent = (props: InputFieldComponentProps) => {
  const { nodeId, field, template } = props;
  const { type } = field;

  if (type === 'string' && template.type === 'string') {
    return (
      <StringInputFieldComponent
        nodeId={nodeId}
        field={field}
        template={template}
      />
    );
  }

  if (type === 'boolean' && template.type === 'boolean') {
    return (
      <BooleanInputFieldComponent
        nodeId={nodeId}
        field={field}
        template={template}
      />
    );
  }

  if (
    (type === 'integer' && template.type === 'integer') ||
    (type === 'float' && template.type === 'float')
  ) {
    return (
      <FloatInputFieldComponent
        nodeId={nodeId}
        field={field}
        template={template}
      />
    );
  }

  if (type === 'enum' && template.type === 'enum') {
    return (
      <EnumInputFieldComponent
        nodeId={nodeId}
        field={field}
        template={template}
      />
    );
  }

  if (type === 'ImageField' && template.type === 'ImageField') {
    return (
      <ImageInputFieldComponent
        nodeId={nodeId}
        field={field}
        template={template}
      />
    );
  }

  if (type === 'LatentsField' && template.type === 'LatentsField') {
    return (
      <LatentsInputFieldComponent
        nodeId={nodeId}
        field={field}
        template={template}
      />
    );
  }

  if (type === 'ConditioningField' && template.type === 'ConditioningField') {
    return (
      <ConditioningInputFieldComponent
        nodeId={nodeId}
        field={field}
        template={template}
      />
    );
  }

  if (type === 'UNetField' && template.type === 'UNetField') {
    return (
      <UnetInputFieldComponent
        nodeId={nodeId}
        field={field}
        template={template}
      />
    );
  }

  if (type === 'ClipField' && template.type === 'ClipField') {
    return (
      <ClipInputFieldComponent
        nodeId={nodeId}
        field={field}
        template={template}
      />
    );
  }

  if (type === 'VaeField' && template.type === 'VaeField') {
    return (
      <VaeInputFieldComponent
        nodeId={nodeId}
        field={field}
        template={template}
      />
    );
  }

  if (type === 'ControlField' && template.type === 'ControlField') {
    return (
      <ControlInputFieldComponent
        nodeId={nodeId}
        field={field}
        template={template}
      />
    );
  }

  if (type === 'MainModelField' && template.type === 'MainModelField') {
    return (
      <MainModelInputFieldComponent
        nodeId={nodeId}
        field={field}
        template={template}
      />
    );
  }

  if (
    type === 'SDXLRefinerModelField' &&
    template.type === 'SDXLRefinerModelField'
  ) {
    return (
      <RefinerModelInputFieldComponent
        nodeId={nodeId}
        field={field}
        template={template}
      />
    );
  }

  if (type === 'VaeModelField' && template.type === 'VaeModelField') {
    return (
      <VaeModelInputFieldComponent
        nodeId={nodeId}
        field={field}
        template={template}
      />
    );
  }

  if (type === 'LoRAModelField' && template.type === 'LoRAModelField') {
    return (
      <LoRAModelInputFieldComponent
        nodeId={nodeId}
        field={field}
        template={template}
      />
    );
  }

  if (
    type === 'ControlNetModelField' &&
    template.type === 'ControlNetModelField'
  ) {
    return (
      <ControlNetModelInputFieldComponent
        nodeId={nodeId}
        field={field}
        template={template}
      />
    );
  }

  if (type === 'Collection' && template.type === 'Collection') {
    return (
      <CollectionInputFieldComponent
        nodeId={nodeId}
        field={field}
        template={template}
      />
    );
  }

  if (type === 'CollectionItem' && template.type === 'CollectionItem') {
    return (
      <CollectionItemInputFieldComponent
        nodeId={nodeId}
        field={field}
        template={template}
      />
    );
  }

  if (type === 'ColorField' && template.type === 'ColorField') {
    return (
      <ColorInputFieldComponent
        nodeId={nodeId}
        field={field}
        template={template}
      />
    );
  }

  if (type === 'ImageCollection' && template.type === 'ImageCollection') {
    return (
      <ImageCollectionInputFieldComponent
        nodeId={nodeId}
        field={field}
        template={template}
      />
    );
  }

  if (type === 'SDXLMainModelField' && template.type === 'SDXLMainModelField') {
    return (
      <SDXLMainModelInputFieldComponent
        nodeId={nodeId}
        field={field}
        template={template}
      />
    );
  }

  return <Box p={2}>Unknown field type: {type}</Box>;
};

export default memo(InputFieldComponent);
