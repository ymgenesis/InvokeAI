import { Tooltip } from '@chakra-ui/react';
import { createSelector } from '@reduxjs/toolkit';
import { stateSelector } from 'app/store/store';
import { useAppSelector } from 'app/store/storeHooks';
import { CSSProperties, memo, useMemo } from 'react';
import { Handle, HandleType, Position } from 'reactflow';
import { makeConnectionErrorSelector } from '../store/util/makeIsConnectionValidSelector';
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
};

const selectIsConnectionInProgress = createSelector(
  stateSelector,
  ({ nodes }) =>
    nodes.currentConnectionFieldType !== null &&
    nodes.connectionStartParams !== null
);

const FieldHandle = (props: FieldHandleProps) => {
  const { field, handleType, nodeId } = props;
  const { name, type } = field;

  const connectionErrorSelector = useMemo(
    () => makeConnectionErrorSelector(nodeId, name, handleType, type),
    [handleType, name, nodeId, type]
  );

  const isConnectionInProgress = useAppSelector(selectIsConnectionInProgress);
  const connectionError = useAppSelector(connectionErrorSelector);

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

    if (isConnectionInProgress) {
      s.opacity = connectionError ? 0.5 : 1;
    }

    if (isConnectionInProgress && connectionError) {
      s.cursor = 'not-allowed';
    } else {
      s.cursor = 'crosshair';
    }

    return s;
  }, [connectionError, handleType, isConnectionInProgress, type]);

  return (
    <Tooltip
      label={isConnectionInProgress ? connectionError ?? type : type}
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
