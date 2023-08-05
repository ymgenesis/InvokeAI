import {
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Spacer,
  Tooltip,
} from '@chakra-ui/react';
import { createSelector } from '@reduxjs/toolkit';
import { RootState, stateSelector } from 'app/store/store';
import { useAppSelector } from 'app/store/storeHooks';
import { makeConnectionErrorSelector } from 'features/nodes/store/util/makeIsConnectionValidSelector';
import { HANDLE_TOOLTIP_OPEN_DELAY } from 'features/nodes/types/constants';
import {
  InvocationTemplate,
  OutputFieldTemplate,
  OutputFieldValue,
} from 'features/nodes/types/types';
import { map } from 'lodash-es';
import { ReactNode, memo, useCallback, useMemo } from 'react';
import FieldHandle from '../FieldHandle';

interface IAINodeOutputProps {
  nodeId: string;
  output: OutputFieldValue;
  template?: OutputFieldTemplate | undefined;
  connected: boolean;
}

const selectIsConnectionInProgress = createSelector(
  stateSelector,
  ({ nodes }) =>
    nodes.currentConnectionFieldType !== null &&
    nodes.connectionStartParams !== null
);

function IAINodeOutput(props: IAINodeOutputProps) {
  const { nodeId, output, template, connected } = props;

  const selectConnectionError = useMemo(
    () =>
      makeConnectionErrorSelector(nodeId, output.name, 'source', output.type),
    [output.name, nodeId, output.type]
  );

  const selectIsSource = useMemo(
    () =>
      createSelector(
        stateSelector,
        ({ nodes }) =>
          nodes.connectionStartParams?.nodeId === nodeId &&
          nodes.connectionStartParams?.handleId === output.name
      ),
    [output.name, nodeId]
  );

  const isConnectionInProgress = useAppSelector(selectIsConnectionInProgress);
  const isConnectionSource = useAppSelector(selectIsSource);
  const connectionError = useAppSelector(selectConnectionError);

  return (
    <Flex
      sx={{
        position: 'relative',
        minH: 8,
        py: 0.5,
        alignItems: 'center',
        opacity:
          isConnectionInProgress && connectionError && !isConnectionSource
            ? 0.5
            : 1,
        transitionProperty: 'opacity',
        transitionDuration: '0.1s',
      }}
    >
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
            <FieldHandle
              nodeId={nodeId}
              field={template}
              handleType="source"
              isConnectionInProgress={isConnectionInProgress}
              isConnectionSource={isConnectionSource}
              connectionError={connectionError}
            />
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
