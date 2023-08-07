import { Flex } from '@chakra-ui/react';
import { InvocationValue } from 'features/nodes/types/types';
import { memo } from 'react';
import NodeCollapseButton from './NodeCollapseButton';
import NodeCollapsedHandles from './NodeCollapsedHandles';
import NodeSettings from './NodeSettings';
import NodeTitle from './NodeTitle';

interface Props {
  data: InvocationValue;
  title: string;
  description: string;
}

const NodeHeader = (props: Props) => {
  const { data, title, description } = props;
  const { isOpen } = data;

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
      <NodeCollapseButton data={data} />
      <NodeTitle data={data} title={title} description={description} />
      <NodeSettings data={data} />
      {!isOpen && <NodeCollapsedHandles data={data} />}
    </Flex>
  );
};

export default memo(NodeHeader);
