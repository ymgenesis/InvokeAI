import { Box } from '@chakra-ui/react';
import InspectorPanel from 'features/nodes/components/panel/InspectorPanel';
import ResizeHandle from 'features/ui/components/tabs/ResizeHandle';
import { useMinimumPanelSize } from 'features/ui/hooks/useMinimumPanelSize';
import { memo, useState } from 'react';
import { Panel, PanelGroup } from 'react-resizable-panels';
import 'reactflow/dist/style.css';
import { Flow } from './Flow';
import WorkflowPanel from './panel/WorkflowPanel';

const NodeEditor = () => {
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const { ref, minSizePct } = useMinimumPanelSize(
    350,
    25,
    'node-editor-panel_group',
    'vertical'
  );

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
          autoSaveId="node-editor-panel_group"
          direction="vertical"
          style={{ height: '100%', width: '100%' }}
        >
          <Panel
            ref={ref}
            id="node-editor-panel_group_workflow"
            minSize={minSizePct}
            defaultSize={
              minSizePct > 25 && minSizePct < 100 // prevent this error https://github.com/bvaughn/react-resizable-panels/blob/main/packages/react-resizable-panels/src/Panel.ts#L96
                ? minSizePct
                : 25
            }
          >
            <WorkflowPanel />
          </Panel>
          <ResizeHandle direction="vertical" />
          <Panel id="node-editor-panel_group_inspector" minSize={25}>
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
