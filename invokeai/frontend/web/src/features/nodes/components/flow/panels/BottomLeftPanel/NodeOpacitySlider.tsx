import {
  Flex,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
} from '@chakra-ui/react';
import { useAppDispatch, useAppSelector } from 'app/store/storeHooks';
import { nodeOpacityChanged } from 'features/nodes/store/nodesSlice';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export default function NodeOpacitySlider() {
  const dispatch = useAppDispatch();
  const nodeOpacity = useAppSelector((state) => state.nodes.nodeOpacity);
  const { t } = useTranslation();

  const handleChange = useCallback(
    (v: number) => {
      dispatch(nodeOpacityChanged(v));
    },
    [dispatch]
  );

  return (
    <Flex alignItems="center">
      <Slider
        aria-label={t('nodes.nodeOpacity')}
        value={nodeOpacity}
        min={0.5}
        max={1}
        step={0.01}
        onChange={handleChange}
        orientation="vertical"
        defaultValue={30}
        h="calc(100% - 0.5rem)"
      >
        <SliderTrack>
          <SliderFilledTrack />
        </SliderTrack>
        <SliderThumb />
      </Slider>
    </Flex>
  );
}
