import { Box, useColorModeValue, useToken } from '@chakra-ui/react';
import { useAppSelector } from 'app/store/storeHooks';
import { PropsWithChildren } from 'react';
import { DRAG_HANDLE_CLASSNAME } from '../hooks/useBuildInvocation';
import { NODE_WIDTH } from '../types/constants';

type NodeWrapperProps = PropsWithChildren & {
  selected: boolean;
};

const NodeWrapper = (props: NodeWrapperProps) => {
  const [nodeSelectedOutlineLight, nodeSelectedOutlineDark] = useToken(
    'shadows',
    ['nodeSelectedOutline.light', 'nodeSelectedOutline.dark']
  );

  const shadow = useColorModeValue(
    nodeSelectedOutlineLight,
    nodeSelectedOutlineDark
  );

  const shift = useAppSelector((state) => state.hotkeys.shift);

  return (
    <Box
      className={shift ? DRAG_HANDLE_CLASSNAME : 'nopan'}
      sx={{
        position: 'relative',
        borderRadius: 'base',
        minWidth: NODE_WIDTH,
        transitionProperty: 'common',
        transitionDuration: '0.1s',
        shadow: props.selected ? shadow : undefined,
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
          shadow: 'dark-lg',
          zIndex: -1,
        }}
      />
      {props.children}
    </Box>
  );
};

export default NodeWrapper;
