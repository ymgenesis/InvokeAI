import { Flex } from '@chakra-ui/react';
import {
  InvocationNodeData,
  InvocationTemplate,
} from 'features/nodes/types/types';
import { memo } from 'react';
import NodeCollapseButton from './NodeCollapseButton';
import NodeCollapsedHandles from './NodeCollapsedHandles';
import NodeNotesEdit from './NodeNotesEdit';
import NodeTitle from './NodeTitle';

interface Props {
  data: InvocationNodeData;
  template: InvocationTemplate;
}

const NodeHeader = (props: Props) => {
  const { data, template } = props;
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
      <NodeTitle data={data} title={template.title} />
      <NodeNotesEdit data={data} template={template} />
      {!isOpen && <NodeCollapsedHandles data={data} />}
    </Flex>
  );
};

export default memo(NodeHeader);
