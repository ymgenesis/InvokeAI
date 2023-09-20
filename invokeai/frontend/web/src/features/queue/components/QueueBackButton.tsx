import { ChakraProps } from '@chakra-ui/react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueueBack } from '../hooks/useQueueBack';
import EnqueueButtonTooltip from './QueueButtonTooltip';
import QueueButton from './common/QueueButton';
import GreyscaleInvokeAIIcon from 'common/components/GreyscaleInvokeAIIcon';

type Props = {
  asIconButton?: boolean;
  sx?: ChakraProps['sx'];
};

const QueueBackButton = ({ asIconButton, sx }: Props) => {
  const { t } = useTranslation();
  const { queueBack, isLoading, isDisabled } = useQueueBack();
  return (
    <QueueButton
      asIconButton={asIconButton}
      colorScheme="accent"
      label={t('parameters.invoke.invoke')}
      isDisabled={isDisabled}
      isLoading={isLoading}
      onClick={queueBack}
      tooltip={<EnqueueButtonTooltip />}
      sx={sx}
      icon={asIconButton ? <GreyscaleInvokeAIIcon /> : undefined}
    />
  );
};

export default memo(QueueBackButton);
