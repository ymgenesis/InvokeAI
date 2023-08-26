import {
  Box,
  ChakraProps,
  useColorModeValue,
  useToken,
} from '@chakra-ui/react';
import { createSelector } from '@reduxjs/toolkit';
import { stateSelector } from 'app/store/store';
import { useAppDispatch, useAppSelector } from 'app/store/storeHooks';
import {
  DRAG_HANDLE_CLASSNAME,
  NODE_WIDTH,
} from 'features/nodes/types/constants';
import { NodeStatus } from 'features/nodes/types/types';
import { contextMenusClosed } from 'features/ui/store/uiSlice';
import { PropsWithChildren, memo, useCallback, useMemo } from 'react';

type NodeWrapperProps = PropsWithChildren & {
  nodeId: string;
  selected: boolean;
  width?: NonNullable<ChakraProps['sx']>['w'];
};

const NodeWrapper = (props: NodeWrapperProps) => {
  const { nodeId, width, children, selected } = props;

  const selectIsInProgress = useMemo(
    () =>
      createSelector(
        stateSelector,
        ({ nodes }) =>
          nodes.nodeExecutionStates[nodeId]?.status === NodeStatus.IN_PROGRESS
      ),
    [nodeId]
  );

  const isInProgress = useAppSelector(selectIsInProgress);

  const [
    nodeSelectedLight,
    nodeSelectedDark,
    nodeInProgressLight,
    nodeInProgressDark,
    shadowsXl,
    shadowsBase,
  ] = useToken('shadows', [
    'nodeSelected.light',
    'nodeSelected.dark',
    'nodeInProgress.light',
    'nodeInProgress.dark',
    'shadows.xl',
    'shadows.base',
  ]);

  const dispatch = useAppDispatch();

  const selectedShadow = useColorModeValue(nodeSelectedLight, nodeSelectedDark);
  const inProgressShadow = useColorModeValue(
    nodeInProgressLight,
    nodeInProgressDark
  );

  const opacity = useAppSelector((state) => state.nodes.nodeOpacity);

  const handleClick = useCallback(() => {
    dispatch(contextMenusClosed());
  }, [dispatch]);

  return (
    <Box
      onClick={handleClick}
      className={DRAG_HANDLE_CLASSNAME}
      sx={{
        h: 'full',
        position: 'relative',
        borderRadius: 'base',
        w: width ?? NODE_WIDTH,
        transitionProperty: 'common',
        transitionDuration: '0.1s',
        shadow: selected
          ? isInProgress
            ? undefined
            : selectedShadow
          : undefined,
        cursor: 'grab',
        opacity,
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          insetInlineEnd: 0,
          bottom: 0,
          insetInlineStart: 0,
          borderRadius: 'base',
          pointerEvents: 'none',
          shadow: `${shadowsXl}, ${shadowsBase}, ${shadowsBase}`,
          zIndex: -1,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          insetInlineEnd: 0,
          bottom: 0,
          insetInlineStart: 0,
          borderRadius: 'md',
          pointerEvents: 'none',
          transitionProperty: 'common',
          transitionDuration: 'normal',
          opacity: 0.7,
          shadow: isInProgress ? inProgressShadow : undefined,
          zIndex: -1,
        }}
      />
      {children}
    </Box>
  );
};

export default memo(NodeWrapper);
