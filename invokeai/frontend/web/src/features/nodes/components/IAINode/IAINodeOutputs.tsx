import {
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Spacer,
  Tooltip,
} from '@chakra-ui/react';
import { RootState } from 'app/store/store';
import { useAppSelector } from 'app/store/storeHooks';
import { HANDLE_TOOLTIP_OPEN_DELAY } from 'features/nodes/types/constants';
import {
  InvocationTemplate,
  OutputFieldTemplate,
  OutputFieldValue,
} from 'features/nodes/types/types';
import { map } from 'lodash-es';
import { ReactNode, memo, useCallback } from 'react';
import FieldHandle from '../FieldHandle';

interface IAINodeOutputProps {
  nodeId: string;
  output: OutputFieldValue;
  template?: OutputFieldTemplate | undefined;
  connected: boolean;
}

function IAINodeOutput(props: IAINodeOutputProps) {
  const { nodeId, output, template, connected } = props;

  return (
    <Flex sx={{ position: 'relative', minH: 8, py: 0.5, alignItems: 'center' }}>
      <FormControl isDisabled={!template ? true : connected} pe={4}>
        {!template ? (
          <HStack justifyContent="space-between" alignItems="center">
            <FormLabel color="error.400">
              Unknown Output: {output.name}
            </FormLabel>
          </HStack>
        ) : (
          <Flex key={output.id}>
            <Spacer />
            <Tooltip
              label={template.description}
              placement="top"
              hasArrow
              openDelay={HANDLE_TOOLTIP_OPEN_DELAY}
            >
              <FormLabel sx={{ mb: 0 }}>{template?.title}</FormLabel>
            </Tooltip>
            <FieldHandle nodeId={nodeId} field={template} handleType="source" />
          </Flex>
        )}
      </FormControl>
    </Flex>
  );
}

interface IAINodeOutputsProps {
  nodeId: string;
  template: InvocationTemplate;
  outputs: Record<string, OutputFieldValue>;
}

const IAINodeOutputs = (props: IAINodeOutputsProps) => {
  const { nodeId, template, outputs } = props;

  const edges = useAppSelector((state: RootState) => state.nodes.edges);

  const renderIAINodeOutputs = useCallback(() => {
    const IAINodeOutputsToRender: ReactNode[] = [];
    const outputSockets = map(outputs);

    outputSockets.forEach((outputSocket) => {
      const outputTemplate = template.outputs[outputSocket.name];

      const isConnected = Boolean(
        edges.filter((connectedInput) => {
          return (
            connectedInput.source === nodeId &&
            connectedInput.sourceHandle === outputSocket.name
          );
        }).length
      );

      IAINodeOutputsToRender.push(
        <IAINodeOutput
          key={outputSocket.id}
          nodeId={nodeId}
          output={outputSocket}
          template={outputTemplate}
          connected={isConnected}
        />
      );
    });

    return <Flex flexDir="column">{IAINodeOutputsToRender}</Flex>;
  }, [edges, nodeId, outputs, template.outputs]);

  return renderIAINodeOutputs();
};

export default memo(IAINodeOutputs);
