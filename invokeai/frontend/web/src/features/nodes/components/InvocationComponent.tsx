import { Divider, Flex, Icon } from '@chakra-ui/react';
import { useAppSelector } from 'app/store/storeHooks';
import { memo, useMemo } from 'react';
import { FaExclamationCircle } from 'react-icons/fa';
import { NodeProps } from 'reactflow';
import { makeTemplateSelector } from '../store/util/makeTemplateSelector';
import { InvocationValue } from '../types/types';
import IAINodeHeader from './IAINode/IAINodeHeader';
import IAINodeInputs from './IAINode/IAINodeInputs';
import IAINodeOutputs from './IAINode/IAINodeOutputs';
import NodeWrapper from './NodeWrapper';

export const InvocationComponent = memo((props: NodeProps<InvocationValue>) => {
  const { id: nodeId, data, selected } = props;
  const { type, inputs, outputs, isOpen } = data;

  const templateSelector = useMemo(() => makeTemplateSelector(type), [type]);

  const template = useAppSelector(templateSelector);

  if (!template) {
    return (
      <NodeWrapper selected={selected}>
        <Flex
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
    <NodeWrapper selected={selected}>
      <IAINodeHeader
        data={data}
        title={template.title}
        description={template.description}
      />
      {isOpen && (
        <Flex
          className={'nopan'}
          sx={{
            cursor: 'auto',
            flexDirection: 'column',
            borderBottomRadius: 'base',
            py: 2,
            bg: 'base.100',
            _dark: { bg: 'base.800' },
          }}
        >
          <IAINodeOutputs
            nodeId={nodeId}
            outputs={outputs}
            template={template}
          />
          <Divider />
          <IAINodeInputs nodeId={nodeId} inputs={inputs} template={template} />
        </Flex>
      )}
    </NodeWrapper>
  );
});

InvocationComponent.displayName = 'InvocationComponent';
