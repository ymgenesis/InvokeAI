import {
  Box,
  Flex,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
} from '@chakra-ui/react';
import { createSelector } from '@reduxjs/toolkit';
import { RootState, stateSelector } from 'app/store/store';
import { useAppSelector } from 'app/store/storeHooks';
import { defaultSelectorOptions } from 'app/store/util/defaultMemoizeOptions';
import { IAINoContentFallback } from 'common/components/IAIImageFallback';
import ImageMetadataJSON from 'features/gallery/components/ImageMetadataViewer/ImageMetadataJSON';
import { buildWorkflow } from 'features/nodes/util/buildWorkflow';
import { size } from 'lodash-es';
import { memo, useMemo } from 'react';
import { useDebounce } from 'use-debounce';

const useWatchWorkflow = () => {
  const nodes = useAppSelector((state: RootState) => state.nodes);
  const [debouncedNodes] = useDebounce(nodes, 300);
  const workflow = useMemo(
    () => buildWorkflow(debouncedNodes),
    [debouncedNodes]
  );

  return {
    workflow,
    nodeCount: size(workflow.nodes),
    edgeCount: size(workflow.edges),
  };
};

const selector = createSelector(
  stateSelector,
  ({ nodes }) => {
    const lastSelectedNodeId =
      nodes.selectedNodes[nodes.selectedNodes.length - 1];

    const lastSelectedNode = nodes.nodes.find(
      (node) => node.id === lastSelectedNodeId
    );

    const lastSelectedNodeTemplate = lastSelectedNode
      ? nodes.invocationTemplates[lastSelectedNode.data.type]
      : undefined;

    return {
      node: lastSelectedNode,
      template: lastSelectedNodeTemplate,
    };
  },
  defaultSelectorOptions
);

const InspectorPanel = () => {
  const { node, template } = useAppSelector(selector);
  const { workflow, nodeCount, edgeCount } = useWatchWorkflow();

  return (
    <Flex
      layerStyle="first"
      sx={{
        w: 'full',
        h: 'full',
        borderRadius: 'base',
        p: 4,
      }}
    >
      <Tabs
        variant="line"
        sx={{ display: 'flex', flexDir: 'column', w: 'full', h: 'full' }}
      >
        <TabList>
          <Tab>Workflow</Tab>
          <Tab>Node Template</Tab>
          <Tab>Node Data</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <Flex
              sx={{
                flexDir: 'column',
                alignItems: 'flex-start',
                gap: 2,
                h: 'full',
              }}
            >
              <Box px={2}>
                <Text fontSize="sm" fontWeight={600}>
                  {nodeCount} node{nodeCount === 1 ? '' : 's'}, {edgeCount} edge
                  {edgeCount === 1 ? '' : 's'}
                </Text>
              </Box>
              <ImageMetadataJSON
                jsonObject={workflow}
                copyTooltip="Copy Workflow JSON"
              />
            </Flex>
          </TabPanel>
          <TabPanel>
            {template ? (
              <Flex
                sx={{
                  flexDir: 'column',
                  alignItems: 'flex-start',
                  gap: 2,
                  h: 'full',
                }}
              >
                <Box px={2}>
                  <Text fontSize="sm" fontWeight={600}>
                    {template?.title}
                  </Text>
                  <Text variant="subtext" fontSize="sm">
                    {template?.description}
                  </Text>
                </Box>
                <ImageMetadataJSON
                  jsonObject={template}
                  copyTooltip="Copy Node Template"
                />
              </Flex>
            ) : (
              <IAINoContentFallback
                label="No node template found"
                icon={null}
              />
            )}
          </TabPanel>
          <TabPanel>
            {node ? (
              <ImageMetadataJSON
                jsonObject={node.data}
                copyTooltip="Copy Node Data"
              />
            ) : (
              <IAINoContentFallback label="No node selected" icon={null} />
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Flex>
  );
};

export default memo(InspectorPanel);
