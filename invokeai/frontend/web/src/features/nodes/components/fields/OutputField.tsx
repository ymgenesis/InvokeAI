import {
  Flex,
  FormControl,
  FormLabel,
  Spacer,
  Tooltip,
} from '@chakra-ui/react';
import { useConnectionState } from 'features/nodes/hooks/useConnectionState';
import { HANDLE_TOOLTIP_OPEN_DELAY } from 'features/nodes/types/constants';
import {
  InvocationTemplate,
  OutputFieldValue,
} from 'features/nodes/types/types';
import { PropsWithChildren, useMemo } from 'react';
import FieldHandle from './FieldHandle';

interface Props {
  nodeId: string;
  field: OutputFieldValue;
  template: InvocationTemplate;
}

const OutputField = (props: Props) => {
  const { nodeId, field, template } = props;

  const {
    isConnected,
    isConnectionInProgress,
    isConnectionStartField,
    connectionError,
    shouldDim,
  } = useConnectionState({ nodeId, field, kind: 'output' });

  const fieldTemplate = useMemo(
    () => template.outputs[field.name],
    [field.name, template.outputs]
  );

  if (!fieldTemplate) {
    return (
      <OutputFieldWrapper shouldDim={shouldDim}>
        <FormControl
          sx={{ color: 'error.400', textAlign: 'right', fontSize: 'sm' }}
        >
          Unknown output: {field.name}
        </FormControl>
      </OutputFieldWrapper>
    );
  }

  return (
    <OutputFieldWrapper shouldDim={shouldDim}>
      <Spacer />
      <Tooltip
        label={fieldTemplate.description}
        openDelay={HANDLE_TOOLTIP_OPEN_DELAY}
        placement="top"
        shouldWrapChildren
        hasArrow
      >
        <FormControl isDisabled={isConnected} pe={2}>
          <FormLabel sx={{ mb: 0, fontWeight: 500 }}>
            {fieldTemplate?.title}
          </FormLabel>
        </FormControl>
      </Tooltip>
      <FieldHandle
        nodeId={nodeId}
        fieldTemplate={fieldTemplate}
        handleType="source"
        isConnectionInProgress={isConnectionInProgress}
        isConnectionStartField={isConnectionStartField}
        connectionError={connectionError}
      />
    </OutputFieldWrapper>
  );
};

export default OutputField;

type OutputFieldWrapperProps = PropsWithChildren<{
  shouldDim: boolean;
}>;

const OutputFieldWrapper = ({
  shouldDim,
  children,
}: OutputFieldWrapperProps) => (
  <Flex
    sx={{
      position: 'relative',
      minH: 8,
      py: 0.5,
      alignItems: 'center',
      opacity: shouldDim ? 0.5 : 1,
      transitionProperty: 'opacity',
      transitionDuration: '0.1s',
    }}
  >
    {children}
  </Flex>
);
