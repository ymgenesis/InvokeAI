import {
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Text,
  Tooltip,
} from '@chakra-ui/react';
import { createSelector } from '@reduxjs/toolkit';
import { stateSelector } from 'app/store/store';
import { useAppSelector } from 'app/store/storeHooks';
import { makeConnectionErrorSelector } from 'features/nodes/store/util/makeIsConnectionValidSelector';
import { HANDLE_TOOLTIP_OPEN_DELAY } from 'features/nodes/types/constants';
import {
  InputFieldValue,
  InvocationTemplate,
} from 'features/nodes/types/types';
import { map } from 'lodash-es';
import { Fragment, memo, useMemo } from 'react';
import FieldHandle from '../FieldHandle';
import InputFieldComponent from '../InputFieldComponent';

interface IAINodeInputsProps {
  nodeId: string;
  template: InvocationTemplate;
  inputs: Record<string, InputFieldValue>;
}

const IAINodeInputs = (props: IAINodeInputsProps) => {
  const { nodeId, template, inputs } = props;
  const inputsArray = useMemo(() => map(inputs), [inputs]);

  return (
    <Flex className="nopan" flexDir="column" px={2}>
      {inputsArray.map((input) => (
        <Fragment key={`${nodeId}.${input.id}.input`}>
          <IAINodeInput nodeId={nodeId} input={input} template={template} />
        </Fragment>
      ))}
    </Flex>
  );
};

export default memo(IAINodeInputs);

interface IAINodeInputProps {
  nodeId: string;
  input: InputFieldValue;
  template: InvocationTemplate;
}

const selectIsConnectionInProgress = createSelector(
  stateSelector,
  ({ nodes }) =>
    nodes.currentConnectionFieldType !== null &&
    nodes.connectionStartParams !== null
);

function IAINodeInput(props: IAINodeInputProps) {
  const { nodeId, input, template } = props;

  const selectIsConnected = useMemo(
    () =>
      createSelector(stateSelector, ({ nodes }) =>
        Boolean(
          nodes.edges.filter((edge) => {
            return edge.target === nodeId && edge.targetHandle === input.name;
          }).length
        )
      ),
    [input.name, nodeId]
  );

  const selectConnectionError = useMemo(
    () => makeConnectionErrorSelector(nodeId, input.name, 'target', input.type),
    [input.name, nodeId, input.type]
  );

  const selectIsSource = useMemo(
    () =>
      createSelector(
        stateSelector,
        ({ nodes }) =>
          nodes.connectionStartParams?.nodeId === nodeId &&
          nodes.connectionStartParams?.handleId === input.name
      ),
    [input.name, nodeId]
  );

  const isConnected = useAppSelector(selectIsConnected);
  const isConnectionInProgress = useAppSelector(selectIsConnectionInProgress);
  const isConnectionSource = useAppSelector(selectIsSource);
  const connectionError = useAppSelector(selectConnectionError);

  const inputTemplate = useMemo(
    () => template.inputs[input.name],
    [input.name, template.inputs]
  );

  const isMissingInput = useMemo(() => {
    if (!inputTemplate) {
      return false;
    }

    if (!inputTemplate.required) {
      return false;
    }

    if (!isConnected && inputTemplate.input === 'connection') {
      return true;
    }

    if (!input.value && !isConnected && inputTemplate.input === 'any') {
      return true;
    }
  }, [inputTemplate, isConnected, input.value]);

  if (!inputTemplate) {
    return <Text variant="subtext">Unknown input: {input.name}</Text>;
  }

  return (
    <Flex
      className="nopan"
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
      <FormControl isDisabled={isConnected} ps={2}>
        <HStack justifyContent="space-between" alignItems="center">
          <HStack>
            <Tooltip
              label={inputTemplate.description}
              placement="top"
              hasArrow
              shouldWrapChildren
              openDelay={HANDLE_TOOLTIP_OPEN_DELAY}
            >
              <FormLabel
                sx={{
                  mb: 0,
                  fontWeight: 500,
                  color: isMissingInput ? 'error.500' : 'base.800',
                  _dark: { color: isMissingInput ? 'error.300' : 'base.200' },
                }}
              >
                {inputTemplate.title}
              </FormLabel>
            </Tooltip>
          </HStack>
          <InputFieldComponent
            nodeId={nodeId}
            field={input}
            template={inputTemplate}
          />
        </HStack>

        {inputTemplate.input !== 'direct' && (
          <FieldHandle
            nodeId={nodeId}
            field={inputTemplate}
            handleType="target"
            isConnectionInProgress={isConnectionInProgress}
            isConnectionSource={isConnectionSource}
            connectionError={connectionError}
          />
        )}
      </FormControl>
    </Flex>
  );
}
