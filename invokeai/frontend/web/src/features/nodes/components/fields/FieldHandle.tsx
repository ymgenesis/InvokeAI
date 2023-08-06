import { Tooltip } from '@chakra-ui/react';
import { CSSProperties, memo, useMemo } from 'react';
import { Handle, HandleType, Position } from 'reactflow';
import { FIELDS, HANDLE_TOOLTIP_OPEN_DELAY } from '../../types/constants';
import { InputFieldTemplate, OutputFieldTemplate } from '../../types/types';

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
  fieldTemplate: InputFieldTemplate | OutputFieldTemplate;
  handleType: HandleType;
  isConnectionInProgress: boolean;
  isConnectionStartField: boolean;
  connectionError: string | null;
};

const FieldHandle = (props: FieldHandleProps) => {
  const {
    fieldTemplate,
    handleType,
    isConnectionInProgress,
    isConnectionStartField,
    connectionError,
  } = props;
  const { name, type } = fieldTemplate;

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
      s.right = '-1rem';
    }

    if (isConnectionInProgress && !isConnectionStartField && connectionError) {
      s.filter = 'opacity(0.4) grayscale(0.7)';
    }

    if (isConnectionInProgress && connectionError) {
      if (isConnectionStartField) {
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
    isConnectionStartField,
    type,
  ]);

  const tooltip = useMemo(() => {
    if (isConnectionInProgress && isConnectionStartField) {
      return type;
    }
    if (isConnectionInProgress && connectionError) {
      return connectionError ?? type;
    }
    return type;
  }, [connectionError, isConnectionInProgress, isConnectionStartField, type]);

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
