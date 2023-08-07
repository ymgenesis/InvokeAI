import { Flex, Icon } from '@chakra-ui/react';
import { useAppSelector } from 'app/store/storeHooks';
import { makeTemplateSelector } from 'features/nodes/store/util/makeTemplateSelector';
import { InvocationValue } from 'features/nodes/types/types';
import { map } from 'lodash-es';
import { memo, useMemo } from 'react';
import { FaExclamationCircle } from 'react-icons/fa';
import { NodeProps } from 'reactflow';
import NodeHeader from '../Invocation/NodeHeader';
import InputField from '../fields/InputField';
import OutputField from '../fields/OutputField';
import NodeWrapper from './NodeWrapper';
import NodeResizer from '../Invocation/NodeResizer';

export const InvocationNode = memo((props: NodeProps<InvocationValue>) => {
  const { id: nodeId, data, selected } = props;
  const { type, inputs, outputs, isOpen } = data;

  const templateSelector = useMemo(() => makeTemplateSelector(type), [type]);
  const template = useAppSelector(templateSelector);
  const inputFields = useMemo(
    () => map(inputs).filter((i) => i.name !== 'is_intermediate'),
    [inputs]
  );
  const outputFields = useMemo(() => map(outputs), [outputs]);

  if (!template) {
    return (
      <NodeWrapper nodeId={nodeId} selected={selected}>
        <Flex
          layerStyle="second"
          className="nopan"
          sx={{
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'auto',
          }}
        >
          <Icon
            as={FaExclamationCircle}
            sx={{
              boxSize: 32,
              color: 'base.600',
              _dark: { color: 'base.400' },
            }}
          ></Icon>
        </Flex>
      </NodeWrapper>
    );
  }

  return (
    <NodeWrapper nodeId={nodeId} selected={selected}>
      <NodeHeader
        data={data}
        title={template.title}
        description={template.description}
      />
      {isOpen && (
        <>
          <Flex
            className={'nopan'}
            sx={{
              cursor: 'auto',
              flexDirection: 'column',
              borderBottomRadius: 'base',
              py: 1,
              bg: 'base.100',
              _dark: { bg: 'base.800' },
              gap: 1,
            }}
          >
            <Flex className="nopan" flexDir="column" px={2}>
              {outputFields.map((field) => (
                <OutputField
                  key={`${nodeId}.${field.id}.input-field`}
                  nodeId={nodeId}
                  field={field}
                  template={template}
                />
              ))}
              {inputFields.map((field) => (
                <InputField
                  key={`${nodeId}.${field.id}.input-field`}
                  nodeId={nodeId}
                  field={field}
                  template={template}
                />
              ))}
            </Flex>
          </Flex>
          <NodeResizer />
        </>
      )}
    </NodeWrapper>
  );
});

InvocationNode.displayName = 'InvocationComponent';
