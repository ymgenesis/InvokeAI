import { Box, Flex } from '@chakra-ui/react';
import InspectorPanel from 'features/nodes/components/panel/InspectorPanel';
import ResizeHandle from 'features/ui/components/tabs/ResizeHandle';
import { memo, useState } from 'react';
import { Panel, PanelGroup } from 'react-resizable-panels';
import 'reactflow/dist/style.css';
import { Flow } from './Flow';

const NodeEditor = () => {
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

  return (
    <PanelGroup
      id="node-editor"
      autoSaveId="node-editor"
      direction="horizontal"
      style={{ height: '100%', width: '100%' }}
    >
      <Panel
        id="node-editor-panel"
        collapsible
        onCollapse={setIsPanelCollapsed}
        minSize={25}
      >
        <PanelGroup
          id="node-editor-panel_group"
          autoSaveId="node-editor-panel_gropu"
          direction="vertical"
        >
          <Panel id="node-editor-panel_bottom" minSize={25}>
            <Flex
              layerStyle="first"
              sx={{
                w: 'full',
                h: 'full',
                borderRadius: 'base',
              }}
            ></Flex>
          </Panel>
          <ResizeHandle direction="vertical" />
          <Panel id="node-editor-panel_top" minSize={25}>
            <InspectorPanel />
          </Panel>
        </PanelGroup>
      </Panel>
      <ResizeHandle
        collapsedDirection={isPanelCollapsed ? 'left' : undefined}
      />
      <Panel id="node-editor-content">
        <Box
          layerStyle={'first'}
          sx={{
            position: 'relative',
            width: 'full',
            height: 'full',
            borderRadius: 'base',
          }}
        >
          <Flow />
        </Box>
      </Panel>
    </PanelGroup>
  );
};

export default memo(NodeEditor);
