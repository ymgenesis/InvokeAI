import { createSelector } from '@reduxjs/toolkit';
import { stateSelector } from 'app/store/store';
import { getIsGraphAcyclic } from 'features/nodes/hooks/useIsValidConnection';
import { FieldType } from 'features/nodes/types/types';
import { HandleType } from 'reactflow';

export const makeConnectionErrorSelector = (
  nodeId: string,
  fieldName: string,
  handleType: HandleType,
  fieldType: FieldType
) =>
  createSelector(stateSelector, (state) => {
    const { currentConnectionFieldType, connectionStartParams, nodes, edges } =
      state.nodes;
    if (!connectionStartParams || !currentConnectionFieldType) {
      // there is no connection in progress
      return 'No connection in progress';
    }

    const {
      handleType: connectionHandleType,
      nodeId: connectionNodeId,
      handleId: connectionFieldName,
    } = connectionStartParams;

    if (!connectionHandleType || !connectionNodeId || !connectionFieldName) {
      return 'No connection data';
    }

    if (nodeId === connectionNodeId) {
      return 'Cannot connect to self';
    }

    if (
      fieldType !== currentConnectionFieldType &&
      fieldType !== 'CollectionItem' &&
      currentConnectionFieldType !== 'CollectionItem'
    ) {
      // except for collection items, field types must match
      return 'Field types must match';
    }

    if (handleType === connectionHandleType) {
      if (handleType === 'source') {
        return 'Cannot connect output to output';
      }
      return 'Cannot connect input to input';
    }

    if (
      handleType === 'target' &&
      edges.find((edge) => {
        return edge.target === nodeId && edge.targetHandle === fieldName;
      })
    ) {
      return 'Inputs may only have one connection';
    }

    const isGraphAcyclic = getIsGraphAcyclic(
      connectionHandleType === 'source' ? connectionNodeId : nodeId,
      connectionHandleType === 'source' ? nodeId : connectionNodeId,
      nodes,
      edges
    );

    if (!isGraphAcyclic) {
      return 'Connection would create a cycle';
    }

    return null;
  });
