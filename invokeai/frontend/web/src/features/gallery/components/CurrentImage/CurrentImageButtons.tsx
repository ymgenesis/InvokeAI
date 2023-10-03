import { createSelector } from '@reduxjs/toolkit';
import { isEqual } from 'lodash-es';

import {
  ButtonGroup,
  Flex,
  FlexProps,
  Menu,
  MenuButton,
  MenuList,
} from '@chakra-ui/react';
import { skipToken } from '@reduxjs/toolkit/dist/query';
import { useAppToaster } from 'app/components/Toaster';
import { upscaleRequested } from 'app/store/middleware/listenerMiddleware/listeners/upscaleRequested';
import { stateSelector } from 'app/store/store';
import { useAppDispatch, useAppSelector } from 'app/store/storeHooks';
import IAIIconButton from 'common/components/IAIIconButton';
import { DeleteImageButton } from 'features/deleteImageModal/components/DeleteImageButton';
import { imagesToDeleteSelected } from 'features/deleteImageModal/store/slice';
import { workflowLoadRequested } from 'features/nodes/store/actions';
import ParamUpscalePopover from 'features/parameters/components/Parameters/Upscale/ParamUpscaleSettings';
import { useRecallParameters } from 'features/parameters/hooks/useRecallParameters';
import { initialImageSelected } from 'features/parameters/store/actions';
import { useIsQueueMutationInProgress } from 'features/queue/hooks/useIsQueueMutationInProgress';
import { useFeatureStatus } from 'features/system/hooks/useFeatureStatus';
import { activeTabNameSelector } from 'features/ui/store/uiSelectors';
import {
  setShouldShowImageDetails,
  setShouldShowProgressInViewer,
} from 'features/ui/store/uiSlice';
import { memo, useCallback, useMemo } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useTranslation } from 'react-i18next';
import {
  FaAsterisk,
  FaCode,
  FaHourglassHalf,
  FaQuoteRight,
  FaSeedling,
} from 'react-icons/fa';
import { FaCircleNodes, FaEllipsis } from 'react-icons/fa6';
import {
  useGetImageDTOQuery,
  useGetImageMetadataFromFileQuery,
} from 'services/api/endpoints/images';
import { menuListMotionProps } from 'theme/components/menu';
import { sentImageToImg2Img } from '../../store/actions';
import SingleSelectionMenuItems from '../ImageContextMenu/SingleSelectionMenuItems';

const currentImageButtonsSelector = createSelector(
  [stateSelector, activeTabNameSelector],
  ({ gallery, system, ui, config }, activeTabName) => {
    const { isConnected, shouldConfirmOnDelete, denoiseProgress } = system;

    const {
      shouldShowImageDetails,
      shouldHidePreview,
      shouldShowProgressInViewer,
    } = ui;

    const { shouldFetchMetadataFromApi } = config;

    const lastSelectedImage = gallery.selection[gallery.selection.length - 1];

    return {
      shouldConfirmOnDelete,
      isConnected,
      shouldDisableToolbarButtons:
        Boolean(denoiseProgress?.progress_image) || !lastSelectedImage,
      shouldShowImageDetails,
      activeTabName,
      shouldHidePreview,
      shouldShowProgressInViewer,
      lastSelectedImage,
      shouldFetchMetadataFromApi,
    };
  },
  {
    memoizeOptions: {
      resultEqualityCheck: isEqual,
    },
  }
);

type CurrentImageButtonsProps = FlexProps;

