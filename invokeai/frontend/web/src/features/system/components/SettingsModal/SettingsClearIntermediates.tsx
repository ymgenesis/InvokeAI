import { Heading, Text } from '@chakra-ui/react';
import { useAppDispatch } from 'app/store/storeHooks';
import { controlAdaptersReset } from 'features/controlAdapters/store/controlAdaptersSlice';
import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import IAIButton from '../../../../common/components/IAIButton';
import {
  useClearIntermediatesMutation,
  useGetIntermediatesCountQuery,
} from '../../../../services/api/endpoints/images';
import { resetCanvas } from '../../../canvas/store/canvasSlice';
import { addToast } from '../../store/systemSlice';
import StyledFlex from './StyledFlex';

export default function SettingsClearIntermediates() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const { data: intermediatesCount, refetch: updateIntermediatesCount } =
    useGetIntermediatesCountQuery();

  const [clearIntermediates, { isLoading: isLoadingClearIntermediates }] =
    useClearIntermediatesMutation();

  const handleClickClearIntermediates = useCallback(() => {
    clearIntermediates()
      .unwrap()
      .then((clearedCount) => {
        dispatch(controlAdaptersReset());
        dispatch(resetCanvas());
        dispatch(
          addToast({
            title: t('settings.intermediatesCleared', { count: clearedCount }),
            status: 'info',
          })
        );
      })
      .catch(() => {
        dispatch(
          addToast({
            title: t('settings.intermediatesClearedFailed'),
            status: 'error',
          })
        );
      });
  }, [t, clearIntermediates, dispatch]);

  useEffect(() => {
    // update the count on mount
    updateIntermediatesCount();
  }, [updateIntermediatesCount]);

  return (
    <StyledFlex>
      <Heading size="sm">{t('settings.clearIntermediates')}</Heading>
      <IAIButton
        colorScheme="warning"
        onClick={handleClickClearIntermediates}
        isLoading={isLoadingClearIntermediates}
        isDisabled={!intermediatesCount}
      >
        {t('settings.clearIntermediatesWithCount', {
          count: intermediatesCount ?? 0,
        })}
      </IAIButton>
      <Text fontWeight="bold">{t('settings.clearIntermediatesDesc1')}</Text>
      <Text variant="subtext">{t('settings.clearIntermediatesDesc2')}</Text>
      <Text variant="subtext">{t('settings.clearIntermediatesDesc3')}</Text>
    </StyledFlex>
  );
}
