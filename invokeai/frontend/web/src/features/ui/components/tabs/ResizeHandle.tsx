import { Box, Flex, FlexProps, useColorMode } from '@chakra-ui/react';
import { memo } from 'react';
import { PanelResizeHandle } from 'react-resizable-panels';
import { mode } from 'theme/util/mode';

type ResizeHandleProps = Omit<FlexProps, 'direction'> & {
  direction?: 'horizontal' | 'vertical';
  collapsedDirection?: 'top' | 'bottom' | 'left' | 'right';
};

const ResizeHandle = (props: ResizeHandleProps) => {
  const { direction = 'horizontal', collapsedDirection, ...rest } = props;
  const { colorMode } = useColorMode();

  if (direction === 'horizontal') {
    return (
      <PanelResizeHandle>
        <Flex
          sx={{
            w: collapsedDirection ? 2 : 4,
            h: 'full',
            justifyContent: collapsedDirection
              ? collapsedDirection === 'left'
                ? 'flex-start'
                : 'flex-end'
              : 'center',
            alignItems: 'center',
          }}
          {...rest}
        >
          <Box
            sx={{
              w: 0.5,
              h: 'calc(100% - 1rem)',
              bg: mode('blackAlpha.100', 'whiteAlpha.100')(colorMode),
            }}
          />
        </Flex>
      </PanelResizeHandle>
    );
  }

  return (
    <PanelResizeHandle>
      <Flex
        sx={{
          w: 'full',
          h: collapsedDirection ? 2 : 4,
          justifyContent: collapsedDirection
            ? collapsedDirection === 'left'
              ? 'flex-start'
              : 'flex-end'
            : 'center',
          alignItems: 'center',
        }}
        {...rest}
      >
        <Box
          sx={{
            h: 0.5,
            w: 'calc(100% - 1rem)',
            bg: mode('blackAlpha.100', 'whiteAlpha.100')(colorMode),
          }}
        />
      </Flex>
    </PanelResizeHandle>
  );
};

export default memo(ResizeHandle);
