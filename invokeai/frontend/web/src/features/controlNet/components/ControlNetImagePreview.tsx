import { Box, Flex, Spinner } from '@chakra-ui/react';
import { createSelector } from '@reduxjs/toolkit';
import { skipToken } from '@reduxjs/toolkit/dist/query';
import { stateSelector } from 'app/store/store';
import { useAppDispatch, useAppSelector } from 'app/store/storeHooks';
import { defaultSelectorOptions } from 'app/store/util/defaultMemoizeOptions';
import IAIDndImage from 'common/components/IAIDndImage';
import {
  TypesafeDraggableData,
  TypesafeDroppableData,
} from 'features/dnd/types';
import { memo, useCallback, useMemo, useState } from 'react';
import { FaUndo } from 'react-icons/fa';
import { useGetImageDTOQuery } from 'services/api/endpoints/images';
import { PostUploadAction } from 'services/api/types';
import IAIDndImageIcon from '../../../common/components/IAIDndImageIcon';
import {
  ControlNetConfig,
  controlNetImageChanged,
} from '../store/controlNetSlice';

type Props = {
  controlNet: ControlNetConfig;
  isSmall?: boolean;
};

const selector = createSelector(
  stateSelector,
  ({ controlNet }) => {
    const { pendingControlImages } = controlNet;

    return {
      pendingControlImages,
    };
  },
  defaultSelectorOptions
);

const ControlNetImagePreview = ({ isSmall, controlNet }: Props) => {
  const {
    controlImage: controlImageName,
    processedControlImage: processedControlImageName,
    processorType,
    isEnabled,
    controlNetId,
  } = controlNet;

  const dispatch = useAppDispatch();

  const { pendingControlImages } = useAppSelector(selector);

  const [isMouseOverImage, setIsMouseOverImage] = useState(false);

  const { currentData: controlImage } = useGetImageDTOQuery(
    controlImageName ?? skipToken
  );

  const { currentData: processedControlImage } = useGetImageDTOQuery(
    processedControlImageName ?? skipToken
  );

  const handleResetControlImage = useCallback(() => {
    dispatch(controlNetImageChanged({ controlNetId, controlImage: null }));
  }, [controlNetId, dispatch]);
  const handleMouseEnter = useCallback(() => {
    setIsMouseOverImage(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsMouseOverImage(false);
  }, []);

  const draggableData = useMemo<TypesafeDraggableData | undefined>(() => {
    if (controlImage) {
      return {
        id: controlNetId,
        payloadType: 'IMAGE_DTO',
        payload: { imageDTO: controlImage },
      };
    }
  }, [controlImage, controlNetId]);

  const droppableData = useMemo<TypesafeDroppableData | undefined>(
    () => ({
      id: controlNetId,
      actionType: 'SET_CONTROLNET_IMAGE',
      context: { controlNetId },
    }),
    [controlNetId]
  );

  const postUploadAction = useMemo<PostUploadAction>(
    () => ({ type: 'SET_CONTROLNET_IMAGE', controlNetId }),
    [controlNetId]
  );

  const shouldShowProcessedImage =
    controlImage &&
    processedControlImage &&
    !isMouseOverImage &&
    !pendingControlImages.includes(controlNetId) &&
    processorType !== 'none';

  return (
    <Flex
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      sx={{
        position: 'relative',
        w: 'full',
        h: isSmall ? 28 : 366, // magic no touch
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: isEnabled ? 'auto' : 'none',
        opacity: isEnabled ? 1 : 0.5,
      }}
    >
      <IAIDndImage
        draggableData={draggableData}
        droppableData={droppableData}
        imageDTO={controlImage}
        isDropDisabled={shouldShowProcessedImage || !isEnabled}
        postUploadAction={postUploadAction}
      >
        <IAIDndImageIcon
          onClick={handleResetControlImage}
          icon={controlImage ? <FaUndo /> : undefined}
          tooltip="Reset Control Image"
        />
      </IAIDndImage>

      <Box
        sx={{
          position: 'absolute',
          top: 0,
          insetInlineStart: 0,
          w: 'full',
          h: 'full',
          opacity: shouldShowProcessedImage ? 1 : 0,
          transitionProperty: 'common',
          transitionDuration: 'normal',
          pointerEvents: 'none',
        }}
      >
        <IAIDndImage
          draggableData={draggableData}
          droppableData={droppableData}
          imageDTO={processedControlImage}
          isUploadDisabled={true}
          isDropDisabled={!isEnabled}
        >
          <IAIDndImageIcon
            onClick={handleResetControlImage}
            icon={controlImage ? <FaUndo /> : undefined}
            tooltip="Reset Control Image"
          />
        </IAIDndImage>
      </Box>
      {pendingControlImages.includes(controlNetId) && (
        <Flex
          sx={{
            position: 'absolute',
            top: 0,
            insetInlineStart: 0,
            w: 'full',
            h: 'full',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.8,
            borderRadius: 'base',
            bg: 'base.400',
            _dark: {
              bg: 'base.900',
            },
          }}
        >
          <Spinner
            size="xl"
            sx={{ color: 'base.100', _dark: { color: 'base.400' } }}
          />
        </Flex>
      )}
    </Flex>
  );
};

export default memo(ControlNetImagePreview);
