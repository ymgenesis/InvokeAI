import { Box, useColorModeValue, useToken } from '@chakra-ui/react';
import { useAppDispatch, useAppSelector } from 'app/store/storeHooks';
import { nodeClicked } from 'features/nodes/store/nodesSlice';
import { PropsWithChildren, useCallback } from 'react';
import { DRAG_HANDLE_CLASSNAME } from '../../hooks/useBuildInvocation';
import { NODE_WIDTH } from '../../types/constants';

const useNodeSelect = (nodeId: string) => {
  const dispatch = useAppDispatch();
  const ctrl = useAppSelector((state) => state.hotkeys.ctrl);
  const meta = useAppSelector((state) => state.hotkeys.meta);

  const selectNode = useCallback(() => {
    dispatch(nodeClicked({ nodeId, ctrlOrMeta: ctrl || meta }));
  }, [ctrl, dispatch, meta, nodeId]);

  return selectNode;
};

type NodeWrapperProps = PropsWithChildren & {
  nodeId: string;
  selected: boolean;
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

  return (
    <Box
      onClickCapture={selectNode}
      className={shift ? DRAG_HANDLE_CLASSNAME : 'nopan'}
      sx={{
        position: 'relative',
        borderRadius: 'base',
        w: NODE_WIDTH,
        transitionProperty: 'common',
        transitionDuration: '0.1s',
        shadow: props.selected ? shadow : undefined,
        opacity,
        zIndex: '-999 !important',
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
