import { Flex, Image, Text } from '@chakra-ui/react';
import { createSelector } from '@reduxjs/toolkit';
import { stateSelector } from 'app/store/store';
import IAIDndImage from 'common/components/IAIDndImage';
import { IAINoContentFallback } from 'common/components/IAIImageFallback';
import { DRAG_HANDLE_CLASSNAME } from 'features/nodes/hooks/useBuildInvocation';
import { PropsWithChildren, memo } from 'react';
import { useSelector } from 'react-redux';
import { NodeProps } from 'reactflow';
import NodeWrapper from '../Invocation/NodeWrapper';

const selector = createSelector(stateSelector, ({ system, gallery }) => {
  const imageDTO = gallery.selection[gallery.selection.length - 1];

  return {
    imageDTO,
    progressImage: system.progressImage,
  };
});

const CurrentImageNode = (props: NodeProps) => {
  const { progressImage, imageDTO } = useSelector(selector);
  const { id: nodeId, selected } = props;

  if (progressImage) {
    return (
      <Wrapper nodeId={nodeId} selected={selected}>
        <Image
          src={progressImage.dataURL}
          sx={{
            w: 'full',
            h: 'full',
            objectFit: 'contain',
            borderRadius: 'base',
          }}
        />
      </Wrapper>
    );
  }

  if (imageDTO) {
    return (
      <Wrapper nodeId={nodeId} selected={selected}>
        <IAIDndImage imageDTO={imageDTO} isDragDisabled useThumbailFallback />
      </Wrapper>
    );
  }

  return (
    <Wrapper nodeId={nodeId} selected={selected}>
      <IAINoContentFallback />
    </Wrapper>
  );
};

export default memo(CurrentImageNode);

const Wrapper = (
  props: PropsWithChildren<{ nodeId: string; selected: boolean }>
) => (
  <NodeWrapper nodeId={props.nodeId} selected={props.selected} width={384}>
    <Flex
      className={DRAG_HANDLE_CLASSNAME}
      sx={{
        flexDirection: 'column',
      }}
    >
      <Flex
        layerStyle="nodeHeader"
        sx={{
          borderTopRadius: 'base',
          alignItems: 'center',
          justifyContent: 'center',
          h: 8,
        }}
      >
        <Text
          sx={{
            fontSize: 'sm',
            fontWeight: 600,
            color: 'base.700',
            _dark: { color: 'base.200' },
          }}
        >
          Current Image
        </Text>
      </Flex>
      <Flex
        layerStyle="nodeBody"
        sx={{ w: 'full', h: 'full', borderBottomRadius: 'base', p: 2 }}
      >
        {props.children}
      </Flex>
    </Flex>
  </NodeWrapper>
);
