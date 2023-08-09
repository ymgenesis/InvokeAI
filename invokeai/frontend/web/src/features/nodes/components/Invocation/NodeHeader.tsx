import { Box, Flex, HStack, Spacer } from '@chakra-ui/react';
import {
  InvocationNodeData,
  InvocationTemplate,
} from 'features/nodes/types/types';
import { memo } from 'react';
import NodeCollapseButton from './NodeCollapseButton';
import NodeCollapsedHandles from './NodeCollapsedHandles';
import NodeNotesEdit from './NodeNotesEdit';
import NodeStatusIndicator from './NodeStatusIndicator';
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
      layerStyle="nodeHeader"
      sx={{
        borderTopRadius: 'base',
        borderBottomRadius: isOpen ? 0 : 'base',
        alignItems: 'center',
        justifyContent: 'space-between',
        h: 8,
      }}
    >
      <NodeCollapseButton data={data} />
      <NodeTitle data={data} title={template.title} />
      <Flex alignItems="center">
        <NodeStatusIndicator data={data} template={template} />
        <NodeNotesEdit data={data} template={template} />
      </Flex>
      {!isOpen && <NodeCollapsedHandles data={data} />}
    </Flex>
  );
};

export default memo(NodeHeader);
