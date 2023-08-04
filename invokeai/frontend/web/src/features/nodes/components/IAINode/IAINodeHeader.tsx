import { Flex, useColorModeValue } from '@chakra-ui/react';
import { useChakraThemeTokens } from 'common/hooks/useChakraThemeTokens';
import { InvocationValue } from 'features/nodes/types/types';
import { memo } from 'react';
import IAINodeCollapseButton from './IAINodeCollapseButton';
import IAINodeCollapsedHandles from './IAINodeCollapsedHandles';
import IAINodeSettings from './IAINodeSettings';
import IAINodeTitle from './IAINodeTitle';

interface IAINodeHeaderProps {
  data: InvocationValue;
  title: string;
  description: string;
}

const IAINodeHeader = (props: IAINodeHeaderProps) => {
  const { data, title, description } = props;
  const { isOpen } = data;
  const { base400, base600 } = useChakraThemeTokens();
  const backgroundColor = useColorModeValue(base400, base600);

  return (
    <Flex
      sx={{
        borderTopRadius: 'base',
        borderBottomRadius: isOpen ? 0 : 'base',
        alignItems: 'center',
        justifyContent: 'space-between',
        h: 8,
        bg: 'base.200',
        _dark: { bg: 'base.750' },
      }}
    >
      <IAINodeCollapseButton data={data} />
      <IAINodeTitle data={data} title={title} description={description} />
      <IAINodeSettings data={data} />
      {!isOpen && <IAINodeCollapsedHandles data={data} />}
    </Flex>
  );
};

export default memo(IAINodeHeader);
