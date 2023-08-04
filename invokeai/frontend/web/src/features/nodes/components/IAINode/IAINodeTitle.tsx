import { Flex, Heading, Tooltip } from '@chakra-ui/react';
import { DRAG_HANDLE_CLASSNAME } from 'features/nodes/hooks/useBuildInvocation';
import { InvocationValue } from 'features/nodes/types/types';
import { memo } from 'react';

interface IAINodeTitleProps {
  data: InvocationValue;
  title: string;
  description: string;
}

const IAINodeTitle = (props: IAINodeTitleProps) => {
  const { data, title, description } = props;
  const { userLabel } = data;

  return (
    <Flex
      className={DRAG_HANDLE_CLASSNAME}
      sx={{
        w: 'full',
        h: 'full',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Tooltip
        label={`${title}: ${description}`}
        placement="top"
        hasArrow
        openDelay={500}
      >
        <Heading
          size="xs"
          sx={{
            mb: 0.5,
            fontWeight: 600,
            color: 'base.750',
            _dark: { color: 'base.200' },
          }}
        >
          {userLabel || title}
        </Heading>
      </Tooltip>
    </Flex>
  );
};

export default memo(IAINodeTitle);
