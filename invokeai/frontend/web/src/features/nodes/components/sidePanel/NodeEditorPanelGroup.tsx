import { Flex } from '@chakra-ui/react';
import QueueControls from 'features/queue/components/QueueControls';
import ResizeHandle from 'features/ui/components/tabs/ResizeHandle';
import { usePanelStorage } from 'features/ui/hooks/usePanelStorage';
import { memo, useCallback, useRef, useState } from 'react';
import {
  ImperativePanelGroupHandle,
  Panel,
  PanelGroup,
} from 'react-resizable-panels';
import 'reactflow/dist/style.css';
import InspectorPanel from './inspector/InspectorPanel';
import WorkflowPanel from './workflow/WorkflowPanel';
import ParamIterations from 'features/parameters/components/Parameters/Core/ParamIterations';

const NodeEditorPanelGroup = () => {
  const [isTopPanelCollapsed, setIsTopPanelCollapsed] = useState(false);
  const [isBottomPanelCollapsed, setIsBottomPanelCollapsed] = useState(false);
  const panelGroupRef = useRef<ImperativePanelGroupHandle>(null);
  const panelStorage = usePanelStorage();
  const handleDoubleClickHandle = useCallback(() => {
    if (!panelGroupRef.current) {
      return;
    }
    panelGroupRef.current.setLayout([50, 50]);
  }, []);

  return (
    <Flex sx={{ flexDir: 'column', gap: 2, height: '100%', width: '100%' }}>
      <QueueControls />
      <Flex
        layerStyle="first"
        sx={{
          w: 'full',
          position: 'relative',
          borderRadius: 'base',
          p: 2,
          pb: 3,
          gap: 2,
          flexDir: 'column',
        }}
      >
        <ParamIterations asSlider />
      </Flex>
      <PanelGroup
        ref={panelGroupRef}
        id="workflow-panel-group"
        autoSaveId="workflow-panel-group"
        direction="vertical"
        style={{ height: '100%', width: '100%' }}
        storage={panelStorage}
      >
        <Panel
          id="workflow"
          collapsible
          onCollapse={setIsTopPanelCollapsed}
          minSize={25}
        >
          <WorkflowPanel />
        </Panel>
        <ResizeHandle
          direction="vertical"
          onDoubleClick={handleDoubleClickHandle}
          collapsedDirection={
            isTopPanelCollapsed
              ? 'top'
              : isBottomPanelCollapsed
              ? 'bottom'
              : undefined
          }
        />
        <Panel
          id="inspector"
          collapsible
          onCollapse={setIsBottomPanelCollapsed}
          minSize={25}
        >
          <InspectorPanel />
        </Panel>
      </PanelGroup>
    </Flex>
  );
};

export default memo(NodeEditorPanelGroup);
