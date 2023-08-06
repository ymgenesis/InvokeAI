import { Box } from '@chakra-ui/react';
import { RootState } from 'app/store/store';
import { useAppSelector } from 'app/store/storeHooks';
import { memo, useMemo } from 'react';
import { buildNodesGraph } from '../util/graphBuilders/buildNodesGraph';
import { useDebounce } from 'use-debounce';
import { omit } from 'lodash-es';

const useNodesGraph = () => {
  const nodes = useAppSelector((state: RootState) => state.nodes);
  const [debouncedNodes] = useDebounce(nodes, 300);
  const graph = useMemo(
    () => omit(buildNodesGraph(debouncedNodes), 'id'),
    [debouncedNodes]
  );

  return graph;
};

const NodeGraphOverlay = () => {
  const graph = useNodesGraph();

  return (
    <Box
      as="pre"
      sx={{
        fontFamily: 'monospace',
        position: 'absolute',
        top: 2,
        right: 2,
        opacity: 0.7,
        p: 2,
        maxHeight: 500,
        maxWidth: 500,
        overflowY: 'scroll',
        borderRadius: 'base',
        bg: 'base.200',
        _dark: { bg: 'base.800' },
      }}
    >
      {JSON.stringify(graph, null, 2)}
    </Box>
  );
};

export default memo(NodeGraphOverlay);
