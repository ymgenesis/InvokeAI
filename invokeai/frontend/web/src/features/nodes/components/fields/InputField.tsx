import { Flex, FormControl, FormLabel, Tooltip } from '@chakra-ui/react';
import { useConnectionState } from 'features/nodes/hooks/useConnectionState';
import { HANDLE_TOOLTIP_OPEN_DELAY } from 'features/nodes/types/constants';
import {
  InputFieldValue,
  InvocationTemplate,
} from 'features/nodes/types/types';
import { PropsWithChildren, useMemo } from 'react';
import FieldHandle from './FieldHandle';
import InputFieldRenderer from './InputFieldRenderer';

interface Props {
  nodeId: string;
  field: InputFieldValue;
  template: InvocationTemplate;
}

const InputField = (props: Props) => {
  const { nodeId, field, template } = props;

  const {
    isConnected,
    isConnectionInProgress,
    isConnectionStartField,
    connectionError,
    shouldDim,
  } = useConnectionState({ nodeId, field, kind: 'input' });

  const fieldTemplate = useMemo(
    () => template.inputs[field.name],
    [field.name, template.inputs]
  );

  const isMissingInput = useMemo(() => {
    if (!fieldTemplate) {
      return false;
    }

    if (!fieldTemplate.required) {
      return false;
    }

    if (!isConnected && fieldTemplate.input === 'connection') {
      return true;
    }

    if (!field.value && !isConnected && fieldTemplate.input === 'any') {
      return true;
    }
  }, [fieldTemplate, isConnected, field.value]);

  if (!fieldTemplate) {
    return (
      <InputFieldWrapper shouldDim={shouldDim}>
        <FormControl
          sx={{ color: 'error.400', textAlign: 'left', fontSize: 'sm' }}
        >
          Unknown input: {field.name}
        </FormControl>
      </InputFieldWrapper>
    );
  }

  return (
    <InputFieldWrapper shouldDim={shouldDim}>
      <FormControl
        as={Flex}
        isDisabled={isConnected}
        sx={{
          alignItems: 'center',
          justifyContent: 'space-between',
          ps: 2,
          gap: 2,
        }}
      >
        <Tooltip
          label={fieldTemplate.description}
          openDelay={HANDLE_TOOLTIP_OPEN_DELAY}
          placement="top"
          shouldWrapChildren
          hasArrow
        >
          <FormLabel
            sx={{
              mb: 0,
              fontWeight: 500,
              color: isMissingInput ? 'error.500' : 'base.800',
              _dark: { color: isMissingInput ? 'error.300' : 'base.200' },
            }}
          >
            {fieldTemplate.title}
          </FormLabel>
        </Tooltip>
        <InputFieldRenderer
          nodeId={nodeId}
          field={field}
          template={fieldTemplate}
        />
      </FormControl>

      {fieldTemplate.input !== 'direct' && (
        <FieldHandle
          nodeId={nodeId}
          fieldTemplate={fieldTemplate}
          handleType="target"
          isConnectionInProgress={isConnectionInProgress}
          isConnectionStartField={isConnectionStartField}
          connectionError={connectionError}
        />
      )}
    </InputFieldWrapper>
  );
};

export default InputField;

type InputFieldWrapperProps = PropsWithChildren<{
  shouldDim: boolean;
}>;

const InputFieldWrapper = ({ shouldDim, children }: InputFieldWrapperProps) => (
  <Flex
    className="nopan"
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
