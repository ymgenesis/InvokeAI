import { Tooltip } from '@chakra-ui/react';
import { CSSProperties, memo, useMemo } from 'react';
import { Handle, HandleType, Position } from 'reactflow';
import { FIELDS, HANDLE_TOOLTIP_OPEN_DELAY } from '../types/constants';
import { InputFieldTemplate, OutputFieldTemplate } from '../types/types';

export const handleBaseStyles: CSSProperties = {
  position: 'absolute',
  width: '1rem',
  height: '1rem',
  borderWidth: 0,
  zIndex: 1,
};

export const inputHandleStyles: CSSProperties = {
  left: '-1rem',
};

export const outputHandleStyles: CSSProperties = {
  right: '-0.5rem',
};

type FieldHandleProps = {
  nodeId: string;
  field: InputFieldTemplate | OutputFieldTemplate;
  handleType: HandleType;
  isConnectionInProgress: boolean;
  isConnectionSource: boolean;
  connectionError: string | null;
};

const FieldHandle = (props: FieldHandleProps) => {
  const {
    field,
    handleType,
    isConnectionInProgress,
    isConnectionSource,
    connectionError,
  } = props;
  const { name, type } = field;

  const styles: CSSProperties = useMemo(() => {
    const s: CSSProperties = {
      backgroundColor: FIELDS[type].colorCssVar,
      position: 'absolute',
      width: '1rem',
      height: '1rem',
      borderWidth: 0,
      zIndex: 1,
    };

    if (handleType === 'target') {
      s.left = '-1rem';
    } else {
      s.right = '-0.5rem';
    }

    if (isConnectionInProgress && !isConnectionSource && connectionError) {
      s.filter = 'opacity(0.4) grayscale(0.7)';
    }

    if (isConnectionInProgress && connectionError) {
      if (isConnectionSource) {
        s.cursor = 'grab';
      } else {
        s.cursor = 'not-allowed';
      }
    } else {
      s.cursor = 'crosshair';
    }

    return s;
  }, [
    connectionError,
    handleType,
    isConnectionInProgress,
    isConnectionSource,
    type,
  ]);

  const tooltip = useMemo(() => {
    if (isConnectionInProgress && isConnectionSource) {
      return type;
    }
    if (isConnectionInProgress && connectionError) {
      return connectionError ?? type;
    }
    return type;
  }, [connectionError, isConnectionInProgress, isConnectionSource, type]);

  return (
    <Tooltip
      label={tooltip}
      placement={handleType === 'target' ? 'start' : 'end'}
      hasArrow
      openDelay={HANDLE_TOOLTIP_OPEN_DELAY}
    >
      <Handle
        type={handleType}
        id={name}
        position={handleType === 'target' ? Position.Left : Position.Right}
        style={styles}
      />
    </Tooltip>
  );
};

export default memo(FieldHandle);
