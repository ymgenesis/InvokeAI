// TODO: enable this at some point
import { useAppSelector } from 'app/store/storeHooks';
import { useCallback } from 'react';
import { Connection, Node, useReactFlow } from 'reactflow';
import { validateSourceAndTargetTypes } from '../store/util/validateSourceAndTargetTypes';
import { getIsGraphAcyclic } from '../store/util/getIsGraphAcyclic';
import { InvocationNodeData } from '../types/types';

/**
 * NOTE: The logic here must be duplicated in `invokeai/frontend/web/src/features/nodes/store/util/makeIsConnectionValidSelector.ts`
 * TODO: Figure out how to do this without duplicating all the logic
 */

export const useIsValidConnection = () => {
  const flow = useReactFlow();
  const shouldValidateGraph = useAppSelector(
    (state) => state.nodes.shouldValidateGraph
  );
  const isValidConnection = useCallback(
    ({ source, sourceHandle, target, targetHandle }: Connection): boolean => {
      const edges = flow.getEdges();
      const nodes = flow.getNodes();
      // Connection must have valid targets
      if (!(source && sourceHandle && target && targetHandle)) {
        return false;
      }

      // Find the source and target nodes
      const sourceNode = flow.getNode(source) as Node<InvocationNodeData>;
      const targetNode = flow.getNode(target) as Node<InvocationNodeData>;

      // Conditional guards against undefined nodes/handles
      if (!(sourceNode && targetNode && sourceNode.data && targetNode.data)) {
        return false;
      }

      const sourceType = sourceNode.data.outputs[sourceHandle]?.type;
      const targetType = targetNode.data.inputs[targetHandle]?.type;

      if (!sourceType || !targetType) {
        // something has gone terribly awry
        return false;
      }

      if (source === target) {
        // Don't allow nodes to connect to themselves, even if validation is disabled
        return false;
      }

      if (!shouldValidateGraph) {
        // manual override!
        return true;
      }

      if (
        edges.find((edge) => {
          edge.target === target &&
            edge.targetHandle === targetHandle &&
            edge.source === source &&
            edge.sourceHandle === sourceHandle;
        })
      ) {
        // We already have a connection from this source to this target
        return false;
      }

      // Connection is invalid if target already has a connection
      if (
        edges.find((edge) => {
          return edge.target === target && edge.targetHandle === targetHandle;
        }) &&
        // except CollectionItem inputs can have multiples
        targetType !== 'CollectionItem'
      ) {
        return false;
      }

      if (!validateSourceAndTargetTypes(sourceType, targetType)) {
        return false;
      }

      // Graphs much be acyclic (no loops!)
      return getIsGraphAcyclic(source, target, nodes, edges);
    },
    [flow, shouldValidateGraph]
  );

  return isValidConnection;
};