const CurrentImageButtons = (props: CurrentImageButtonsProps) => {
  const dispatch = useAppDispatch();
  const {
    isConnected,
    shouldDisableToolbarButtons,
    shouldShowImageDetails,
    lastSelectedImage,
    shouldShowProgressInViewer,
    shouldFetchMetadataFromApi,
  } = useAppSelector(currentImageButtonsSelector);

  const isUpscalingEnabled = useFeatureStatus('upscaling').isFeatureEnabled;
  const isQueueMutationInProgress = useIsQueueMutationInProgress();
  const toaster = useAppToaster();
  const { t } = useTranslation();

  const { recallBothPrompts, recallSeed, recallAllParameters } =
    useRecallParameters();

  const { currentData: imageDTO } = useGetImageDTOQuery(
    lastSelectedImage?.image_name ?? skipToken
  );

  const getMetadataArg = useMemo(() => {
    if (lastSelectedImage) {
      return { image: lastSelectedImage, shouldFetchMetadataFromApi };
    } else {
      return skipToken;
    }
  }, [lastSelectedImage, shouldFetchMetadataFromApi]);

  const { metadata, workflow, isLoading } = useGetImageMetadataFromFileQuery(
    getMetadataArg,
    {
      selectFromResult: (res) => ({
        isLoading: res.isFetching,
        metadata: res?.currentData?.metadata,
        workflow: res?.currentData?.workflow,
      }),
    }
  );

  const handleLoadWorkflow = useCallback(() => {
    if (!workflow) {
      return;
    }
    dispatch(workflowLoadRequested(workflow));
  }, [dispatch, workflow]);

  const handleClickUseAllParameters = useCallback(() => {
    recallAllParameters(metadata);
  }, [metadata, recallAllParameters]);

  useHotkeys(
    'a',
    () => {
      handleClickUseAllParameters;
    },
    [metadata, recallAllParameters]
  );

  const handleUseSeed = useCallback(() => {
    recallSeed(metadata?.seed);
  }, [metadata?.seed, recallSeed]);

  useHotkeys('s', handleUseSeed, [imageDTO]);

  const handleUsePrompt = useCallback(() => {
    recallBothPrompts(
      metadata?.positive_prompt,
      metadata?.negative_prompt,
      metadata?.positive_style_prompt,
      metadata?.negative_style_prompt
    );
  }, [
    metadata?.negative_prompt,
    metadata?.positive_prompt,
    metadata?.positive_style_prompt,
    metadata?.negative_style_prompt,
    recallBothPrompts,
  ]);

  useHotkeys('p', handleUsePrompt, [imageDTO]);

  useHotkeys('w', handleLoadWorkflow, [workflow]);

  const handleSendToImageToImage = useCallback(() => {
    dispatch(sentImageToImg2Img());
    dispatch(initialImageSelected(imageDTO));
  }, [dispatch, imageDTO]);

  useHotkeys('shift+i', handleSendToImageToImage, [imageDTO]);

  const handleClickUpscale = useCallback(() => {
    if (!imageDTO) {
      return;
    }
    dispatch(upscaleRequested({ imageDTO }));
  }, [dispatch, imageDTO]);

  const handleDelete = useCallback(() => {
    if (!imageDTO) {
      return;
    }
    dispatch(imagesToDeleteSelected([imageDTO]));
  }, [dispatch, imageDTO]);

  useHotkeys(
    'Shift+U',
    () => {
      handleClickUpscale();
    },
    {
      enabled: () =>
        Boolean(
          isUpscalingEnabled && !shouldDisableToolbarButtons && isConnected
        ),
    },
    [isUpscalingEnabled, imageDTO, shouldDisableToolbarButtons, isConnected]
  );

  const handleClickShowImageDetails = useCallback(
    () => dispatch(setShouldShowImageDetails(!shouldShowImageDetails)),
    [dispatch, shouldShowImageDetails]
  );

  useHotkeys(
    'i',
    () => {
      if (imageDTO) {
        handleClickShowImageDetails();
      } else {
        toaster({
          title: t('toast.metadataLoadFailed'),
          status: 'error',
          duration: 2500,
          isClosable: true,
        });
      }
    },
    [imageDTO, shouldShowImageDetails, toaster]
  );

  useHotkeys(
    'delete',
    () => {
      handleDelete();
    },
    [dispatch, imageDTO]
  );

  const handleClickProgressImagesToggle = useCallback(() => {
    dispatch(setShouldShowProgressInViewer(!shouldShowProgressInViewer));
  }, [dispatch, shouldShowProgressInViewer]);

  useHotkeys(
    'Shift+P',
    () => {
      if (imageDTO) {
        handleClickProgressImagesToggle();
      }
    },
    [imageDTO, shouldShowProgressInViewer]
  );

  return (
    <>
      <Flex
        sx={{
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 2,
        }}
        {...props}
      >
        <ButtonGroup isAttached={true} isDisabled={shouldDisableToolbarButtons}>
          <Menu>
            <MenuButton
              as={IAIIconButton}
              aria-label={t('parameters.imageActions')}
              tooltip={t('parameters.imageActions')}
              isDisabled={!imageDTO}
              icon={<FaEllipsis />}
            />
            <MenuList motionProps={menuListMotionProps}>
              {imageDTO && <SingleSelectionMenuItems imageDTO={imageDTO} />}
            </MenuList>
          </Menu>
        </ButtonGroup>

        <ButtonGroup isAttached={true} isDisabled={shouldDisableToolbarButtons}>
          <IAIIconButton
            isLoading={isLoading}
            icon={<FaCircleNodes />}
            tooltip={`${t('nodes.loadWorkflow')} (W)`}
            aria-label={`${t('nodes.loadWorkflow')} (W)`}
            isDisabled={!workflow}
            onClick={handleLoadWorkflow}
          />
          <IAIIconButton
            isLoading={isLoading}
            icon={<FaQuoteRight />}
            tooltip={`${t('parameters.usePrompt')} (P)`}
            aria-label={`${t('parameters.usePrompt')} (P)`}
            isDisabled={!metadata?.positive_prompt}
            onClick={handleUsePrompt}
          />
          <IAIIconButton
            isLoading={isLoading}
            icon={<FaSeedling />}
            tooltip={`${t('parameters.useSeed')} (S)`}
            aria-label={`${t('parameters.useSeed')} (S)`}
            isDisabled={metadata?.seed === null || metadata?.seed === undefined}
            onClick={handleUseSeed}
          />
          <IAIIconButton
            isLoading={isLoading}
            icon={<FaAsterisk />}
            tooltip={`${t('parameters.useAll')} (A)`}
            aria-label={`${t('parameters.useAll')} (A)`}
            isDisabled={!metadata}
            onClick={handleClickUseAllParameters}
          />
        </ButtonGroup>

        {isUpscalingEnabled && (
          <ButtonGroup isAttached={true} isDisabled={isQueueMutationInProgress}>
            {isUpscalingEnabled && <ParamUpscalePopover imageDTO={imageDTO} />}
          </ButtonGroup>
        )}

        <ButtonGroup isAttached={true}>
          <IAIIconButton
            icon={<FaCode />}
            tooltip={`${t('parameters.info')} (I)`}
            aria-label={`${t('parameters.info')} (I)`}
            isChecked={shouldShowImageDetails}
            onClick={handleClickShowImageDetails}
          />
        </ButtonGroup>

        <ButtonGroup isAttached={true}>
          <IAIIconButton
            aria-label={t('settings.displayInProgress')}
            tooltip={`${t('settings.displayInProgress')} (Shift+P)`}
            icon={<FaHourglassHalf />}
            isChecked={shouldShowProgressInViewer}
            onClick={handleClickProgressImagesToggle}
          />
        </ButtonGroup>

        <ButtonGroup isAttached={true}>
          <DeleteImageButton onClick={handleDelete} />
        </ButtonGroup>
      </Flex>
    </>
  );
};

export default memo(CurrentImageButtons);
