import { createSelector } from '@reduxjs/toolkit';
import { stateSelector } from 'app/store/store';
import { useAppSelector } from 'app/store/storeHooks';
import { defaultSelectorOptions } from 'app/store/util/defaultMemoizeOptions';
import { IAINoContentFallback } from 'common/components/IAIImageFallback';
import DataViewer from 'features/gallery/components/ImageMetadataViewer/DataViewer';
import { memo } from 'react';

const selector = createSelector(
  stateSelector,
  ({ nodes }) => {
    const lastSelectedNodeId =
      nodes.selectedNodes[nodes.selectedNodes.length - 1];

    const lastSelectedNode = nodes.nodes.find(
      (node) => node.id === lastSelectedNodeId
    );

    const lastSelectedNodeTemplate = lastSelectedNode
      ? nodes.nodeTemplates[lastSelectedNode.data.type]
      : undefined;

    return {
      template: lastSelectedNodeTemplate,
    };
  },
  defaultSelectorOptions
);

const NodeTemplateInspector = () => {
  const { template } = useAppSelector(selector);

  if (!template) {
    return <IAINoContentFallback label="No node selected" icon={null} />;
  }

  return <DataViewer data={template} label="Node Template" />;
};

export default memo(NodeTemplateInspector);
