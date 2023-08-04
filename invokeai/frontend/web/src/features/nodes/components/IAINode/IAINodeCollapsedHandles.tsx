import { useColorModeValue } from '@chakra-ui/react';
import { useChakraThemeTokens } from 'common/hooks/useChakraThemeTokens';
import { InvocationValue } from 'features/nodes/types/types';
import { map } from 'lodash-es';
import { CSSProperties, memo, useMemo } from 'react';
import { Handle, Position } from 'reactflow';

interface IAINodeCollapsedHandlesProps {
  data: InvocationValue;
}

const IAINodeCollapsedHandles = (props: IAINodeCollapsedHandlesProps) => {
  const { data } = props;
  const { base400, base600 } = useChakraThemeTokens();
  const backgroundColor = useColorModeValue(base400, base600);

  const dummyHandleStyles: CSSProperties = useMemo(
    () => ({
      borderWidth: 0,
      borderRadius: '3px',
      width: '1rem',
      height: '1rem',
      backgroundColor,
      zIndex: -1,
    }),
    [backgroundColor]
  );

  return (
    <>
      <Handle
        type="target"
        id={`${data.id}-collapsed-target`}
        isConnectable={false}
        position={Position.Left}
        style={{ ...dummyHandleStyles, left: '-0.5rem' }}
      />
      {map(data.inputs, (input) => (
        <Handle
          type="target"
          id={input.name}
          isValidConnection={() => false}
          position={Position.Left}
          style={{ visibility: 'hidden' }}
        />
      ))}
      <Handle
        type="source"
        id={`${data.id}-collapsed-source`}
        isValidConnection={() => false}
        isConnectable={false}
        position={Position.Right}
        style={{ ...dummyHandleStyles, right: '-0.5rem' }}
      />
      {map(data.outputs, (output) => (
        <Handle
          type="source"
          id={output.name}
          isValidConnection={() => false}
          position={Position.Right}
          style={{ visibility: 'hidden' }}
        />
      ))}
    </>
  );
};

export default memo(IAINodeCollapsedHandles);
