import {
  Box,
  ChakraProps,
  useColorModeValue,
  useToken,
} from '@chakra-ui/react';
import { useAppDispatch, useAppSelector } from 'app/store/storeHooks';
import { nodeClicked } from 'features/nodes/store/nodesSlice';
import { MouseEvent, PropsWithChildren, useCallback, useMemo } from 'react';
import { DRAG_HANDLE_CLASSNAME } from '../../hooks/useBuildInvocation';
import { NODE_WIDTH } from '../../types/constants';

const useNodeSelect = (nodeId: string) => {
  const dispatch = useAppDispatch();

  const selectNode = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      dispatch(nodeClicked({ nodeId, ctrlOrMeta: e.ctrlKey || e.metaKey }));
    },
    [dispatch, nodeId]
  );

  return selectNode;
};

type NodeWrapperProps = PropsWithChildren & {
  nodeId: string;
  selected: boolean;
  width?: NonNullable<ChakraProps['sx']>['w'];
};

const NodeWrapper = (props: NodeWrapperProps) => {
  const [
    nodeSelectedOutlineLight,
    nodeSelectedOutlineDark,
    shadowsXl,
    shadowsBase,
  ] = useToken('shadows', [
    'nodeSelectedOutline.light',
    'nodeSelectedOutline.dark',
    'shadows.xl',
    'shadows.base',
  ]);

  const selectNode = useNodeSelect(props.nodeId);

  const shadow = useColorModeValue(
    nodeSelectedOutlineLight,
    nodeSelectedOutlineDark
  );

  const shift = useAppSelector((state) => state.hotkeys.shift);
  const opacity = useAppSelector((state) => state.nodes.nodeOpacity);
  const className = useMemo(
    () => (shift ? DRAG_HANDLE_CLASSNAME : 'nopan'),
    [shift]
  );

  return (
    <Box
      onClickCapture={selectNode}
      className={className}
      sx={{
        h: 'full',
        position: 'relative',
        borderRadius: 'base',
        w: props.width ?? NODE_WIDTH,
        transitionProperty: 'common',
        transitionDuration: '0.1s',
        shadow: props.selected ? shadow : undefined,
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
      {props.children}
    </Box>
  );
};

export default NodeWrapper;
